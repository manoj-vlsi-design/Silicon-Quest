export interface TwosCompResult {
  aBits: string;
  bBits: string;
  sumBits: string;
  carries: number[]; // [c0, c1, c2, c3, c4]
  cinMsb: number;
  coutMsb: number;
  overflow: boolean;
  signedSum: number;
  idealSum: number;
  unsignedSum: number;
}

export function to4BitTwosComp(val: number): string {
  const clamped = Math.max(-8, Math.min(7, Math.trunc(val)));
  const unsigned = clamped < 0 ? 16 + clamped : clamped;
  return unsigned.toString(2).padStart(4, '0');
}

export function computeTwosCompAdder(a: number, b: number): TwosCompResult {
  const ca = Math.max(-8, Math.min(7, Math.trunc(a)));
  const cb = Math.max(-8, Math.min(7, Math.trunc(b)));
  const ua = ca < 0 ? 16 + ca : ca;
  const ub = cb < 0 ? 16 + cb : cb;

  const carries = [0, 0, 0, 0, 0];
  let sumUnsigned = 0;
  for (let bit = 0; bit < 4; bit++) {
    const ab = (ua >> bit) & 1;
    const bb = (ub >> bit) & 1;
    const cin = carries[bit];
    const s = ab ^ bb ^ cin;
    const cout = (ab & bb) | (ab & cin) | (bb & cin);
    carries[bit + 1] = cout;
    sumUnsigned |= s << bit;
  }

  const cinMsb = carries[3];
  const coutMsb = carries[4];
  const overflow = (cinMsb ^ coutMsb) === 1;
  const signedSum = sumUnsigned >= 8 ? sumUnsigned - 16 : sumUnsigned;

  return {
    aBits: to4BitTwosComp(ca),
    bBits: to4BitTwosComp(cb),
    sumBits: sumUnsigned.toString(2).padStart(4, '0'),
    carries,
    cinMsb,
    coutMsb,
    overflow,
    signedSum,
    idealSum: ca + cb,
    unsignedSum: ua + ub,
  };
}

export interface HazardSample {
  timePs: number;
  a: number;
  aNot: number;
  termAB: number;
  termAnC: number;
  termBC: number;
  outputF: number;
}

export interface HazardTraceResult {
  samples: HazardSample[];
  glitchDetected: boolean;
  glitchWidthPs: number;
}

export function evaluateStaticHazardTrace(
  consensusEnabled: boolean,
  invDelayPs: number,
  b: number = 1,
  c: number = 1
): HazardTraceResult {
  const delay = Math.max(20, Math.min(180, Math.round(invDelayPs)));
  const switchTime = 200;
  const times = [0, 100, 199, 200, 220, 260, 300, 340, 380, 420, 500];
  if (!times.includes(switchTime + delay)) {
    times.push(switchTime + delay);
    times.sort((x, y) => x - y);
  }

  let minHighDip = false;
  const samples: HazardSample[] = times.map((t) => {
    const a = t < switchTime ? 1 : 0;
    const aNot = t < switchTime + delay ? 0 : 1;
    const termAB = a & b;
    const termAnC = aNot & c;
    const termBC = consensusEnabled ? b & c : 0;
    const outputF = termAB | termAnC | termBC;
    if (b === 1 && c === 1 && outputF === 0) {
      minHighDip = true;
    }
    return { timePs: t, a, aNot, termAB, termAnC, termBC, outputF };
  });

  return {
    samples,
    glitchDetected: minHighDip,
    glitchWidthPs: minHighDip ? delay : 0,
  };
}

export interface LatchVsFfResult {
  setupViolation: boolean;
  holdViolation: boolean;
  metastable: boolean;
  latchPassesGlitch: boolean;
  ffCapturedValue: 'NEW' | 'OLD' | 'METASTABLE';
  slackPs: number;
}

/**
 * dEdgeOffsetPs: position of data transition relative to posedge clk (0 ps).
 * Negative means before clock edge; positive means after clock edge.
 */
export function evaluateLatchVsFlipFlop(
  dEdgeOffsetPs: number,
  setupPs: number,
  holdPs: number
): LatchVsFfResult {
  const setupViolation = dEdgeOffsetPs > -setupPs && dEdgeOffsetPs <= 0;
  const holdViolation = dEdgeOffsetPs > 0 && dEdgeOffsetPs < holdPs;
  const metastable = setupViolation || holdViolation;
  const latchPassesGlitch = dEdgeOffsetPs >= 0 && dEdgeOffsetPs <= 250; // during CLK=1 half-cycle
  const ffCapturedValue: 'NEW' | 'OLD' | 'METASTABLE' = metastable
    ? 'METASTABLE'
    : dEdgeOffsetPs <= -setupPs
      ? 'NEW'
      : 'OLD';
  const slackPs =
    dEdgeOffsetPs <= 0 ? Math.abs(dEdgeOffsetPs) - setupPs : dEdgeOffsetPs - holdPs;

  return {
    setupViolation,
    holdViolation,
    metastable,
    latchPassesGlitch,
    ffCapturedValue,
    slackPs,
  };
}

export interface CounterComparison {
  cycle: number;
  countBinary: string;
  rippleSkewPs: number;
  syncDelayPs: number;
  clockPeriodPs: number;
  rippleTimingFail: boolean;
  syncTimingFail: boolean;
  intermediateGlitchState: string | null;
}

export function stepCounterCompare(
  cycle: number,
  ffDelayPs: number,
  clockPeriodPs: number
): CounterComparison {
  const modCycle = ((cycle % 16) + 16) % 16;
  const prevCycle = ((cycle - 1) % 16 + 16) % 16;
  const rippleSkewPs = ffDelayPs * 4;
  const syncDelayPs = ffDelayPs + 60; // single FF + LUT gate
  let intermediateGlitchState: string | null = null;
  if (prevCycle === 7 && modCycle === 8) {
    intermediateGlitchState = '0111 → 0110 → 0100 → 0000 → 1000';
  } else if (prevCycle === 3 && modCycle === 4) {
    intermediateGlitchState = '0011 → 0010 → 0000 → 0100';
  }
  return {
    cycle: modCycle,
    countBinary: modCycle.toString(2).padStart(4, '0'),
    rippleSkewPs,
    syncDelayPs,
    clockPeriodPs,
    rippleTimingFail: rippleSkewPs > clockPeriodPs,
    syncTimingFail: syncDelayPs > clockPeriodPs,
    intermediateGlitchState,
  };
}

export interface BlockingTraceResult {
  cycles: Array<{
    cycle: number;
    din: number;
    q1: number;
    q2: number;
  }>;
  collapsedToSingleFlop: boolean;
}

export function stepBlockingVsNonBlocking(
  dinSequence: number[],
  blockingMode: boolean
): BlockingTraceResult {
  let q1 = 0;
  let q2 = 0;
  const cycles = dinSequence.map((din, idx) => {
    if (blockingMode) {
      q1 = din;
      q2 = q1; // blocking overwrites immediately on the same edge
    } else {
      const nextQ2 = q1;
      const nextQ1 = din;
      q1 = nextQ1;
      q2 = nextQ2;
    }
    return { cycle: idx + 1, din, q1, q2 };
  });

  return {
    cycles,
    collapsedToSingleFlop: blockingMode,
  };
}

export interface CdcEvalResult {
  fromBinary: string;
  toBinary: string;
  fromGray: string;
  toGray: string;
  binaryBitsChanged: number;
  grayBitsChanged: number;
  binarySkewGlitchStates: string[];
  multiBitSafe: boolean;
  singleBitMetastableRisk: 'Low (2-FF MTBF protected)' | 'High (No synchronizer!)';
}

export function toGray3(n: number): string {
  const clamped = ((n % 8) + 8) % 8;
  return (clamped ^ (clamped >> 1)).toString(2).padStart(3, '0');
}

export function evaluateCdcTransfer(
  stepValue: number,
  grayCoded: boolean,
  twoFfSync: boolean
): CdcEvalResult {
  const cur = ((stepValue % 8) + 8) % 8;
  const nxt = (cur + 1) % 8;
  const fromBinary = cur.toString(2).padStart(3, '0');
  const toBinary = nxt.toString(2).padStart(3, '0');
  const fromGray = toGray3(cur);
  const toGray = toGray3(nxt);

  let binaryBitsChanged = 0;
  let grayBitsChanged = 0;
  for (let i = 0; i < 3; i++) {
    if (fromBinary[i] !== toBinary[i]) binaryBitsChanged++;
    if (fromGray[i] !== toGray[i]) grayBitsChanged++;
  }

  const binarySkewGlitchStates: string[] = [];
  if (binaryBitsChanged > 1) {
    // Example: 011 -> 100 can sample 111, 000, 101 depending on wire skew
    binarySkewGlitchStates.push(
      `${toBinary[0]}${fromBinary[1]}${fromBinary[2]}`,
      `${fromBinary[0]}${toBinary[1]}${toBinary[2]}`
    );
  }

  return {
    fromBinary,
    toBinary,
    fromGray,
    toGray,
    binaryBitsChanged,
    grayBitsChanged,
    binarySkewGlitchStates,
    multiBitSafe: grayCoded && twoFfSync,
    singleBitMetastableRisk: twoFfSync ? 'Low (2-FF MTBF protected)' : 'High (No synchronizer!)',
  };
}

export interface FifoSimState {
  depth: number;
  wrPtr: number; // 0..15 for depth=8 (extra MSB at bit 3)
  rdPtr: number; // 0..15 for depth=8
  slots: Array<string | null>;
}

export function createInitialFifoState(): FifoSimState {
  return {
    depth: 8,
    wrPtr: 3,
    rdPtr: 0,
    slots: ['0xA1', '0xB2', '0xC3', null, null, null, null, null],
  };
}

export function getFifoFlags(state: FifoSimState): {
  empty: boolean;
  full: boolean;
  occupancy: number;
  wrMsb: number;
  rdMsb: number;
  wrAddr: number;
  rdAddr: number;
} {
  const wrMsb = (state.wrPtr >> 3) & 1;
  const rdMsb = (state.rdPtr >> 3) & 1;
  const wrAddr = state.wrPtr & 0b111;
  const rdAddr = state.rdPtr & 0b111;
  const empty = state.wrPtr === state.rdPtr;
  const full = wrMsb !== rdMsb && wrAddr === rdAddr;
  const occupancy = (state.wrPtr - state.rdPtr + 16) % 16;
  return { empty, full, occupancy, wrMsb, rdMsb, wrAddr, rdAddr };
}

export function stepFifoRing(
  state: FifoSimState,
  action: 'push' | 'pop' | 'both' | 'idle',
  hexByte: string
): FifoSimState {
  const flags = getFifoFlags(state);
  const nextSlots = [...state.slots];
  let nextWr = state.wrPtr;
  let nextRd = state.rdPtr;

  const canWrite = (action === 'push' || action === 'both') && (!flags.full || action === 'both');
  const canRead = (action === 'pop' || action === 'both') && !flags.empty;

  if (canRead) {
    nextSlots[nextRd & 0b111] = null;
    nextRd = (nextRd + 1) % 16;
  }
  if (canWrite) {
    nextSlots[nextWr & 0b111] = hexByte;
    nextWr = (nextWr + 1) % 16;
  }

  return {
    ...state,
    wrPtr: nextWr,
    rdPtr: nextRd,
    slots: nextSlots,
  };
}

export interface CrvDistResult {
  mode0Count: number;
  mode1Count: number;
  lenBinsHit: number[];
  crossCoveragePct: number;
}

export function runCrvDistribution(solveBefore: boolean, samples: number): CrvDistResult {
  let mode0Count = 0;
  let mode1Count = 0;
  const binsHit = new Set<string>();

  for (let i = 0; i < samples; i++) {
    // Deterministic LCG
    const r = (i * 37 + 13) % 100;
    let mode = 0;
    let len = 1;
    if (solveBefore) {
      // Solver picks mode first (50/50) then solves len
      mode = i % 2;
      len = mode === 0 ? 1 : 2 + ((i * 7) % 15);
    } else {
      // Uniform across 16 valid (mode,len) pairs: (0,1) + 15 pairs (1, 2..16)
      const pairIdx = r % 16;
      if (pairIdx === 0) {
        mode = 0;
        len = 1;
      } else {
        mode = 1;
        len = pairIdx + 1;
      }
    }
    if (mode === 0) mode0Count++;
    else mode1Count++;

    const lenBucket = len === 1 ? 'single' : len <= 8 ? 'burst_mid' : 'burst_long';
    binsHit.add(`${mode}_${lenBucket}`);
  }

  // 4 realistic cross bins: 0_single, 1_burst_mid, 1_burst_long, plus check coverage
  const targetBins = ['0_single', '1_burst_mid', '1_burst_long'];
  const hitCount = targetBins.filter((b) => binsHit.has(b)).length;
  return {
    mode0Count,
    mode1Count,
    lenBinsHit: [hitCount, targetBins.length],
    crossCoveragePct: Math.round((hitCount / targetBins.length) * 100),
  };
}

export type SvaCycleOutcome = 'VACUOUS' | 'PASS' | 'FAIL' | 'PENDING';

export function evaluateSvaProperty(
  operator: '|->' | '|=>',
  req: number[],
  ack: number[]
): SvaCycleOutcome[] {
  return req.map((r, i) => {
    if (r === 0) return 'VACUOUS';
    if (operator === '|->') {
      return ack[i] === 1 ? 'PASS' : 'FAIL';
    }
    // |=> checks ack on next cycle
    if (i + 1 >= ack.length) return 'PENDING';
    return ack[i + 1] === 1 ? 'PASS' : 'FAIL';
  });
}

export interface ApbWaveformStep {
  cycle: number;
  state: 'IDLE' | 'SETUP' | 'ACCESS';
  psel: number;
  penable: number;
  pwrite: number;
  pready: number;
  pslverr: number;
}

export function buildApbWaveform(
  pwrite: number,
  waitStates: number,
  injectError: boolean
): ApbWaveformStep[] {
  const ws = Math.max(0, Math.min(3, waitStates));
  const steps: ApbWaveformStep[] = [
    { cycle: 0, state: 'IDLE', psel: 0, penable: 0, pwrite, pready: 0, pslverr: 0 },
    { cycle: 1, state: 'SETUP', psel: 1, penable: 0, pwrite, pready: 0, pslverr: 0 },
  ];
  for (let w = 0; w < ws; w++) {
    steps.push({
      cycle: 2 + w,
      state: 'ACCESS',
      psel: 1,
      penable: 1,
      pwrite,
      pready: 0,
      pslverr: 0,
    });
  }
  steps.push({
    cycle: 2 + ws,
    state: 'ACCESS',
    psel: 1,
    penable: 1,
    pwrite,
    pready: 1,
    pslverr: injectError ? 1 : 0,
  });
  steps.push({
    cycle: 3 + ws,
    state: 'IDLE',
    psel: 0,
    penable: 0,
    pwrite,
    pready: 0,
    pslverr: 0,
  });
  return steps;
}
