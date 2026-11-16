import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  StepForward,
} from 'lucide-react';
import {
  computeTwosCompAdder,
  createInitialFifoState,
  evaluateCdcTransfer,
  evaluateLatchVsFlipFlop,
  evaluateStaticHazardTrace,
  getFifoFlags,
  stepBlockingVsNonBlocking,
  stepCounterCompare,
  stepFifoRing,
} from '../utils/conceptSimulations';

interface DigitalRtlSimProps {
  moduleId: string;
}

export const ConceptSimDigitalRtl: React.FC<DigitalRtlSimProps> = ({ moduleId }) => {
  // m1 state
  const [valA, setValA] = useState(6);
  const [valB, setValB] = useState(4);

  // m2 state
  const [consensusOn, setConsensusOn] = useState(false);
  const [invDelayPs, setInvDelayPs] = useState(80);

  // m3 state
  const [dEdgePs, setDEdgePs] = useState(-12);
  const [setupPs] = useState(40);
  const [holdPs] = useState(30);

  // m4 state
  const [counterCycle, setCounterCycle] = useState(8);
  const [counterPlaying, setCounterPlaying] = useState(false);
  const [ffDelayPs, setFfDelayPs] = useState(110);

  // m5 state
  const [eqRegion, setEqRegion] = useState(0);

  // m6 state
  const [blockingMode, setBlockingMode] = useState(true);
  const [dinSeq, setDinSeq] = useState<number[]>([1, 0, 1, 1, 0]);

  // m7 state
  const [hasElse, setHasElse] = useState(false);
  const [asyncReset, setAsyncReset] = useState(false);

  // m8 state
  const [cdcStep, setCdcStep] = useState(3);
  const [grayCoded, setGrayCoded] = useState(false);
  const [twoFfSync, setTwoFfSync] = useState(true);

  // m9 state
  const [fifo, setFifo] = useState(createInitialFifoState);
  const [nextHexIdx, setNextHexIdx] = useState(0);
  const hexPool = ['0xD4', '0xE5', '0xF6', '0x17', '0x28', '0x39', '0x4A', '0x5B'];

  useEffect(() => {
    if (!counterPlaying || moduleId !== 'm4_sequential_counters') return;
    const timer = window.setInterval(() => {
      setCounterCycle((c) => (c + 1) % 16);
    }, 900);
    return () => window.clearInterval(timer);
  }, [counterPlaying, moduleId]);

  if (moduleId === 'm1_number_gates') {
    const res = computeTwosCompAdder(valA, valB);
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <span className="font-mono text-xs text-slate-300 tracking-wide">
              4-Bit Ripple Adder &amp; Overflow XOR Gate
            </span>
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${
                res.overflow ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {res.overflow ? (
                <>
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  SIGNED OVERFLOW DETECTED (Cin_MSB ⊕ Cout_MSB = 1)
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  NOMINAL SIGNED SUM (Cin_MSB ⊕ Cout_MSB = 0)
                </>
              )}
            </span>
          </div>

          <svg viewBox="0 0 640 210" className="mt-4 w-full h-auto" role="img" aria-label="4-bit full adder carry chain diagram">
            {[3, 2, 1, 0].map((bit, colIdx) => {
              const x = 65 + colIdx * 135;
              const aBit = res.aBits[3 - bit];
              const bBit = res.bBits[3 - bit];
              const sBit = res.sumBits[3 - bit];
              const isMsb = bit === 3;
              return (
                <g key={bit}>
                  <rect
                    x={x}
                    y={46}
                    width={92}
                    height={84}
                    rx={8}
                    fill={isMsb ? '#172554' : '#0f172a'}
                    stroke={isMsb ? '#38bdf8' : '#334155'}
                    strokeWidth={isMsb ? 2 : 1.5}
                  />
                  <text x={x + 46} y={24} textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                    FA[{bit}] {isMsb ? '(MSB)' : ''}
                  </text>
                  <text x={x + 26} y={70} textAnchor="middle" fill="#e2e8f0" fontSize="13" fontFamily="monospace">
                    A={aBit}
                  </text>
                  <text x={x + 68} y={70} textAnchor="middle" fill="#e2e8f0" fontSize="13" fontFamily="monospace">
                    B={bBit}
                  </text>
                  <text x={x + 46} y={102} textAnchor="middle" fill="#38bdf8" fontSize="12" fontFamily="monospace">
                    Cin={res.carries[bit]}
                  </text>
                  <text x={x + 46} y={120} textAnchor="middle" fill="#f59e0b" fontSize="11" fontFamily="monospace">
                    Cout={res.carries[bit + 1]}
                  </text>
                  <line x1={x + 46} y1={130} x2={x + 46} y2={156} stroke="#38bdf8" strokeWidth="1.5" />
                  <rect x={x + 24} y={156} width={44} height={28} rx={6} fill="#1e293b" stroke="#475569" />
                  <text x={x + 46} y={175} textAnchor="middle" fill="#34d399" fontSize="14" fontWeight="bold" fontFamily="monospace">
                    S={sBit}
                  </text>
                  {colIdx > 0 && (
                    <line
                      x1={x + 92}
                      y1={88}
                      x2={x + 135}
                      y2={88}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-800 pt-3 font-mono text-xs sm:grid-cols-4">
            <div>
              <span className="text-slate-400">A ({valA >= 0 ? `+${valA}` : valA}): </span>
              <span className="text-sky-300">4&apos;b{res.aBits}</span>
            </div>
            <div>
              <span className="text-slate-400">B ({valB >= 0 ? `+${valB}` : valB}): </span>
              <span className="text-sky-300">4&apos;b{res.bBits}</span>
            </div>
            <div>
              <span className="text-slate-400">4-Bit Sum: </span>
              <span className="text-emerald-300">
                4&apos;b{res.sumBits} ({res.signedSum})
              </span>
            </div>
            <div>
              <span className="text-slate-400">True Math: </span>
              <span className={res.overflow ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
                {res.idealSum} {res.overflow ? '(Out of [-8, +7])' : '(Valid)'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Operand A (4-bit Signed)</span>
              <span className="font-mono tabular-nums">{valA}</span>
            </div>
            <input
              type="range"
              min={-8}
              max={7}
              value={valA}
              onChange={(e) => setValA(Number(e.target.value))}
              className="mt-2 w-full accent-sky-700"
            />
          </label>
          <label className="block rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Operand B (4-bit Signed)</span>
              <span className="font-mono tabular-nums">{valB}</span>
            </div>
            <input
              type="range"
              min={-8}
              max={7}
              value={valB}
              onChange={(e) => setValB(Number(e.target.value))}
              className="mt-2 w-full accent-sky-700"
            />
          </label>
        </div>
      </div>
    );
  }

  if (moduleId === 'm2_comb_circuits') {
    const trace = evaluateStaticHazardTrace(consensusOn, invDelayPs, 1, 1);
    const toPath = (getter: (s: (typeof trace.samples)[number]) => number, yBase: number, h: number) => {
      return trace.samples
        .map((s, idx) => {
          const x = 110 + (s.timePs / 500) * 500;
          const y = s[getter.name as keyof typeof s] as never; // unused
          void y;
          const val = getter(s);
          const py = val === 1 ? yBase - h : yBase;
          if (idx === 0) return `M ${x} ${py}`;
          const prevVal = getter(trace.samples[idx - 1]);
          const prevPy = prevVal === 1 ? yBase - h : yBase;
          return `L ${x} ${prevPy} L ${x} ${py}`;
        })
        .join(' ');
    };

    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <span className="font-mono text-xs text-slate-300">
              Waveform Trace: F = (A &amp; B) | (~A &amp; C){consensusOn ? ' | (B & C)' : ''} with B=1, C=1
            </span>
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${
                trace.glitchDetected ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {trace.glitchDetected ? (
                <>
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  STATIC-1 GLITCH ({trace.glitchWidthPs} ps dip)
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  GLITCH-FREE OUTPUT (Consensus Active)
                </>
              )}
            </span>
          </div>

          <svg viewBox="0 0 640 240" className="mt-4 w-full h-auto" role="img" aria-label="Static-1 hazard logic waveform simulation">
            {/* Delay highlight region */}
            <rect
              x={110 + (200 / 500) * 500}
              y={12}
              width={(invDelayPs / 500) * 500}
              height={212}
              fill={trace.glitchDetected ? 'rgba(244,63,94,0.16)' : 'rgba(16,185,129,0.12)'}
            />
            {[
              { label: 'A (1→0)', y: 42, color: '#38bdf8', fn: (s: (typeof trace.samples)[0]) => s.a },
              { label: '~A (delayed)', y: 86, color: '#818cf8', fn: (s: (typeof trace.samples)[0]) => s.aNot },
              { label: 'A & B', y: 130, color: '#fbbf24', fn: (s: (typeof trace.samples)[0]) => s.termAB },
              { label: '~A & C', y: 174, color: '#a78bfa', fn: (s: (typeof trace.samples)[0]) => s.termAnC },
              {
                label: 'Output F',
                y: 222,
                color: trace.glitchDetected ? '#fb7185' : '#34d399',
                fn: (s: (typeof trace.samples)[0]) => s.outputF,
              },
            ].map((sig) => (
              <g key={sig.label}>
                <text x={14} y={sig.y - 6} fill="#cbd5e1" fontSize="11" fontFamily="monospace">
                  {sig.label}
                </text>
                <line x1={110} y1={sig.y} x2={615} y2={sig.y} stroke="#1e293b" strokeWidth="1" />
                <path d={toPath(sig.fn, sig.y, 24)} fill="none" stroke={sig.color} strokeWidth="2.5" />
              </g>
            ))}
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConsensusOn((v) => !v)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                consensusOn
                  ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                  : 'bg-sky-700 text-white hover:bg-sky-800'
              }`}
            >
              {consensusOn ? 'Consensus Term (B & C): ENABLED' : 'Add Consensus Term (B & C)'}
            </button>
          </div>
          <label className="flex items-center gap-3 text-xs font-semibold text-slate-800">
            <span>Inverter Delay Δt:</span>
            <input
              type="range"
              min={30}
              max={160}
              step={10}
              value={invDelayPs}
              onChange={(e) => setInvDelayPs(Number(e.target.value))}
              className="w-36 accent-sky-700"
            />
            <span className="font-mono tabular-nums">{invDelayPs} ps</span>
          </label>
        </div>
      </div>
    );
  }

  if (moduleId === 'm3_fsm_intro') {
    const res = evaluateLatchVsFlipFlop(dEdgePs, setupPs, holdPs);
    const clkX = 320;
    const scale = 1.1;
    const dX = clkX + dEdgePs * scale;
    const setupLeft = clkX - setupPs * scale;
    const holdRight = clkX + holdPs * scale;

    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <span className="font-mono text-xs text-slate-300">
              Setup Window ({setupPs} ps) &amp; Hold Window ({holdPs} ps) around posedge CLK
            </span>
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${
                res.metastable ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {res.metastable ? (
                <>
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  {res.setupViolation ? 'SETUP VIOLATION — METASTABLE' : 'HOLD VIOLATION — METASTABLE'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  CLEAN CAPTURE ({res.ffCapturedValue} VALUE, Slack +{res.slackPs} ps)
                </>
              )}
            </span>
          </div>

          <svg viewBox="0 0 640 220" className="mt-4 w-full h-auto" role="img" aria-label="Setup hold timing window and latch vs flip-flop capture">
            {/* Forbidden Setup+Hold shaded zone */}
            <rect
              x={setupLeft}
              y={18}
              width={holdRight - setupLeft}
              height={186}
              fill={res.metastable ? 'rgba(244,63,94,0.22)' : 'rgba(245,158,11,0.14)'}
            />
            <line x1={clkX} y1={14} x2={clkX} y2={208} stroke="#38bdf8" strokeDasharray="4 3" strokeWidth="1.5" />
            <text x={clkX + 4} y={24} fill="#38bdf8" fontSize="10" fontFamily="monospace">
              posedge CLK (0 ps)
            </text>

            {/* CLK */}
            <text x={14} y={62} fill="#cbd5e1" fontSize="11" fontFamily="monospace">CLK</text>
            <path d={`M 100 66 L ${clkX} 66 L ${clkX} 42 L 600 42`} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

            {/* Input D */}
            <text x={14} y={114} fill="#cbd5e1" fontSize="11" fontFamily="monospace">Data D</text>
            <path d={`M 100 118 L ${dX} 118 L ${dX} 92 L 600 92`} fill="none" stroke="#fbbf24" strokeWidth="2.5" />

            {/* Latch Output */}
            <text x={14} y={158} fill="#cbd5e1" fontSize="11" fontFamily="monospace">D-Latch Q</text>
            <path
              d={
                res.latchPassesGlitch
                  ? `M 100 162 L ${dX} 162 L ${dX} 138 L 600 138`
                  : dEdgePs <= 0
                    ? `M 100 162 L ${clkX} 162 L ${clkX} 138 L 600 138`
                    : `M 100 162 L 600 162`
              }
              fill="none"
              stroke="#a78bfa"
              strokeWidth="2.5"
            />

            {/* FF Output */}
            <text x={14} y={200} fill="#cbd5e1" fontSize="11" fontFamily="monospace">D-FF Q</text>
            <path
              d={
                res.ffCapturedValue === 'NEW'
                  ? `M 100 204 L ${clkX + 18} 204 L ${clkX + 18} 180 L 600 180`
                  : `M 100 204 L 600 204`
              }
              fill="none"
              stroke={res.metastable ? '#fb7185' : '#34d399'}
              strokeWidth="2.5"
              strokeDasharray={res.metastable ? '5 3' : undefined}
            />
          </svg>
        </div>

        <label className="block rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
          <div className="flex justify-between font-semibold text-slate-800">
            <span>Data D Transition Offset Relative to posedge CLK</span>
            <span className="font-mono tabular-nums">
              {dEdgePs > 0 ? `+${dEdgePs}` : dEdgePs} ps
            </span>
          </div>
          <input
            type="range"
            min={-140}
            max={160}
            step={4}
            value={dEdgePs}
            onChange={(e) => setDEdgePs(Number(e.target.value))}
            className="mt-2 w-full accent-sky-700"
          />
          <div className="mt-1 flex justify-between text-[11px] text-slate-500">
            <span>-140 ps (Early / Safe)</span>
            <span>[-40, +30 ps] Setup/Hold Forbidden Zone</span>
            <span>+160 ps (Inside CLK=1 Transparent Latch Window)</span>
          </div>
        </label>
      </div>
    );
  }

  if (moduleId === 'm4_sequential_counters') {
    const cmp = stepCounterCompare(counterCycle, ffDelayPs, 360);
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <span className="font-mono text-xs text-slate-300">
              Count = {cmp.cycle} (4&apos;b{cmp.countBinary}) · Clock Period = {cmp.clockPeriodPs} ps
            </span>
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${
                cmp.rippleTimingFail ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {cmp.rippleTimingFail ? (
                <>
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  RIPPLE EXCEEDS T_CLK ({cmp.rippleSkewPs} ps &gt; {cmp.clockPeriodPs} ps)
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  BOTH WITHIN PERIOD (Sync: {cmp.syncDelayPs} ps vs Ripple: {cmp.rippleSkewPs} ps)
                </>
              )}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs font-semibold text-amber-300">Ripple Counter (Serial Clock Chain)</div>
              <div className="mt-3 flex items-center justify-between gap-2">
                {['Q0', 'Q1', 'Q2', 'Q3'].map((q, idx) => (
                  <div key={q} className="flex-1 rounded border border-slate-700 bg-slate-950 p-2 text-center font-mono">
                    <div className="text-[11px] text-slate-400">{q}</div>
                    <div className="mt-1 text-base font-bold text-amber-300">{cmp.countBinary[3 - idx]}</div>
                    <div className="text-[10px] text-slate-400">+{ffDelayPs * (idx + 1)} ps</div>
                  </div>
                ))}
              </div>
              {cmp.intermediateGlitchState && (
                <div className="mt-2 font-mono text-[11px] text-rose-300">
                  Transient ripple sequence: {cmp.intermediateGlitchState}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs font-semibold text-sky-300">Synchronous Counter (Shared Clock Tree)</div>
              <div className="mt-3 flex items-center justify-between gap-2">
                {['Q0', 'Q1', 'Q2', 'Q3'].map((q, idx) => (
                  <div key={q} className="flex-1 rounded border border-sky-800 bg-slate-950 p-2 text-center font-mono">
                    <div className="text-[11px] text-slate-400">{q}</div>
                    <div className="mt-1 text-base font-bold text-emerald-300">{cmp.countBinary[3 - idx]}</div>
                    <div className="text-[10px] text-sky-400">{cmp.syncDelayPs} ps</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 font-mono text-[11px] text-emerald-300">
                All 4 flip-flops update simultaneously on posedge CLK.
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCounterPlaying((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-800"
            >
              {counterPlaying ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
              {counterPlaying ? 'Pause Clock' : 'Run Clock'}
            </button>
            <button
              type="button"
              onClick={() => setCounterCycle((c) => (c + 1) % 16)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <StepForward className="h-3.5 w-3.5" aria-hidden="true" />
              Step Clock
            </button>
          </div>

          <label className="flex items-center gap-3 text-xs font-semibold text-slate-800">
            <span>FF t_pd:</span>
            <input
              type="range"
              min={40}
              max={140}
              step={10}
              value={ffDelayPs}
              onChange={(e) => setFfDelayPs(Number(e.target.value))}
              className="w-36 accent-sky-700"
            />
            <span className="font-mono tabular-nums">{ffDelayPs} ps</span>
          </label>
        </div>
      </div>
    );
  }

  if (moduleId === 'm5_verilog_basics') {
    const regions = [
      {
        name: '1. Active Region',
        desc: 'Evaluates blocking (=) RHS & updates LHS immediately. Evaluates non-blocking (<=) RHS only; defers LHS write.',
        blockingVal: 'a = 1 (written now)',
        nbaVal: 'RHS(b <= a) sampled = 0 (old value)',
      },
      {
        name: '2. Inactive Region (#0)',
        desc: 'Processes explicit zero-delay #0 procedural statements before moving into NBA update queue.',
        blockingVal: 'a stays 1',
        nbaVal: 'NBA LHS queue pending',
      },
      {
        name: '3. NBA Update Region (<=)',
        desc: 'Commits all scheduled non-blocking LHS assignments atomically without triggering intra-delta races.',
        blockingVal: 'Already settled',
        nbaVal: 'b <= 0 committed cleanly',
      },
      {
        name: '4. Postponed / $monitor',
        desc: 'Executes $strobe and $monitor after all simulation deltas settle for the current time step.',
        blockingVal: '$display saw race-prone order',
        nbaVal: '$monitor sees deterministic steady state',
      },
    ];
    const active = regions[eqRegion];
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="grid gap-3 sm:grid-cols-4">
            {regions.map((r, i) => (
              <button
                key={r.name}
                type="button"
                onClick={() => setEqRegion(i)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  eqRegion === i
                    ? 'border-sky-400 bg-sky-950/60 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-mono text-xs font-bold">{r.name}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-2">
            <div className="font-display text-sm font-bold text-sky-300">{active.name}</div>
            <p className="text-xs leading-relaxed text-slate-300">{active.desc}</p>
            <div className="grid gap-3 pt-2 sm:grid-cols-2 font-mono text-xs">
              <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
                <span className="text-amber-300">Blocking (=): </span>
                {active.blockingVal}
              </div>
              <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
                <span className="text-emerald-300">Non-Blocking (&lt;=): </span>
                {active.nbaVal}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (moduleId === 'm6_blocking_nonblocking') {
    const trace = stepBlockingVsNonBlocking(dinSeq, blockingMode);
    const latest = trace.cycles[trace.cycles.length - 1];
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <span className="font-mono text-xs text-slate-300">
              always @(posedge clk) {'{'} q1 {blockingMode ? '=' : '<='} din; q2 {blockingMode ? '=' : '<='} q1; {'}'}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${
                blockingMode ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {blockingMode ? (
                <>
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  RACE COLLAPSE — SYNTHESIS ≠ SIMULATION (1 FLOP)
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  CLEAN 2-STAGE SHIFT REGISTER (2 FLOPS)
                </>
              )}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
            <div className="rounded border border-amber-500/50 bg-slate-900 px-3 py-2 text-amber-300">
              din = {latest.din}
            </div>
            <span className="text-slate-400">→</span>
            <div className="rounded border border-sky-500/60 bg-slate-900 px-4 py-2 text-sky-300">
              FF1 (q1) = {latest.q1}
            </div>
            <span className="text-slate-400">{blockingMode ? '≡ (wired!)' : '→ (1 clk)'}</span>
            <div
              className={`rounded border px-4 py-2 ${
                blockingMode
                  ? 'border-rose-500/60 bg-rose-950/30 text-rose-300'
                  : 'border-emerald-500/60 bg-slate-900 text-emerald-300'
              }`}
            >
              FF2 (q2) = {latest.q2}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-center font-mono text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-1.5">Posedge Cycle</th>
                  <th>din</th>
                  <th>q1</th>
                  <th>q2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {trace.cycles.map((c) => (
                  <tr key={c.cycle}>
                    <td className="py-1.5 text-slate-400">#{c.cycle}</td>
                    <td className="text-amber-300">{c.din}</td>
                    <td className="text-sky-300">{c.q1}</td>
                    <td className={blockingMode ? 'text-rose-300 font-bold' : 'text-emerald-300 font-bold'}>
                      {c.q2}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBlockingMode(true)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                blockingMode ? 'bg-rose-700 text-white' : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              Use Blocking (=)
            </button>
            <button
              type="button"
              onClick={() => setBlockingMode(false)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                !blockingMode ? 'bg-emerald-700 text-white' : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              Use Non-Blocking (&lt;=)
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Pulse Next Bit:</span>
            <button
              type="button"
              onClick={() => setDinSeq((s) => [...s.slice(1), 1])}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 font-mono font-semibold text-slate-800 hover:bg-slate-100"
            >
              din=1
            </button>
            <button
              type="button"
              onClick={() => setDinSeq((s) => [...s.slice(1), 0])}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 font-mono font-semibold text-slate-800 hover:bg-slate-100"
            >
              din=0
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (moduleId === 'm7_rtl_synthesis') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <span className="font-mono text-xs text-slate-300">
              always @(*) if (sel) out = a; {hasElse ? 'else out = b;' : '// MISSING ELSE!'}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${
                hasElse ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {hasElse ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  PURE COMBINATIONAL 2:1 MUX
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  UNINTENDED LEVEL-SENSITIVE LATCH INFERRED
                </>
              )}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 font-mono text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <div className="text-slate-400">Synthesized Cell Netlist</div>
              <div className="mt-2 text-sm font-bold text-white">
                {hasElse ? 'STD_MUX2_X1 (Combinational)' : 'DLATCH_X1 (G = sel, D = a, Q = out)'}
              </div>
              <p className="mt-1.5 text-slate-300 font-sans leading-relaxed">
                {hasElse
                  ? 'Every control branch assigns out, so synthesis builds a clean multiplexer with zero memory elements.'
                  : 'When sel = 0, out must hold its prior value—forcing synthesis to insert a level-sensitive D-latch.'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <div className="text-slate-400">Reset Strategy</div>
              <div className="mt-2 text-sm font-bold text-sky-300">
                {asyncReset ? 'Async Assert, Sync De-assert' : 'Fully Synchronous Reset'}
              </div>
              <p className="mt-1.5 text-slate-300 font-sans leading-relaxed">
                {asyncReset
                  ? 'Acts immediately on negedge rst_n even without a clock, but release requires a reset synchronizer to avoid recovery violations.'
                  : 'Sampled cleanly on posedge clk with standard STA timing; requires at least one active clock edge to initialize.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setHasElse((v) => !v)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold ${
              hasElse ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white'
            }`}
          >
            {hasElse ? 'Else / Default Branch: PRESENT' : 'Add Else / Default Branch (Fix Latch)'}
          </button>
          <button
            type="button"
            onClick={() => setAsyncReset((v) => !v)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reset Mode: {asyncReset ? 'Asynchronous' : 'Synchronous'}
          </button>
        </div>
      </div>
    );
  }

  if (moduleId === 'm8_cdc_timing') {
    const cdc = evaluateCdcTransfer(cdcStep, grayCoded, twoFfSync);
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <span className="font-mono text-xs text-slate-300">
              Multi-Bit Bus Transition across CLK_A → CLK_B (Step {cdcStep} → {(cdcStep + 1) % 8})
            </span>
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${
                cdc.multiBitSafe ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {cdc.multiBitSafe ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  SAFE CDC (1-Bit Gray Delta + 2-FF Sync)
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  CORRUPTION RISK ({!grayCoded ? `${cdc.binaryBitsChanged} bits flip` : 'Missing 2-FF Sync'})
                </>
              )}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 font-mono text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <div className="text-slate-400">
                Encoding: {grayCoded ? 'Gray Code' : 'Standard Binary'}
              </div>
              <div className="mt-2 text-lg font-bold text-sky-300">
                {grayCoded ? `${cdc.fromGray} → ${cdc.toGray}` : `${cdc.fromBinary} → ${cdc.toBinary}`}
              </div>
              <div className="mt-1 text-slate-300">
                Simultaneous bit flips:{' '}
                <span className={grayCoded || cdc.binaryBitsChanged === 1 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {grayCoded ? cdc.grayBitsChanged : cdc.binaryBitsChanged} bit(s)
                </span>
              </div>
              {!grayCoded && cdc.binarySkewGlitchStates.length > 0 && (
                <div className="mt-1.5 text-rose-300">
                  Possible skewed capture: {cdc.binarySkewGlitchStates.join(', ')}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <div className="text-slate-400">Synchronizer Chain</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded border border-slate-700 px-2.5 py-1">FF_TX</span>
                <span>→</span>
                <span className={`rounded border px-2.5 py-1 ${twoFfSync ? 'border-amber-500 text-amber-300' : 'border-rose-500 text-rose-300'}`}>
                  {twoFfSync ? 'FF_SYNC1 (Settle)' : 'RAW CAPTURE'}
                </span>
                {twoFfSync && (
                  <>
                    <span>→</span>
                    <span className="rounded border border-emerald-500 px-2.5 py-1 text-emerald-300">
                      FF_SYNC2 (Clean)
                    </span>
                  </>
                )}
              </div>
              <div className="mt-2 text-slate-300">{cdc.singleBitMetastableRisk}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setGrayCoded((v) => !v)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold ${
              grayCoded ? 'bg-emerald-700 text-white' : 'bg-sky-700 text-white'
            }`}
          >
            {grayCoded ? 'Encoding: GRAY CODE (Safe)' : 'Switch to Gray Code Encoding'}
          </button>
          <button
            type="button"
            onClick={() => setTwoFfSync((v) => !v)}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            2-FF Synchronizer: {twoFfSync ? 'ENABLED' : 'BYPASSED'}
          </button>
          <button
            type="button"
            onClick={() => setCdcStep((s) => (s + 1) % 8)}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Step Transition ({cdcStep} → {(cdcStep + 1) % 8})
          </button>
        </div>
      </div>
    );
  }

  // m9_rtl_fifo
  const flags = getFifoFlags(fifo);
  const triggerFifo = (action: 'push' | 'pop' | 'both') => {
    const val = hexPool[nextHexIdx % hexPool.length];
    setNextHexIdx((i) => i + 1);
    setFifo((prev) => stepFifoRing(prev, action, val));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
          <span>
            wr_ptr=4&apos;b{fifo.wrPtr.toString(2).padStart(4, '0')} · rd_ptr=4&apos;b{fifo.rdPtr.toString(2).padStart(4, '0')}
          </span>
          <span className={flags.full ? 'text-amber-300 font-bold' : flags.empty ? 'text-sky-300 font-bold' : 'text-emerald-300 font-bold'}>
            {flags.full ? '● FIFO FULL (wr[3]!=rd[3], wr[2:0]==rd[2:0])' : flags.empty ? '● FIFO EMPTY (wr_ptr == rd_ptr)' : `● OCCUPANCY ${flags.occupancy}/8`}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8 font-mono text-xs">
          {fifo.slots.map((slot, idx) => {
            const isWr = flags.wrAddr === idx;
            const isRd = flags.rdAddr === idx;
            return (
              <div
                key={idx}
                className={`rounded-lg border p-2.5 text-center ${
                  slot ? 'border-sky-700 bg-sky-950/50' : 'border-slate-800 bg-slate-900'
                }`}
              >
                <div className="text-[10px] text-slate-400">[{idx}]</div>
                <div className="mt-1 font-bold text-white">{slot || '--'}</div>
                <div className="mt-1 text-[10px] text-amber-300">
                  {isWr && isRd ? 'W/R' : isWr ? 'WR' : isRd ? 'RD' : ' '}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={flags.full}
          onClick={() => triggerFifo('push')}
          className="rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-45"
        >
          Push Data (wr_en)
        </button>
        <button
          type="button"
          disabled={flags.empty}
          onClick={() => triggerFifo('pop')}
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-45"
        >
          Pop Data (rd_en)
        </button>
        <button
          type="button"
          disabled={flags.empty}
          onClick={() => triggerFifo('both')}
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-45"
        >
          Simultaneous Push + Pop
        </button>
        <button
          type="button"
          onClick={() => setFifo(createInitialFifoState())}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset
        </button>
      </div>
    </div>
  );
};
