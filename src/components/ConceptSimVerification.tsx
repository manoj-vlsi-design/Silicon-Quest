import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  buildApbWaveform,
  evaluateSvaProperty,
  runCrvDistribution,
} from '../utils/conceptSimulations';

interface VerificationSimProps {
  moduleId: string;
}

export const ConceptSimVerification: React.FC<VerificationSimProps> = ({ moduleId }) => {
  // m10: 4-state logic vs 2-state bit
  const [driveX, setDriveX] = useState(true);

  // m11: OOP copy mode
  const [copyMode, setCopyMode] = useState<'handle' | 'shallow' | 'deep'>('shallow');
  const [mutatedAddr, setMutatedAddr] = useState('0xFF00');

  // m12: Layered TB stage
  const [tbStage, setTbStage] = useState(4);
  const [injectDutBug, setInjectDutBug] = useState(true);

  // m13: CRV solve-before
  const [solveBefore, setSolveBefore] = useState(false);

  // m14: SVA |-> vs |=>
  const [svaOp, setSvaOp] = useState<'|->' | '|=>'>('|=>');
  const [reqVec, setReqVec] = useState([0, 1, 0, 0, 1, 0, 1, 0]);
  const [ackVec, setAckVec] = useState([0, 0, 1, 0, 0, 1, 0, 0]);

  // m15: UVM phases & factory
  const [uvmPhaseIdx, setUvmPhaseIdx] = useState(0);
  const [factoryOverride, setFactoryOverride] = useState(false);

  // m16: UVM RAL
  const [ralDesired, setRalDesired] = useState('0x00A4');
  const [ralMirrored, setRalMirrored] = useState('0x00A4');
  const [ralDutHw, setRalDutHw] = useState('0x00A4');
  const [ralStatus, setRalStatus] = useState('Mirrored value matches DUT hardware register.');

  // m17: AMBA APB
  const [apbWrite, setApbWrite] = useState(1);
  const [waitStates, setWaitStates] = useState(1);
  const [apbErr, setApbErr] = useState(false);

  // m18: Debug root cause triage
  const [debugFix, setDebugFix] = useState<'none' | 'reset_race' | 'off_by_one'>('none');

  if (moduleId === 'm10_sv_types') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
            <span>DUT Uninitialized Bus State: {driveX ? "4'bxxxx (Unknown X)" : "4'b1010 (Driven)"}</span>
            <span className={driveX ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'}>
              {driveX ? '▲ 2-STATE MASKING HAZARD ACTIVE' : '● KNOWN LOGIC DRIVEN'}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 font-mono text-xs">
            <div className="rounded-lg border border-sky-700 bg-slate-900 p-4">
              <div className="text-sky-300 font-bold">4-State Probe: logic [3:0] sig</div>
              <div className="mt-2 text-2xl font-bold text-white">
                {driveX ? "4'bxxxx" : "4'b1010"}
              </div>
              <p className="mt-1.5 font-sans text-slate-300">
                {driveX
                  ? 'Preserves X cleanly—SVA $isunknown() and assertions immediately catch missing reset.'
                  : 'Tracks exact 0/1/X/Z states across continuous and procedural assignments.'}
              </p>
            </div>
            <div className="rounded-lg border border-rose-700/70 bg-slate-900 p-4">
              <div className="text-rose-300 font-bold">2-State Probe: bit [3:0] sig</div>
              <div className="mt-2 text-2xl font-bold text-rose-300">
                {driveX ? "4'b0000 (X coerced!)" : "4'b1010"}
              </div>
              <p className="mt-1.5 font-sans text-slate-300">
                {driveX
                  ? 'Silent X→0 coercion tricks the testbench into thinking the DUT reset cleanly to 0!'
                  : 'Matches driven binary state, safe only for loop indices and scoreboard counts.'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDriveX((v) => !v)}
          className="rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800"
        >
          {driveX ? 'Drive Known 4’b1010 Value' : 'Inject Uninitialized X on Reset'}
        </button>
      </div>
    );
  }

  if (moduleId === 'm11_sv_oop') {
    const h1Addr = copyMode === 'deep' ? '0x1000' : mutatedAddr;
    const aliased = copyMode !== 'deep';
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
            <span>Mutating pkt2.hdr.addr = {mutatedAddr}</span>
            <span className={aliased ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'}>
              {aliased ? '▲ HEAP ALIASING: pkt1.hdr CORRUPTED' : '✓ ISOLATED DEEP CLONE'}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 font-mono text-xs">
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
              <div className="text-sky-300 font-bold">Handle pkt1 (Original)</div>
              <div className="mt-2">pkt1.id = 1</div>
              <div>
                pkt1.hdr.addr ={' '}
                <span className={aliased ? 'text-rose-400 font-bold' : 'text-emerald-300 font-bold'}>
                  {h1Addr}
                </span>
              </div>
              <div className="mt-1 text-slate-400">
                Heap slot: {copyMode === 'handle' ? 'Obj#A (shared)' : copyMode === 'shallow' ? 'Obj#A + SubHdr#1 (shared)' : 'Obj#A + SubHdr#1'}
              </div>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
              <div className="text-amber-300 font-bold">Handle pkt2 ({copyMode})</div>
              <div className="mt-2">pkt2.id = {copyMode === 'handle' ? '1 (aliased)' : '2'}</div>
              <div>pkt2.hdr.addr = <span className="text-amber-300 font-bold">{mutatedAddr}</span></div>
              <div className="mt-1 text-slate-400">
                Heap slot: {copyMode === 'handle' ? 'Obj#A (shared!)' : copyMode === 'shallow' ? 'Obj#B + SubHdr#1 (shared!)' : 'Obj#B + SubHdr#2'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['handle', 'shallow', 'deep'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setCopyMode(m)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold capitalize ${
                copyMode === m
                  ? 'bg-sky-700 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {m === 'handle' ? 'Handle Assign (p2 = p1)' : m === 'shallow' ? 'Shallow Copy (new p1)' : 'Deep Copy (clone)'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMutatedAddr((a) => (a === '0xFF00' ? '0xDEAD' : '0xFF00'))}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Mutate pkt2.hdr.addr
          </button>
        </div>
      </div>
    );
  }

  if (moduleId === 'm12_sv_tb') {
    const stages = ['Generator', 'Mailbox', 'BFM Driver', 'DUT Pins', 'Monitor', 'Scoreboard'];
    const mismatch = injectDutBug && tbStage === 5;
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
            <span>Active Layer: {stages[tbStage]}</span>
            <span className={mismatch ? 'text-rose-400 font-bold' : 'text-emerald-300 font-bold'}>
              {mismatch
                ? '▲ SCOREBOARD MISMATCH: Exp 0xA5 vs Act 0xA4'
                : '● TRANSACTION IN FLIGHT'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-6 font-mono text-xs">
            {stages.map((s, idx) => (
              <button
                key={s}
                type="button"
                onClick={() => setTbStage(idx)}
                className={`rounded-lg border p-3 text-center transition-colors ${
                  idx === tbStage
                    ? idx === 5 && injectDutBug
                      ? 'border-rose-400 bg-rose-950/60 text-white'
                      : 'border-sky-400 bg-sky-950/60 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                <div className="font-semibold">{s}</div>
                <div className="mt-1 text-[10px]">
                  {idx < 3 ? 'TLM Object' : idx === 3 ? 'Pin Wiggle' : idx === 4 ? 'Reconstruct' : 'Compare'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setTbStage((s) => (s + 1) % stages.length)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            Step Next Layer
          </button>
          <button
            type="button"
            onClick={() => setInjectDutBug((b) => !b)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold ${
              injectDutBug ? 'bg-rose-700 text-white' : 'border border-slate-300 bg-white text-slate-700'
            }`}
          >
            DUT Bug Injection: {injectDutBug ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    );
  }

  if (moduleId === 'm13_crv_coverage') {
    const dist = runCrvDistribution(solveBefore, 64);
    const pct0 = Math.round((dist.mode0Count / 64) * 100);
    const pct1 = 100 - pct0;
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
            <span>constraint c_burst {'{'} {solveBefore ? 'solve mode_en before len; ' : ''}mode_en==0 -&gt; len==1; mode_en==1 -&gt; len inside [2:16]; {'}'}</span>
            <span className={solveBefore ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
              {solveBefore ? '✓ BALANCED 50/50 DISTRIBUTION' : '▲ COMBINATORIAL BIAS (6% Mode 0)'}
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-mono">
                <span>mode_en == 0 (Single beat, len=1)</span>
                <span>{dist.mode0Count} / 64 ({pct0}%)</span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full bg-sky-400 transition-all" style={{ width: `${pct0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-mono">
                <span>mode_en == 1 (Burst, len=2..16)</span>
                <span>{dist.mode1Count} / 64 ({pct1}%)</span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct1}%` }} />
              </div>
            </div>
            <div className="pt-2 font-mono text-emerald-300">
              Cross Coverage Closure: {dist.crossCoveragePct}% ({dist.lenBinsHit[0]}/{dist.lenBinsHit[1]} bins hit)
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSolveBefore((v) => !v)}
          className={`rounded-lg px-4 py-2 text-xs font-semibold text-white ${
            solveBefore ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-sky-700 hover:bg-sky-800'
          }`}
        >
          {solveBefore ? 'solve mode_en before len: ENABLED' : 'Enable solve mode_en before len'}
        </button>
      </div>
    );
  }

  if (moduleId === 'm14_sva_assertions') {
    const outcomes = evaluateSvaProperty(svaOp, reqVec, ackVec);
    const failCount = outcomes.filter((o) => o === 'FAIL').length;
    const toggleBit = (setter: React.Dispatch<React.SetStateAction<number[]>>, idx: number) => {
      setter((arr) => arr.map((v, i) => (i === idx ? (v === 1 ? 0 : 1) : v)));
    };
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
            <span>assert property (@(posedge clk) req {svaOp} ack);</span>
            <span className={failCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-300 font-bold'}>
              {failCount > 0 ? `▲ ${failCount} ASSERTION FAILURE(S)` : '✓ ALL ATTEMPTS PASSED / VACUOUS'}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-center font-mono text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-1.5 text-left">Cycle</th>
                  {reqVec.map((_, i) => (
                    <th key={i}>C{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-2 text-left text-sky-300">req (click)</td>
                  {reqVec.map((v, i) => (
                    <td key={i}>
                      <button
                        type="button"
                        onClick={() => toggleBit(setReqVec, i)}
                        className={`h-7 w-7 rounded font-bold ${
                          v ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {v}
                      </button>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 text-left text-amber-300">ack (click)</td>
                  {ackVec.map((v, i) => (
                    <td key={i}>
                      <button
                        type="button"
                        onClick={() => toggleBit(setAckVec, i)}
                        className={`h-7 w-7 rounded font-bold ${
                          v ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {v}
                      </button>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 text-left text-slate-300">Outcome</td>
                  {outcomes.map((o, i) => (
                    <td
                      key={i}
                      className={`text-[10px] font-bold ${
                        o === 'PASS'
                          ? 'text-emerald-400'
                          : o === 'FAIL'
                            ? 'text-rose-400'
                            : 'text-slate-500'
                      }`}
                    >
                      {o}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSvaOp('|->')}
            className={`rounded-lg px-3.5 py-2 font-mono text-xs font-semibold ${
              svaOp === '|->' ? 'bg-sky-700 text-white' : 'border border-slate-300 bg-white text-slate-700'
            }`}
          >
            Overlapping (|→) Same Cycle
          </button>
          <button
            type="button"
            onClick={() => setSvaOp('|=>')}
            className={`rounded-lg px-3.5 py-2 font-mono text-xs font-semibold ${
              svaOp === '|=>' ? 'bg-sky-700 text-white' : 'border border-slate-300 bg-white text-slate-700'
            }`}
          >
            Non-Overlapping (|=&gt;) Next Cycle
          </button>
        </div>
      </div>
    );
  }

  if (moduleId === 'm15_uvm_core') {
    const phases = [
      { name: 'build_phase', order: 'Top-Down', detail: 'uvm_test creates env → agent → driver using Factory + config_db.' },
      { name: 'connect_phase', order: 'Bottom-Up', detail: 'Binds driver.seq_item_port.connect(sequencer.seq_item_export) & monitor TLM ports.' },
      { name: 'run_phase', order: 'Parallel Task', detail: 'raise_objection() keeps simulation alive while sequencer & driver handshake items.' },
      { name: 'report_phase', order: 'Bottom-Up', detail: 'Summarizes UVM_ERROR count and coverage signoff metrics.' },
    ];
    const p = phases[uvmPhaseIdx];
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="grid gap-2 sm:grid-cols-4 font-mono text-xs">
            {phases.map((ph, idx) => (
              <button
                key={ph.name}
                type="button"
                onClick={() => setUvmPhaseIdx(idx)}
                className={`rounded-lg border p-3 text-left ${
                  uvmPhaseIdx === idx ? 'border-sky-400 bg-sky-950/60 text-white' : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                <div className="font-bold">{ph.name}</div>
                <div className="text-[10px] text-sky-300">{ph.order}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4 text-xs space-y-2">
            <div className="font-mono font-bold text-sky-300">
              Active Phase: {p.name} ({p.order}) · Instantiated Driver: {factoryOverride ? 'err_driver (Factory Override)' : 'base_driver'}
            </div>
            <p className="text-slate-300">{p.detail}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFactoryOverride((v) => !v)}
          className={`rounded-lg px-4 py-2 text-xs font-semibold text-white ${
            factoryOverride ? 'bg-amber-600' : 'bg-sky-700'
          }`}
        >
          {factoryOverride ? 'Factory Override ACTIVE: base_driver → err_driver' : 'Apply Factory Override (base_driver → err_driver)'}
        </button>
      </div>
    );
  }

  if (moduleId === 'm16_uvm_advanced') {
    const syncMismatch = ralMirrored !== ralDutHw;
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
            <span>UVM RAL Register Sync Loop</span>
            <span className={syncMismatch ? 'text-rose-400 font-bold' : 'text-emerald-300 font-bold'}>
              {syncMismatch ? '▲ MIRROR MISMATCH DETECTED' : '✓ RAL MIRROR SYNCHRONIZED'}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3 font-mono text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <div className="text-slate-400">RAL Desired</div>
              <div className="mt-1 text-lg font-bold text-sky-300">{ralDesired}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <div className="text-slate-400">RAL Mirrored</div>
              <div className={`mt-1 text-lg font-bold ${syncMismatch ? 'text-rose-400' : 'text-emerald-300'}`}>
                {ralMirrored}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <div className="text-slate-400">DUT Hardware Reg</div>
              <div className="mt-1 text-lg font-bold text-amber-300">{ralDutHw}</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-300">{ralStatus}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setRalDesired('0x005A');
              setRalMirrored('0x005A');
              setRalDutHw('0x005A');
              setRalStatus('Frontdoor APB write executed across bus; uvm_reg_predictor updated Mirrored to 0x005A.');
            }}
            className="rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-800"
          >
            Frontdoor Write (0x005A)
          </button>
          <button
            type="button"
            onClick={() => {
              setRalDesired('0x00FF');
              setRalMirrored('0x00FF');
              setRalDutHw('0x00FF');
              setRalStatus('Backdoor HDL poke updated DUT hardware in 0 simulation time (protocol bypassed).');
            }}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Backdoor Poke (0-Time)
          </button>
          <button
            type="button"
            onClick={() => {
              setRalDutHw('0x0000');
              setRalStatus('RTL hardware auto-cleared without bus predictor update—Mirrored is now stale!');
            }}
            className="rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            Inject HW Clear (Mismatch)
          </button>
        </div>
      </div>
    );
  }

  if (moduleId === 'm17_apb_fifo_verif') {
    const steps = buildApbWaveform(apbWrite, waitStates, apbErr);
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
            <span>AMBA APB3/4 {apbWrite ? 'WRITE' : 'READ'} · {waitStates} Wait State(s)</span>
            <span className={apbErr ? 'text-rose-400 font-bold' : 'text-emerald-300 font-bold'}>
              {apbErr ? '▲ PSLVERR ON FINAL ACCESS BEAT' : '✓ CLEAN APB HANDSHAKE'}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-center font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-1.5 text-left">Signal</th>
                  {steps.map((s) => (
                    <th key={s.cycle}>T{s.cycle}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-2 text-left text-slate-300">FSM State</td>
                  {steps.map((s) => (
                    <td key={s.cycle} className="text-[11px] font-bold text-sky-300">
                      {s.state}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 text-left text-sky-300">PSEL</td>
                  {steps.map((s) => (
                    <td key={s.cycle} className={s.psel ? 'text-sky-300 font-bold' : 'text-slate-600'}>
                      {s.psel}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 text-left text-amber-300">PENABLE</td>
                  {steps.map((s) => (
                    <td key={s.cycle} className={s.penable ? 'text-amber-300 font-bold' : 'text-slate-600'}>
                      {s.penable}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 text-left text-emerald-300">PREADY</td>
                  {steps.map((s) => (
                    <td key={s.cycle} className={s.pready ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                      {s.pready}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 text-left text-rose-300">PSLVERR</td>
                  {steps.map((s) => (
                    <td key={s.cycle} className={s.pslverr ? 'text-rose-400 font-bold' : 'text-slate-600'}>
                      {s.pslverr}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <span>Wait States:</span>
            <input
              type="range"
              min={0}
              max={3}
              value={waitStates}
              onChange={(e) => setWaitStates(Number(e.target.value))}
              className="w-28 accent-sky-700"
            />
            <span className="font-mono tabular-nums">{waitStates}</span>
          </label>
          <button
            type="button"
            onClick={() => setApbWrite((w) => (w === 1 ? 0 : 1))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            PWRITE = {apbWrite} ({apbWrite ? 'Write' : 'Read'})
          </button>
          <button
            type="button"
            onClick={() => setApbErr((e) => !e)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              apbErr ? 'bg-rose-700 text-white' : 'border border-slate-300 bg-white text-slate-700'
            }`}
          >
            PSLVERR: {apbErr ? 'Injected' : 'Off'}
          </button>
        </div>
      </div>
    );
  }

  // m18_dv_interview_prep
  const fixed = debugFix === 'off_by_one';
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
          <span>Regression Failure Replay: seed=849201 · t=40ns (FIFO Backpressure)</span>
          <span className={fixed ? 'text-emerald-300 font-bold' : 'text-rose-400 font-bold'}>
            {fixed ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                BUG FIXED — ASSERTION &amp; SCOREBOARD PASS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                OVF_ASSERT FAILED AT CYCLE 4 (wr_en &amp; full)
              </span>
            )}
          </span>
        </div>

        <div className="mt-4 space-y-2 font-mono text-xs text-slate-300">
          <div>[20ns] wr_en=1, count=7, full=0 → push OK</div>
          <div>[30ns] wr_en=1, count=8, full={fixed ? '1 (backpressure ready=0)' : '0 (off-by-1!)'}</div>
          <div className={fixed ? 'text-emerald-300 font-bold' : 'text-rose-400 font-bold'}>
            [40ns] {fixed ? 'Driver stalled cleanly on !ready; zero overflow.' : 'CRITICAL: Extra write dropped entry at addr[0]!'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['none', 'reset_race', 'off_by_one'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setDebugFix(opt)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold ${
              debugFix === opt
                ? opt === 'off_by_one'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-sky-700 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {opt === 'none'
              ? 'Baseline Buggy RTL'
              : opt === 'reset_race'
                ? 'Try Fix A: Reset Delay'
                : 'Try Fix B: Gate Full on count==DEPTH'}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setDebugFix('none')}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset Trace
        </button>
      </div>
    </div>
  );
};
