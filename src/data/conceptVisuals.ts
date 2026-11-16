import { TopicDomain } from '../types/interview';

export interface ConceptVisualMeta {
  moduleId: string;
  imageUrl: string;
  imageAlt: string;
  visualCaption: string;
  keyInvariant: string;
  simulationTitle: string;
  simulationSubtitle: string;
  walkthroughSteps: string[];
  domain: TopicDomain;
}

const IMG_DIGITAL_CMOS = '/src/assets/images/concept_digital_logic_cmos_1794812006539.jpg';
const IMG_SEQUENTIAL_TIMING = '/src/assets/images/concept_sequential_timing_1794812007109.jpg';
const IMG_SYNTHESIS_CDC = '/src/assets/images/concept_synthesis_cdc_1794812007682.jpg';
const IMG_SYSTEMVERILOG_TB = '/src/assets/images/concept_systemverilog_tb_1794812008448.jpg';
const IMG_UVM_ASSERTIONS = '/src/assets/images/concept_uvm_assertions_1794812008979.jpg';
const IMG_APB_SOC_BUS = '/src/assets/images/concept_apb_soc_bus_1794812010057.jpg';
const IMG_SILICON_DIE = '/src/assets/images/hero_silicon_die_1794810564779.jpg';
const IMG_BLUEPRINT = '/src/assets/images/chip_verification_blueprint_1794810565832.jpg';

export const CONCEPT_VISUAL_MAP: Record<string, ConceptVisualMeta> = {
  m1_number_gates: {
    moduleId: 'm1_number_gates',
    imageUrl: IMG_DIGITAL_CMOS,
    imageAlt: 'Macro photograph of CMOS silicon logic interconnects',
    visualCaption: 'CMOS Gate-Level Interconnects & Arithmetic Datapath',
    keyInvariant: 'Signed Overflow = Cin_MSB ⊕ Cout_MSB',
    simulationTitle: '4-Bit Two’s Complement Carry & Overflow Simulator',
    simulationSubtitle:
      'Adjust signed operands A and B to observe bit-level ripple carries and why Cin_MSB XOR Cout_MSB isolates true signed overflow.',
    walkthroughSteps: [
      'Set A = +6 and B = +4 to trigger Cin_MSB = 1 while Cout_MSB = 0 (Overflow = 1).',
      'Set A = +5 and B = -2 to observe Cout_MSB = 1 yet Overflow = 0 because Cin_MSB = 1.',
      'Compare unsigned Cout against signed overflow—they are completely distinct flags.',
    ],
    domain: 'Digital Electronics',
  },
  m2_comb_circuits: {
    moduleId: 'm2_comb_circuits',
    imageUrl: IMG_SILICON_DIE,
    imageAlt: 'Macro rendering of silicon combinational logic routing',
    visualCaption: 'Combinational Path Skew & Consensus Glitch Suppression',
    keyInvariant: 'F = (A·B) + (~A·C) + (B·C) eliminates Static-1 hazards',
    simulationTitle: 'Static-1 Hazard & Consensus Term Waveform Simulator',
    simulationSubtitle:
      'Step input A from 1→0 with B=C=1 and vary inverter propagation delay to see the glitch disappear when the redundant consensus term (B & C) is added.',
    walkthroughSteps: [
      'Disable Consensus Term (B & C) and note the temporary 1→0→1 drop across the inverter delay window.',
      'Increase Inverter Delay Δt to see the glitch pulse widen proportionally.',
      'Enable Consensus Term (B & C) to hold F = 1 continuously across A’s transition.',
    ],
    domain: 'Digital Electronics',
  },
  m3_fsm_intro: {
    moduleId: 'm3_fsm_intro',
    imageUrl: IMG_SEQUENTIAL_TIMING,
    imageAlt: 'Precision semiconductor bench probing clock and setup timing windows',
    visualCaption: 'Setup / Hold Capture Window & Latch Transparency',
    keyInvariant: 'Launch + T_comb + T_setup ≤ T_clk + T_skew',
    simulationTitle: 'D-Latch vs Edge-Triggered Flip-Flop Timing Window Simulator',
    simulationSubtitle:
      'Slide the Data (D) transition across the rising clock edge to contrast latch transparency against flip-flop Setup/Hold metastability windows.',
    walkthroughSteps: [
      'Move D edge before -T_setup to see clean synchronous capture on the rising edge.',
      'Drag D inside [-T_setup, +T_hold] to trigger Setup/Hold violation & metastable uncertainty.',
      'Drag D into CLK = 1 (+100 ps) to observe the D-latch leaking pulses while the flip-flop holds steady.',
    ],
    domain: 'Digital Electronics',
  },
  m4_sequential_counters: {
    moduleId: 'm4_sequential_counters',
    imageUrl: IMG_SEQUENTIAL_TIMING,
    imageAlt: 'High-frequency clock distribution traces on semiconductor validation monitor',
    visualCaption: 'Ripple Skew Cascades vs Synchronous Clock Tree',
    keyInvariant: 'Fmax(ripple) = 1 / (N · t_pd_FF) vs Fmax(sync) = 1 / (t_pd_FF + t_LUT)',
    simulationTitle: 'Ripple vs Synchronous 4-Bit Counter Timing Simulator',
    simulationSubtitle:
      'Step the 4-bit counter across 0111→1000 and adjust flip-flop t_pd to expose cumulative ripple delay and transient decode glitches.',
    walkthroughSteps: [
      'Step to Count = 8 (0111→1000) to see all 4 bits cascading asynchronously in the ripple counter.',
      'Raise Flip-Flop Delay above 90 ps to watch cumulative ripple delay exceed the clock period.',
      'Compare synchronous mode where all Q bits share one clock tree and settle within one FF+gate delay.',
    ],
    domain: 'Sequential Circuits',
  },
  m5_verilog_basics: {
    moduleId: 'm5_verilog_basics',
    imageUrl: IMG_DIGITAL_CMOS,
    imageAlt: 'Architectural macro of digital logic nets and registers on silicon',
    visualCaption: 'IEEE 1800 Stratified Event Queue & Net/Variable Semantics',
    keyInvariant: 'Active Region (= & RHS) → Inactive (#0) → NBA Update (<= LHS) → Monitor',
    simulationTitle: 'Verilog Stratified Event Queue Stepper',
    simulationSubtitle:
      'Step through a single simulation timestamp across Active, Inactive, Non-Blocking Update (NBA), and Postponed Monitor regions.',
    walkthroughSteps: [
      'Active Region evaluates RHS of <= and executes blocking = immediately.',
      'NBA Region applies scheduled <= LHS updates without creating combinational read races.',
      'Monitor/Postponed Region prints final settled values at the end of the timestamp.',
    ],
    domain: 'Verilog & RTL',
  },
  m6_blocking_nonblocking: {
    moduleId: 'm6_blocking_nonblocking',
    imageUrl: IMG_SEQUENTIAL_TIMING,
    imageAlt: 'Oscilloscope trace monitoring synchronous flip-flop pipeline stages',
    visualCaption: 'Pipeline Shift Register Race Conditions (= vs <=)',
    keyInvariant: 'Sequential always @(posedge clk) blocks must use <= (NBA)',
    simulationTitle: '2-Stage Shift Register Race Simulator (= vs <=)',
    simulationSubtitle:
      'Toggle between Blocking (=) and Non-Blocking (<=) inside always @(posedge clk) and pulse serial input bits across clock edges.',
    walkthroughSteps: [
      'Switch to Buggy Blocking (=): q1 updates to din immediately, causing q2 = q1 to collapse into 1 flip-flop.',
      'Switch to Safe Non-Blocking (<=): q2 captures the prior cycle’s q1 cleanly on every posedge clk.',
      'Send alternating 1/0 pulses to verify the 2-cycle pipeline delay difference.',
    ],
    domain: 'Verilog & RTL',
  },
  m7_rtl_synthesis: {
    moduleId: 'm7_rtl_synthesis',
    imageUrl: IMG_SYNTHESIS_CDC,
    imageAlt: 'Isometric silicon standard-cell synthesis floorplan',
    visualCaption: 'Combinational Synthesis vs Unintended Latch Inference',
    keyInvariant: 'Incomplete if/case branches in always @(*) infer level-sensitive latches',
    simulationTitle: 'RTL Synthesis & Latch Inference Inspector',
    simulationSubtitle:
      'Toggle default/else branch completion and reset strategy to see synthesized gate hardware morph in real time.',
    walkthroughSteps: [
      'Uncheck "Default / Else Assignment" to see synthesis infer an unintended D-latch holding previous state.',
      'Re-enable complete assignment to synthesize clean glitch-free MUX combinational logic.',
      'Toggle Sync vs Async Reset to inspect reset release behavior relative to posedge clk.',
    ],
    domain: 'Synthesis & Timing',
  },
  m8_cdc_timing: {
    moduleId: 'm8_cdc_timing',
    imageUrl: IMG_SYNTHESIS_CDC,
    imageAlt: 'Isometric rendering of dual-clock silicon crossing bridge and synchronization rails',
    visualCaption: 'Dual-Clock Synchronization & Gray-Coded Bus Crossing',
    keyInvariant: 'Multi-bit CDC buses require Gray coding (1-bit delta) or handshake/async FIFO',
    simulationTitle: '2-FF Metastability & Gray-Coded CDC Simulator',
    simulationSubtitle:
      'Toggle Binary vs Gray bus encoding across asynchronous clock domains (011→100) and inspect why multi-bit binary skew corrupts samples.',
    walkthroughSteps: [
      'Select Binary mode across 3→4 (011→100): all 3 wires flip simultaneously, risking sampled glitch values like 111.',
      'Enable Gray Code mode: adjacent counts differ by exactly 1 bit, bounding uncertainty to old or new count.',
      'Disable 2-FF Synchronizer to observe raw metastability propagation into destination logic.',
    ],
    domain: 'Synthesis & Timing',
  },
  m9_rtl_fifo: {
    moduleId: 'm9_rtl_fifo',
    imageUrl: IMG_APB_SOC_BUS,
    imageAlt: 'Cutaway visualization of silicon memory array and pointer routing lanes',
    visualCaption: 'Circular Buffer Memory Array & Wrap-Around Pointer Logic',
    keyInvariant: 'FULL when wr_ptr[MSB] != rd_ptr[MSB] && wr_ptr[2:0] == rd_ptr[2:0]',
    simulationTitle: '8-Deep Synchronous FIFO Circular Buffer Simulator',
    simulationSubtitle:
      'Push, Pop, or simultaneously Push+Pop entries to watch 4-bit extra-MSB pointers wrap cleanly around the 8-entry circular array.',
    walkthroughSteps: [
      'Push until Occupancy = 8/8: notice wr_ptr[3] flips to 1 while wr_ptr[2:0] == rd_ptr[2:0] (FULL asserted).',
      'Trigger Simultaneous Push+Pop when partially full to verify steady occupancy.',
      'Pop until wr_ptr == rd_ptr (including MSB) to trigger EMPTY.',
    ],
    domain: 'Verilog & RTL',
  },
  m10_sv_types: {
    moduleId: 'm10_sv_types',
    imageUrl: IMG_SYSTEMVERILOG_TB,
    imageAlt: 'Modular SystemVerilog hardware verification cleanroom console',
    visualCaption: '4-State vs 2-State Data Types & Interface Clocking Blocks',
    keyInvariant: '2-state bit silently masks X→0 at reset; use 4-state logic for DUT pin sampling',
    simulationTitle: 'SystemVerilog 4-State (logic) vs 2-State (bit) X-Masking Simulator',
    simulationSubtitle:
      'Inject an uninitialized X value on reset and compare how 4-state logic preserves X versus 2-state bit coercing X to 0.',
    walkthroughSteps: [
      'Toggle "Drive X on Reset Bus" ON while inspecting 2-state bit: X silently turns into 0 (hiding reset bugs!).',
      'Switch probe signal to 4-state logic: X propagation is flagged explicitly across assertions & waveforms.',
    ],
    domain: 'SystemVerilog & OOP',
  },
  m11_sv_oop: {
    moduleId: 'm11_sv_oop',
    imageUrl: IMG_SYSTEMVERILOG_TB,
    imageAlt: 'Layered SystemVerilog object blocks linked by optical data fibers',
    visualCaption: 'OOP Class Handles, Heap Aliasing & Deep Copy Cloning',
    keyInvariant: 'Shallow copy duplicates top properties but shares sub-object handles',
    simulationTitle: 'SystemVerilog Handle, Shallow Copy & Deep Copy Heap Visualizer',
    simulationSubtitle:
      'Switch between Handle Assignment, Shallow Copy, and Deep Copy, then mutate pkt2.hdr.addr to observe heap reference aliasing live.',
    walkthroughSteps: [
      'Select Handle Copy (h2 = h1): mutating h2 modifies h1 directly because both point to one object.',
      'Select Shallow Copy: top-level id separates, but nested hdr sub-object remains aliased!',
      'Select Deep Copy: both parent and nested hdr objects allocate isolated heap blocks.',
    ],
    domain: 'SystemVerilog & OOP',
  },
  m12_sv_tb: {
    moduleId: 'm12_sv_tb',
    imageUrl: IMG_BLUEPRINT,
    imageAlt: 'Verification testbench architecture schematic diagram',
    visualCaption: 'Layered Generator → Driver → DUT → Monitor → Scoreboard Dataflow',
    keyInvariant: 'Passive monitor observes pin-level DUT outputs independently of the driver',
    simulationTitle: 'Layered SystemVerilog Testbench Transaction Flow Simulator',
    simulationSubtitle:
      'Step randomized transactions through Generator, Mailbox, BFM Driver, DUT, Passive Monitor, and Golden Scoreboard.',
    walkthroughSteps: [
      'Step forward to trace a randomized packet from Generator mailbox to pin-level BFM Driver.',
      'Toggle "Inject DUT RTL Bug" and advance to Scoreboard to watch Expected vs Actual catch the mismatch.',
    ],
    domain: 'SystemVerilog & OOP',
  },
  m13_crv_coverage: {
    moduleId: 'm13_crv_coverage',
    imageUrl: IMG_UVM_ASSERTIONS,
    imageAlt: 'Wafer probe verification array collecting coverage across silicon die',
    visualCaption: 'Constraint Solver Ordering (solve-before) & Coverage Closure',
    keyInvariant: 'solve A before B eliminates combinatorial solution-count bias',
    simulationTitle: 'Constrained Randomization & solve-before Distribution Simulator',
    simulationSubtitle:
      'Run 64 constrained randomizations with solve-before OFF vs ON to eliminate 1/16 burst bias and close cross-coverage bins.',
    walkthroughSteps: [
      'Keep solve-before OFF: Mode=0 (single) appears only ~6% of runs because Mode=1 has 15 length combinations.',
      'Toggle solve mode_en before len ON: Mode splits ~50/50 cleanly while honoring all length constraints.',
    ],
    domain: 'Constrained Random & Coverage',
  },
  m14_sva_assertions: {
    moduleId: 'm14_sva_assertions',
    imageUrl: IMG_UVM_ASSERTIONS,
    imageAlt: 'Dual laser optical beams checking concurrent protocol timing on silicon wafer',
    visualCaption: 'Concurrent SVA Implication & Multi-Cycle Protocol Sampling',
    keyInvariant: '|-> evaluates consequent in same cycle; |=> advances exactly 1 clock cycle',
    simulationTitle: 'SVA Implication Operator (|-> vs |=>) Waveform Evaluator',
    simulationSubtitle:
      'Click cycle bits for req and ack and switch between overlapping |-> and non-overlapping |=> to trace PASS, FAIL, and VACUOUS outcomes.',
    walkthroughSteps: [
      'Notice cycles with req=0 evaluate to VACUOUS PASS (antecedent not triggered).',
      'Toggle |-> vs |=> on cycles where ack asserts one cycle after req to switch FAIL to PASS.',
    ],
    domain: 'Functional Verification & SVA',
  },
  m15_uvm_core: {
    moduleId: 'm15_uvm_core',
    imageUrl: IMG_SYSTEMVERILOG_TB,
    imageAlt: 'Modular cleanroom verification architecture and component hierarchy',
    visualCaption: 'UVM Component Hierarchy, Phasing & Factory Overrides',
    keyInvariant: 'build_phase runs Top-Down; connect_phase runs Bottom-Up',
    simulationTitle: 'UVM Phase Execution, Factory Override & Handshake Simulator',
    simulationSubtitle:
      'Step across build/connect/run/report phases, inspect objection gating, and toggle Factory Override to swap base_driver cleanly.',
    walkthroughSteps: [
      'Step into build_phase (Top-Down) to configure children via uvm_config_db before creation.',
      'Step into connect_phase (Bottom-Up) to bind TLM ports and sequencer-driver connections.',
      'Enable Factory Type Override to substitute err_driver without editing the testbench environment.',
    ],
    domain: 'UVM Architecture',
  },
  m16_uvm_advanced: {
    moduleId: 'm16_uvm_advanced',
    imageUrl: IMG_APB_SOC_BUS,
    imageAlt: 'SoC bus routing register transactions into memory-mapped hardware blocks',
    visualCaption: 'UVM Register Abstraction Layer (RAL) Frontdoor vs Backdoor',
    keyInvariant: 'uvm_reg_predictor keeps RAL Mirror synced across passive bus traffic',
    simulationTitle: 'UVM RAL Desired / Mirrored / Hardware Register Sync Simulator',
    simulationSubtitle:
      'Issue Frontdoor bus writes, 0-time Backdoor pokes, or direct RTL mutations to see Desired vs Mirrored synchronization.',
    walkthroughSteps: [
      'Trigger Frontdoor Write: consumes APB bus cycles and updates Desired, DUT HW, and Mirrored via predictor.',
      'Trigger Backdoor Poke: updates DUT HW in 0 simulation time without exercising the bus protocol.',
      'Inject Unpredicted RTL Clear to observe mirror mismatch caught by Mirror Check.',
    ],
    domain: 'UVM Architecture',
  },
  m17_apb_fifo_verif: {
    moduleId: 'm17_apb_fifo_verif',
    imageUrl: IMG_APB_SOC_BUS,
    imageAlt: 'AMBA APB multi-lane bus interface connecting SoC controller and FIFO array',
    visualCaption: 'AMBA APB3/APB4 2-Phase Transfer & Wait-State Timing',
    keyInvariant: 'SETUP (PSEL=1, PENABLE=0, 1 cycle) → ACCESS (PSEL=1, PENABLE=1 until PREADY=1)',
    simulationTitle: 'AMBA APB3/4 Protocol Waveform & Wait-State FSM Simulator',
    simulationSubtitle:
      'Adjust PREADY Wait States (0–3 cycles), switch Read/Write, and inject PSLVERR to inspect cycle-accurate bus handshakes.',
    walkthroughSteps: [
      'Set Wait States = 0: transfer completes in 2 cycles (SETUP → ACCESS with PREADY=1).',
      'Increase Wait States = 2: PSEL and PENABLE remain asserted while PADDR/PWDATA hold steady until PREADY=1.',
      'Toggle Inject PSLVERR ON to verify error signaling only on the final active ACCESS cycle.',
    ],
    domain: 'Protocols & FIFO Verification',
  },
  m18_dv_interview_prep: {
    moduleId: 'm18_dv_interview_prep',
    imageUrl: IMG_BLUEPRINT,
    imageAlt: 'Complete IC verification signoff blueprint and waveform triage schematic',
    visualCaption: 'Root-Cause Waveform Debug & Coverage Closure Signoff',
    keyInvariant: 'Reproduce with fixed Seed → Isolate failing time window → Patch & Regression Sweep',
    simulationTitle: 'Failure Waveform Triage & Root-Cause Isolation Console',
    simulationSubtitle:
      'Inspect a failing FIFO/APB waveform capture at t = 40 ns and apply candidate RTL/TB fixes to verify assertion & scoreboard closure.',
    walkthroughSteps: [
      'Inspect Baseline Capture: Scoreboard mismatches at cycle 4 right as valid && full overlap.',
      'Test Candidate Fix "Reset Race" vs "Backpressure Off-by-1" to isolate the true RTL defect.',
    ],
    domain: 'Protocols & FIFO Verification',
  },
};

export function getConceptVisual(moduleId?: string): ConceptVisualMeta {
  if (moduleId && CONCEPT_VISUAL_MAP[moduleId]) {
    return CONCEPT_VISUAL_MAP[moduleId];
  }
  return CONCEPT_VISUAL_MAP.m1_number_gates;
}
