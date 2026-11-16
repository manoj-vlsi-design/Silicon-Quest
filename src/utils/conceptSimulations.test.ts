import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildApbWaveform,
  computeTwosCompAdder,
  createInitialFifoState,
  evaluateCdcTransfer,
  evaluateLatchVsFlipFlop,
  evaluateStaticHazardTrace,
  evaluateSvaProperty,
  getFifoFlags,
  runCrvDistribution,
  stepBlockingVsNonBlocking,
  stepCounterCompare,
  stepFifoRing,
} from './conceptSimulations';

test('computeTwosCompAdder detects Cin_MSB XOR Cout_MSB overflow accurately', () => {
  // +6 + +4 = +10 -> overflows 4-bit signed [-8..+7]
  const ovf = computeTwosCompAdder(6, 4);
  assert.equal(ovf.overflow, true);
  assert.equal(ovf.cinMsb ^ ovf.coutMsb, 1);

  // +5 + -2 = +3 -> no overflow even though coutMsb=1 (cinMsb=1 too)
  const ok = computeTwosCompAdder(5, -2);
  assert.equal(ok.overflow, false);
  assert.equal(ok.signedSum, 3);
  assert.equal(ok.cinMsb ^ ok.coutMsb, 0);
});

test('evaluateStaticHazardTrace flags Static-1 glitch when consensus is OFF and clears it when ON', () => {
  const buggy = evaluateStaticHazardTrace(false, 80, 1, 1);
  assert.equal(buggy.glitchDetected, true);
  assert.equal(buggy.glitchWidthPs, 80);

  const fixed = evaluateStaticHazardTrace(true, 80, 1, 1);
  assert.equal(fixed.glitchDetected, false);
  assert.equal(fixed.glitchWidthPs, 0);
});

test('evaluateLatchVsFlipFlop detects setup/hold violations and latch glitch transparency', () => {
  const setupFail = evaluateLatchVsFlipFlop(-10, 40, 30);
  assert.equal(setupFail.setupViolation, true);
  assert.equal(setupFail.metastable, true);

  const holdFail = evaluateLatchVsFlipFlop(15, 40, 30);
  assert.equal(holdFail.holdViolation, true);
  assert.equal(holdFail.latchPassesGlitch, true);

  const clean = evaluateLatchVsFlipFlop(-60, 40, 30);
  assert.equal(clean.metastable, false);
  assert.equal(clean.ffCapturedValue, 'NEW');
});

test('stepCounterCompare identifies ripple skew failure vs synchronous safety', () => {
  const cmp = stepCounterCompare(8, 120, 350);
  assert.equal(cmp.rippleTimingFail, true); // 4*120 = 480 > 350
  assert.equal(cmp.syncTimingFail, false); // 120+60 = 180 <= 350
  assert.ok(cmp.intermediateGlitchState !== null);
});

test('stepBlockingVsNonBlocking proves race collapse in blocking mode vs 2-cycle pipeline in NBA', () => {
  const input = [1, 0, 1, 0];
  const blocking = stepBlockingVsNonBlocking(input, true);
  assert.equal(blocking.cycles[0].q1, 1);
  assert.equal(blocking.cycles[0].q2, 1); // collapsed in 1 clock!

  const nba = stepBlockingVsNonBlocking(input, false);
  assert.equal(nba.cycles[0].q1, 1);
  assert.equal(nba.cycles[0].q2, 0); // clean 1-cycle delay to q2
  assert.equal(nba.cycles[1].q2, 1);
});

test('evaluateCdcTransfer proves Gray code single-bit transitions vs binary multi-bit skew risk', () => {
  const cdc = evaluateCdcTransfer(3, true, true); // 011 -> 100
  assert.equal(cdc.binaryBitsChanged, 3);
  assert.equal(cdc.grayBitsChanged, 1);
  assert.equal(cdc.multiBitSafe, true);
});

test('stepFifoRing extra-MSB pointer flags distinguish EMPTY from FULL accurately', () => {
  let fifo = createInitialFifoState();
  // Push 5 more items to reach depth 8 (wrPtr wraps MSB: 8 vs rdPtr: 0)
  for (let i = 0; i < 5; i++) {
    fifo = stepFifoRing(fifo, 'push', `0xD${i}`);
  }
  const fullFlags = getFifoFlags(fifo);
  assert.equal(fullFlags.full, true);
  assert.equal(fullFlags.empty, false);
  assert.equal(fullFlags.occupancy, 8);
});

test('runCrvDistribution demonstrates solve-before fixing distribution skew', () => {
  const skewed = runCrvDistribution(false, 64);
  const solved = runCrvDistribution(true, 64);
  assert.ok(skewed.mode0Count < 10);
  assert.equal(solved.mode0Count, 32);
  assert.equal(solved.crossCoveragePct, 100);
});

test('evaluateSvaProperty distinguishes overlapping |-> and non-overlapping |=>', () => {
  const req = [0, 1, 0, 0, 1, 0];
  const ack = [0, 0, 1, 0, 1, 0];
  const overlap = evaluateSvaProperty('|->', req, ack);
  assert.equal(overlap[1], 'FAIL'); // req@1 expects ack@1
  assert.equal(overlap[4], 'PASS');

  const nonOverlap = evaluateSvaProperty('|=>', req, ack);
  assert.equal(nonOverlap[1], 'PASS'); // req@1 sees ack@2
  assert.equal(nonOverlap[4], 'FAIL'); // req@4 sees ack@5 == 0
});

test('buildApbWaveform inserts ACCESS wait states until PREADY=1', () => {
  const steps = buildApbWaveform(1, 2, true);
  // IDLE(0), SETUP(1), ACCESS_wait(2), ACCESS_wait(3), ACCESS_done(4), IDLE(5)
  assert.equal(steps.length, 6);
  assert.equal(steps[1].state, 'SETUP');
  assert.equal(steps[1].penable, 0);
  assert.equal(steps[2].state, 'ACCESS');
  assert.equal(steps[2].pready, 0);
  assert.equal(steps[4].pready, 1);
  assert.equal(steps[4].pslverr, 1);
});
