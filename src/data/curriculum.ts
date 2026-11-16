import { CheckpointDay, CheckpointDefinition, CurriculumModule } from '../types/interview';

export const CHECKPOINTS: CheckpointDefinition[] = [
  {
    checkpointNumber: 1,
    day: 15,
    title: 'Interview 1: Digital Logic Foundations',
    topicsCovered: 'Digital Electronics and Logic Design',
    domains: ['Digital Electronics'],
    windowStartDay: 14,
    windowEndDay: 17,
    durationMinutes: 35,
  },
  {
    checkpointNumber: 2,
    day: 30,
    title: 'Interview 2: Sequential Design & Verilog Core',
    topicsCovered: 'Digital Electronics, Sequential Circuits and Verilog',
    domains: ['Digital Electronics', 'Sequential Circuits', 'Verilog & RTL'],
    windowStartDay: 29,
    windowEndDay: 32,
    durationMinutes: 35,
  },
  {
    checkpointNumber: 3,
    day: 45,
    title: 'Interview 3: RTL Synthesis & Simulation',
    topicsCovered: 'Verilog, RTL Design, Simulation and Synthesis',
    domains: ['Digital Electronics', 'Sequential Circuits', 'Verilog & RTL', 'Synthesis & Timing'],
    windowStartDay: 44,
    windowEndDay: 47,
    durationMinutes: 40,
  },
  {
    checkpointNumber: 4,
    day: 60,
    title: 'Interview 4: SystemVerilog & OOP Testbenches',
    topicsCovered: 'SystemVerilog, OOP and Testbench Development',
    domains: [
      'Digital Electronics',
      'Sequential Circuits',
      'Verilog & RTL',
      'Synthesis & Timing',
      'SystemVerilog & OOP',
    ],
    windowStartDay: 59,
    windowEndDay: 62,
    durationMinutes: 40,
  },
  {
    checkpointNumber: 5,
    day: 75,
    title: 'Interview 5: Verification, SVA & UVM',
    topicsCovered: 'Functional Verification, Assertions and UVM',
    domains: [
      'Verilog & RTL',
      'Synthesis & Timing',
      'SystemVerilog & OOP',
      'Constrained Random & Coverage',
      'Functional Verification & SVA',
      'UVM Architecture',
    ],
    windowStartDay: 74,
    windowEndDay: 77,
    durationMinutes: 45,
  },
  {
    checkpointNumber: 6,
    day: 90,
    title: 'Interview 6: Entry-Level RTL & DV Readiness',
    topicsCovered: 'Complete RTL and Design Verification Interview',
    domains: [
      'Digital Electronics',
      'Sequential Circuits',
      'Verilog & RTL',
      'Synthesis & Timing',
      'SystemVerilog & OOP',
      'Constrained Random & Coverage',
      'Functional Verification & SVA',
      'UVM Architecture',
      'Protocols & FIFO Verification',
    ],
    windowStartDay: 88,
    windowEndDay: 90,
    durationMinutes: 45,
  },
];

export const CURRICULUM_MODULES: CurriculumModule[] = [
  // Phase 1: Days 1-15
  {
    id: 'm1_number_gates',
    phaseDay: 15,
    dayRange: 'Days 1–5',
    title: 'Number Systems, Boolean Algebra & Logic Gates',
    domain: 'Digital Electronics',
    summary: 'Two’s complement arithmetic, De Morgan’s laws, universal NAND/NOR implementation, and K-map minimization.',
    lessons: [
      'Binary, Hex, Two’s Complement & Overflow Detection',
      'CMOS & Gate-Level Equivalences (NAND/NOR Universality)',
      'Karnaugh Maps & Don’t-Care Minimization',
    ],
  },
  {
    id: 'm2_comb_circuits',
    phaseDay: 15,
    dayRange: 'Days 6–10',
    title: 'Combinational Building Blocks & Arithmetic',
    domain: 'Digital Electronics',
    summary: 'Multiplexers, decoders, priority encoders, ripple-carry vs carry-lookahead adders, and hazard elimination.',
    lessons: [
      'MUX-based Function Realization & Shannon Expansion',
      'Half/Full Adders, Carry-Lookahead & Subtractor Logic',
      'Static-0/Static-1 Hazards & Glitch-Free Combinational Paths',
    ],
  },
  {
    id: 'm3_fsm_intro',
    phaseDay: 15,
    dayRange: 'Days 11–15',
    title: 'Latches, Flip-Flops & Intro to State Machines',
    domain: 'Digital Electronics',
    summary: 'SR/D latches vs edge-triggered D flip-flops, setup/hold basics, Mealy vs Moore fundamentals.',
    lessons: [
      'Level-Sensitive Latches vs Edge-Triggered Flip-Flops',
      'Setup Time, Hold Time & Clock-to-Q Timing Equations',
      'Mealy vs Moore State Transition Diagrams',
    ],
    projectTitle: '4-Bit Structural ALU & Parity Checker',
    projectDescription: 'Designed a combinational 4-bit ALU supporting add, subtract, bitwise XOR/AND, and zero/overflow flags using minimized gate logic.',
  },

  // Phase 2: Days 16-30
  {
    id: 'm4_sequential_counters',
    phaseDay: 30,
    dayRange: 'Days 16–20',
    title: 'Counters, Shift Registers & Sequence Detectors',
    domain: 'Sequential Circuits',
    summary: 'Synchronous vs asynchronous counters, Johnson/ring counters, LFSRs, and overlapping sequence detector FSMs.',
    lessons: [
      'Synchronous vs Ripple Counters & Max Operating Frequency',
      'Shift Registers, PISO/SIPO & LFSR Feedback Polynomials',
      'Overlapping vs Non-Overlapping FSM Sequence Detectors',
    ],
  },
  {
    id: 'm5_verilog_basics',
    phaseDay: 30,
    dayRange: 'Days 21–25',
    title: 'Verilog Fundamentals: Wire vs Reg & Procedural Blocks',
    domain: 'Verilog & RTL',
    summary: 'Net vs variable data types, continuous assignments, always blocks, sensitivity lists, and event scheduling.',
    lessons: [
      'Wire vs Reg Semantics & Continuous assign Statements',
      'Combinational always @(*) vs Sequential always @(posedge clk)',
      'Verilog Stratified Event Queue & Simulation Determinism',
    ],
  },
  {
    id: 'm6_blocking_nonblocking',
    phaseDay: 30,
    dayRange: 'Days 26–30',
    title: 'Blocking vs Non-Blocking Assignments & Basic Testbenches',
    domain: 'Verilog & RTL',
    summary: 'Race conditions from blocking assignments in flip-flops, shift register bugs, and self-checking Verilog testbenches.',
    lessons: [
      'Blocking (=) vs Non-Blocking (<=) Execution Semantics',
      '3-Always vs 2-Always FSM Coding Style in Verilog',
      'Clock Generation, Reset Stimulus & Self-Checking Testbenches',
    ],
    projectTitle: 'Traffic Light Controller FSM in Verilog',
    projectDescription: 'Implemented a 2-always-block Moore FSM traffic controller with pedestrian override and a self-checking Verilog testbench.',
  },

  // Phase 3: Days 31-45
  {
    id: 'm7_rtl_synthesis',
    phaseDay: 45,
    dayRange: 'Days 31–35',
    title: 'Synthesizable RTL & Latch Inference Prevention',
    domain: 'Synthesis & Timing',
    summary: 'Avoiding unintended latches, full/parallel case hazards, reset strategies (sync vs async), and resource sharing.',
    lessons: [
      'Latch Inference in Incomplete if/case Statements',
      'Synchronous vs Asynchronous Reset Trade-offs & Reset Synchronizers',
      'Synthesizable vs Non-Synthesizable Constructs (#delays, initial, ===)',
    ],
  },
  {
    id: 'm8_cdc_timing',
    phaseDay: 45,
    dayRange: 'Days 36–40',
    title: 'Static Timing Analysis & Clock Domain Crossing',
    domain: 'Synthesis & Timing',
    summary: 'Setup/hold slack equations, clock skew, pipelining for Fmax, metastability, 2-FF synchronizers, and Gray codes.',
    lessons: [
      'STA Setup/Hold Slack Formulas & Fixing Timing Violations',
      'Metastability, MTBF & 2-Flop Synchronizer Rules',
      'Multi-Bit CDC: Handshake Protocols & Gray-Coded Pointers',
    ],
  },
  {
    id: 'm9_rtl_fifo',
    phaseDay: 45,
    dayRange: 'Days 41–45',
    title: 'Parameterized RTL Design & Synchronous FIFO',
    domain: 'Verilog & RTL',
    summary: 'Writing clean parameterized Verilog modules, generate blocks, and full/empty pointer wrap-around logic.',
    lessons: [
      'Parameters, localparam & generate-for Hardware Replication',
      'Synchronous FIFO Architecture & Extra-MSB Full/Empty Detection',
      'Simulation Waveform Debugging & X-Propagation Analysis',
    ],
    projectTitle: 'Parameterized Synchronous FIFO (RTL + Waveforms)',
    projectDescription: 'Built a configurable depth/width synchronous FIFO with simultaneous read/write handling and verified boundary full/empty wrap cases.',
  },

  // Phase 4: Days 46-60
  {
    id: 'm10_sv_types',
    phaseDay: 60,
    dayRange: 'Days 46–50',
    title: 'SystemVerilog Data Types, Arrays & Interfaces',
    domain: 'SystemVerilog & OOP',
    summary: '4-state logic vs 2-state bit/int, packed vs unpacked arrays, dynamic arrays, queues, structs, and SV interfaces.',
    lessons: [
      'logic, bit, int & 2-State vs 4-State Simulation Pitfalls',
      'Packed/Unpacked Arrays, Associative Arrays & Queues',
      'SystemVerilog Interfaces, Modports & Clocking Blocks',
    ],
  },
  {
    id: 'm11_sv_oop',
    phaseDay: 60,
    dayRange: 'Days 51–55',
    title: 'Object-Oriented Programming for Verification',
    domain: 'SystemVerilog & OOP',
    summary: 'Classes, handles, shallow vs deep copy, inheritance, virtual methods, polymorphism, and static members.',
    lessons: [
      'Class Handles, Constructors & Shallow vs Deep Copying',
      'Inheritance, super.new(), Virtual Methods & Polymorphism',
      'Parameterized Classes & Mailboxes / Semaphores',
    ],
  },
  {
    id: 'm12_sv_tb',
    phaseDay: 60,
    dayRange: 'Days 56–60',
    title: 'Layered SystemVerilog Testbench Architecture',
    domain: 'SystemVerilog & OOP',
    summary: 'Building transaction classes, generator, driver, monitor, scoreboard, and reference models connected via mailboxes.',
    lessons: [
      'Transaction-Level Modeling in Plain SystemVerilog',
      'Generator–Driver–Monitor–Scoreboard Dataflow',
      'Eliminating Testbench Race Conditions with Program/Clocking Blocks',
    ],
    projectTitle: 'Layered SystemVerilog Testbench for Synchronous FIFO',
    projectDescription: 'Architected an OOP SystemVerilog testbench with mailbox-linked generator, BFM driver, passive monitor, and golden queue scoreboard.',
  },

  // Phase 5: Days 61-75
  {
    id: 'm13_crv_coverage',
    phaseDay: 75,
    dayRange: 'Days 61–65',
    title: 'Constrained Randomization & Functional Coverage',
    domain: 'Constrained Random & Coverage',
    summary: 'rand/randc, constraint blocks, solve-before, soft constraints, inline randomization, covergroups, and cross coverage.',
    lessons: [
      'rand vs randc, Constraint Solver Ordering (solve-before) & dist',
      'Covergroups, Coverpoints, Bins, Illegal Bins & Cross Coverage',
      'Code Coverage vs Functional Coverage & Coverage Closure Loops',
    ],
  },
  {
    id: 'm14_sva_assertions',
    phaseDay: 75,
    dayRange: 'Days 66–70',
    title: 'SystemVerilog Assertions (SVA) & Formal Basics',
    domain: 'Functional Verification & SVA',
    summary: 'Immediate vs concurrent assertions, sequences, overlapping |-> vs non-overlapping |=> implication, and protocol checks.',
    lessons: [
      'Immediate vs Concurrent Assertions & Sampled Value Functions ($past, $rose)',
      'Implication Operators (|-> vs |=>) & Repetition Operators ([*], [->], [=])',
      'Writing Protocol Assertions for Valid/Ready & FIFO Overflow/Underflow',
    ],
  },
  {
    id: 'm15_uvm_core',
    phaseDay: 75,
    dayRange: 'Days 71–75',
    title: 'UVM Architecture, Phases, Factory & Config DB',
    domain: 'UVM Architecture',
    summary: 'uvm_component vs uvm_object, UVM phasing, objections, factory overrides, uvm_config_db, and TLM analysis ports.',
    lessons: [
      'UVM Class Hierarchy: uvm_object vs uvm_component',
      'Build/Connect/Run Phases, Objections & Factory Type Overrides',
      'uvm_config_db Scoping, Sequences, Sequencer Handshake & TLM Ports',
    ],
    projectTitle: 'UVM Verification Environment for Dual-Port RAM',
    projectDescription: 'Built a reusable UVM agent, sequence library, functional coverage collector, and SVA monitor with factory overrides.',
  },

  // Phase 6: Days 76-90
  {
    id: 'm16_uvm_advanced',
    phaseDay: 90,
    dayRange: 'Days 76–80',
    title: 'Virtual Sequences, Scoreboards & Register Abstraction (RAL)',
    domain: 'UVM Architecture',
    summary: 'Coordinating multi-agent virtual sequences, out-of-order scoreboards, UVM RAL frontdoor/backdoor access, and predictors.',
    lessons: [
      'Virtual Sequencers & Multi-Interface Virtual Sequences',
      'Reference Models & In-Order vs Out-of-Order Scoreboards',
      'UVM RAL: Register Model, Adapters, Predictors & Built-in Sequences',
    ],
  },
  {
    id: 'm17_apb_fifo_verif',
    phaseDay: 90,
    dayRange: 'Days 81–85',
    title: 'AMBA APB Protocol & End-to-End FIFO Verification',
    domain: 'Protocols & FIFO Verification',
    summary: 'APB3/APB4 state machine (IDLE, SETUP, ACCESS), PSEL/PENABLE/PREADY/PSLVERR timing, and async/sync FIFO verification plans.',
    lessons: [
      'AMBA APB Protocol Timing, Wait States (PREADY) & Error Responses',
      'APB Slave UVM VIP Architecture & Protocol Checker Assertions',
      'FIFO Verification Plan: Corner Cases, Backpressure & Reset-on-the-Fly',
    ],
  },
  {
    id: 'm18_dv_interview_prep',
    phaseDay: 90,
    dayRange: 'Days 86–90',
    title: 'Root-Cause Waveform Debugging & DV Portfolio Defense',
    domain: 'Protocols & FIFO Verification',
    summary: 'Triaging simulation mismatches, race conditions, assertion failures, coverage holes, and defending RTL/DV architecture.',
    lessons: [
      'Systematic Root-Cause Debug: Seed Replay, Waveforms & Log Triage',
      'Verification Plan Signoff & Bug-Hunting Strategies',
      'Technical Portfolio Walkthrough & Trade-Off Justification',
    ],
    projectTitle: 'AMBA APB Memory-Mapped FIFO with Full UVM Signoff Suite',
    projectDescription: 'Designed an APB-accessible synchronous FIFO RTL and verified it with a UVM RAL + SVA + constrained-random testbench achieving 98% functional coverage.',
  },
];

export function getCheckpointForDay(day: number): CheckpointDefinition | undefined {
  return CHECKPOINTS.find((cp) => cp.day === day);
}

export function getNextCheckpoint(currentDay: number, completedCheckpoints: CheckpointDay[]): CheckpointDefinition {
  const next = CHECKPOINTS.find((cp) => !completedCheckpoints.includes(cp.day));
  return next ?? CHECKPOINTS[CHECKPOINTS.length - 1];
}
