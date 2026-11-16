import { CheckpointDay, InterviewMode, InterviewQuestion, InterviewRoundNumber } from '../types/interview';

export const QUESTION_BANK: InterviewQuestion[] = [
  // =========================================================================
  // CHECKPOINT 1 — DAY 15: Digital Electronics and Logic Design
  // =========================================================================
  {
    id: 'q15_r1_twos_comp',
    checkpointDay: 15,
    minDay: 15,
    domain: 'Digital Electronics',
    subtopic: 'Number Systems & Two’s Complement Overflow',
    round: 1,
    format: 'conceptual',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 1,
    prompt:
      'Why do hardware engineers overwhelmingly prefer two’s complement representation over sign-magnitude for signed arithmetic, and how do you detect signed overflow in an N-bit adder?',
    contextNotes: 'Look for single adder/subtractor hardware reuse, absence of -0, and MSB carry-in XOR carry-out (or sign bit mismatch) overflow detection.',
    expectedConcepts: [
      'Unique zero representation',
      'Same adder hardware for signed and unsigned',
      'Overflow equals Cin_msb XOR Cout_msb',
      'Sign mismatch when adding two numbers of same sign gives opposite sign',
    ],
    idealExplanation:
      'Two’s complement eliminates dual zero representations (+0 and -0) and allows the exact same binary adder hardware to perform both signed and unsigned addition. Signed overflow occurs only when two operands of the same sign produce a result with the opposite sign—equivalently, when the carry into the sign bit differs from the carry out of the sign bit (C_in_MSB ^ C_out_MSB).',
    curriculumModuleId: 'm1_number_gates',
    practiceQuiz: {
      question: 'In a 4-bit two’s complement adder, adding 4\'b0110 (+6) and 4\'b0100 (+4) yields 4\'b1010. What indicates signed overflow?',
      options: [
        'Carry-out of bit 3 is 1',
        'Carry-in to MSB (bit 3) is 1 while carry-out of MSB is 0',
        'The LSB of the sum is 0',
        'Both operands had different sign bits',
      ],
      correctIndex: 1,
      explanation: 'Carry-in to bit 3 is 1 and carry-out of bit 3 is 0, so Cin_MSB ^ Cout_MSB = 1, signaling signed overflow (+6 + +4 = -6 in 4-bit 2s comp).',
    },
  },
  {
    id: 'q15_r1_mux_universal',
    checkpointDay: 15,
    minDay: 15,
    domain: 'Digital Electronics',
    subtopic: 'Combinational Gates & Multiplexers',
    round: 1,
    format: 'conceptual',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 1,
    prompt:
      'Explain how a 2:1 multiplexer can act as a universal logic element. Specifically, how would you implement a 2-input XOR gate using only 2:1 multiplexers?',
    contextNotes: 'Candidate should connect select S = A, D0 = B, D1 = ~B (and show how ~B is built with another 2:1 MUX tied to 1 and 0).',
    expectedConcepts: [
      'Out = S ? D1 : D0',
      'Tie select to A, D0 to B, D1 to ~B',
      'Invert B using a second 2:1 MUX with S=B, D0=1, D1=0',
    ],
    idealExplanation:
      'A 2:1 MUX computes Y = (~S & D0) | (S & D1). Setting S = A, D0 = B, and D1 = ~B yields (~A & B) | (A & ~B) = A ^ B. To generate ~B with only 2:1 MUXes, tie a second MUX’s select to B with D0 = 1 and D1 = 0.',
    curriculumModuleId: 'm2_comb_circuits',
    practiceQuiz: {
      question: 'Which 2:1 MUX pin configuration implements Y = A AND B using only a single 2:1 MUX?',
      options: [
        'S = A, D0 = 0, D1 = B',
        'S = A, D0 = B, D1 = 1',
        'S = A, D0 = 1, D1 = B',
        'S = B, D0 = ~A, D1 = 0',
      ],
      correctIndex: 0,
      explanation: 'When S = A, D0 = 0, and D1 = B, Y = (~A & 0) | (A & B) = A & B.',
    },
  },
  {
    id: 'q15_r2_latch_vs_ff',
    checkpointDay: 15,
    minDay: 15,
    domain: 'Digital Electronics',
    subtopic: 'Latches vs Flip-Flops & Timing',
    round: 2,
    format: 'deep_dive',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Walk through the internal timing difference between a level-sensitive D latch and an edge-triggered D flip-flop. Why do synchronous ASIC designs avoid latches in datapaths unless intentionally using time borrowing?',
    contextNotes: 'Probe transparency window, glitch propagation, difficulty of Static Timing Analysis (STA), and master-slave edge capture.',
    expectedConcepts: [
      'Latch is transparent during active enable level',
      'Flip-flop samples only on clock edge (master-slave)',
      'Glitches on D pass through open latches',
      'STA becomes path-dependent with time borrowing in latches',
    ],
    idealExplanation:
      'A D latch is transparent whenever its enable/clock is active, allowing input glitches to propagate downstream and creating combinational loops if feedback exists. A D flip-flop uses a master-slave pair with inverted enables so data is sampled strictly at a clock edge. ASIC flows prefer flip-flops because Static Timing Analysis is cleanly bounded between clock edges without cycle-to-cycle time-borrowing complexity.',
    curriculumModuleId: 'm3_fsm_intro',
    practiceQuiz: {
      question: 'What happens if the D input of a positive-level D latch glitches while CLK is HIGH?',
      options: [
        'The glitch is ignored until the next rising edge',
        'The glitch propagates immediately to the Q output',
        'The latch enters metastability permanently',
        'Q holds its previous value until CLK falls',
      ],
      correctIndex: 1,
      explanation: 'Because a positive-level latch is transparent while CLK = 1, any D transition propagates directly to Q.',
    },
  },
  {
    id: 'q15_r2_cla_vs_rca',
    checkpointDay: 15,
    minDay: 15,
    domain: 'Digital Electronics',
    subtopic: 'Adders & Critical Path Delay',
    round: 2,
    format: 'deep_dive',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Compare a 16-bit Ripple-Carry Adder (RCA) with a Carry-Lookahead Adder (CLA). How do generate (G) and propagate (P) signals break the linear carry chain, and what is the hardware area trade-off?',
    contextNotes: 'Look for Gi = Ai & Bi, Pi = Ai ^ Bi, O(N) vs O(log N) carry delay, and fan-in / gate area explosion for wide CLAs.',
    expectedConcepts: [
      'G_i = A_i & B_i, P_i = A_i ^ B_i (or A_i | B_i)',
      'Carry computed in parallel: C_{i+1} = G_i | (P_i & C_i)',
      'RCA delay is O(N); CLA delay is O(log N) with hierarchical lookahead',
      'CLA requires larger area and high fan-in gates',
    ],
    idealExplanation:
      'In an RCA, carry ripples sequentially through all N stages, giving O(N) delay. A CLA precomputes generate G_i = A_i & B_i and propagate P_i = A_i ^ B_i so carries are expressed directly from C_0 in two-level logic (or hierarchical 4-bit blocks), reducing delay to O(log N) at the cost of extra gate area and routing/fan-in.',
    curriculumModuleId: 'm2_comb_circuits',
    practiceQuiz: {
      question: 'In a Carry-Lookahead Adder, what does Gi = 1 signify for bit position i?',
      options: [
        'Bit i passes the incoming carry unchanged',
        'Bit i produces a carry-out regardless of carry-in',
        'Bit i cancels any incoming carry',
        'Sum bit i is guaranteed to be 1',
      ],
      correctIndex: 1,
      explanation: 'G_i = A_i & B_i = 1 means both inputs are 1, generating a carry-out irrespective of C_i.',
    },
  },
  {
    id: 'q15_r3_kmap_design',
    checkpointDay: 15,
    minDay: 15,
    domain: 'Digital Electronics',
    subtopic: 'K-Map Minimization & Hazard-Free Logic',
    round: 3,
    format: 'coding',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'A 4-input combinational circuit outputs F = 1 when the 4-bit unsigned input A[3:0] is a prime number (2, 3, 5, 7, 11, 13) and treats inputs 14 and 15 as don’t-cares. Derive the minimal Sum-of-Products Boolean expression and write the combinational logic expression (you may express it in Boolean/gate syntax or basic Verilog assign).',
    contextNotes: 'Minterms: 2,3,5,7,11,13; Don’t cares: 14,15. Minimal SOP: ~A3&~A2&A1 | ~A3&A0&A2? Let’s verify: 2(0010),3(0011),5(0101),7(0111),11(1011),13(1101) + dc 14(1110),15(1111). Groups: ~A3&~A2&A1 (2,3), ~A3&A2&A0 (5,7), A2&A0 (5,7,13,15!), A1&A0&A3? (3,7,11,15 -> A1&A0!), A3&A2&A0 (13,15 -> covered by A2&A0), A3&A1&A0 (11,15 -> covered by A1&A0). Wait: check 11(1011) -> covered by A1&A0 (3,7,11,15)! Check 13(1101) -> covered by A2&A0 (5,7,13,15)! Check 2,3 -> ~A3&~A2&A1! Check 5,7 -> covered by A2&A0! Wait: minimal SOP = (~A3 & ~A2 & A1) | (A2 & A0) | (A1 & A0) = (~A3 & ~A2 & A1) | (A0 & (A2 | A1))! Check false positives: 14(1110): ~A3=0, A0=0 -> 0; 15(1111): dc -> 1; 9(1001): A2=0,A1=0 -> 0; 1(0001): A2=0,A1=0 -> 0; 0,4,6,8,10,12: A0=0 and (~A3&~A2&A1) only true for 2,3. Exact!',
    language: 'verilog',
    starterCode: `// Implement minimal SOP for F(A[3:0]) = sum_m(2,3,5,7,11,13) + d(14,15)
module prime_detector (
  input  wire [3:0] a,
  output wire       f
);
  // Write minimal Boolean assignment for f
  assign f = 1'b0;
endmodule`,
    expectedConcepts: [
      'Prime minterms 2, 3, 5, 7, 11, 13',
      'Using don’t-cares 14 and 15 to form larger quads (A2&A0 and A1&A0)',
      'Minimal expression: (~a[3] & ~a[2] & a[1]) | (a[2] & a[0]) | (a[1] & a[0])',
    ],
    idealExplanation:
      'Grouping minterms {5,7,13,15} gives A2·A0; grouping {3,7,11,15} gives A1·A0; and the remaining prime {2,3} forms A3\'·A2\'·A1. Minimal SOP is F = (~a[3] & ~a[2] & a[1]) | (a[2] & a[0]) | (a[1] & a[0]).',
    curriculumModuleId: 'm1_number_gates',
    practiceQuiz: {
      question: 'Why do don’t-care conditions (X) in a Karnaugh map reduce gate count?',
      options: [
        'They force every output to 0 during synthesis',
        'They can be treated as 1s to enlarge prime implicant groups or 0s otherwise',
        'They remove the need for clock inputs',
        'They automatically fix setup-time violations',
      ],
      correctIndex: 1,
      explanation: 'Don’t-care cells can optionally be included in K-map groupings to double group sizes and eliminate literals.',
    },
  },
  {
    id: 'q15_r3_comb_hazard',
    checkpointDay: 15,
    minDay: 15,
    domain: 'Digital Electronics',
    subtopic: 'Static Hazards & Glitch Elimination',
    round: 3,
    format: 'debugging',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Consider F = (A & B) | (~A & C). Suppose B = 1 and C = 1, and input A transitions from 1 to 0. Assuming the inverter on A has non-zero propagation delay, trace what happens at F and show how to eliminate this glitch using Boolean algebra.',
    contextNotes: 'Static-1 hazard: F drops 1 -> 0 -> 1 briefly when A goes 1->0. Consensus theorem adds redundant term (B & C).',
    expectedConcepts: [
      'Static-1 hazard occurs when A transitions 1->0 while B=C=1',
      'Inverter delay makes A&B fall before ~A&C rises',
      'Add consensus term (B & C) to cover adjacent K-map 1s',
    ],
    idealExplanation:
      'When A switches 1→0 with B=C=1, the (A & B) term turns off immediately while (~A & C) waits for the inverter delay to turn on, creating a brief 1→0→1 Static-1 hazard glitch. By the Consensus Theorem, adding the redundant prime implicant (B & C) keeps F = (A & B) | (~A & C) | (B & C) continuously HIGH across the transition.',
    curriculumModuleId: 'm2_comb_circuits',
    practiceQuiz: {
      question: 'Which redundant term eliminates the static-1 hazard in F = (A & B) | (~A & C)?',
      options: ['A & C', 'B & C', '~B & ~C', 'A | B'],
      correctIndex: 1,
      explanation: 'By the Consensus Theorem, B & C bridges the two adjacent K-map product terms.',
    },
  },
  {
    id: 'q15_r4_setup_hold_scenario',
    checkpointDay: 15,
    minDay: 15,
    domain: 'Digital Electronics',
    subtopic: 'Setup & Hold Timing Analysis',
    round: 4,
    format: 'scenario',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Two edge-triggered flip-flops FF1 and FF2 share a 500 MHz clock (period = 2.0 ns). FF1 has T_clk_to_q = 0.3 ns, combinational logic delay is 1.5 ns, FF2 has T_setup = 0.25 ns and T_hold = 0.15 ns, and clock skew to FF2 is +0.1 ns (clock arrives later at FF2). Does this path pass setup and hold timing? Show your math.',
    contextNotes: 'Setup check: T_clk_q + T_comb + T_setup <= T_period + T_skew => 0.3 + 1.5 + 0.25 = 2.05 ns vs 2.0 + 0.1 = 2.10 ns (Passes by +0.05 ns). Hold check: T_clk_q_min + T_comb_min >= T_hold + T_skew => 0.3 + 1.5 = 1.80 ns >= 0.15 + 0.1 = 0.25 ns (Passes easily).',
    expectedConcepts: [
      'Setup required <= T_period + T_skew',
      'Data arrival = 0.3 + 1.5 = 1.8 ns; required = 2.0 + 0.1 - 0.25 = 1.85 ns (+50 ps slack)',
      'Hold arrival = 1.8 ns >= T_hold + T_skew = 0.25 ns (+1.55 ns slack)',
    ],
    idealExplanation:
      'Setup check: Arrival = T_clk_q + T_comb = 0.3 + 1.5 = 1.80 ns. Required = T_period + T_skew - T_setup = 2.0 + 0.1 - 0.25 = 1.85 ns, yielding +0.05 ns (+50 ps) positive setup slack. Hold check: Arrival = 1.80 ns vs Required = T_hold + T_skew = 0.15 + 0.10 = 0.25 ns, yielding +1.55 ns hold slack. Both pass.',
    curriculumModuleId: 'm3_fsm_intro',
    practiceQuiz: {
      question: 'If a flip-flop path fails HOLD timing, which change fixes it?',
      options: [
        'Slowing down the clock frequency (increasing clock period)',
        'Inserting delay buffers into the combinational data path',
        'Reducing combinational logic delay',
        'Adding more logic gates to the clock capture path without fixing skew',
      ],
      correctIndex: 1,
      explanation: 'Hold violations are frequency-independent (same clock edge); adding data-path delay buffers increases arrival time above T_hold + skew.',
    },
  },
  {
    id: 'q15_r4_mealy_moore',
    checkpointDay: 15,
    minDay: 15,
    domain: 'Digital Electronics',
    subtopic: 'Mealy vs Moore FSM Trade-offs',
    round: 4,
    format: 'scenario',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'You are designing a synchronous bus protocol controller where an external noisy input triggers an acknowledge output. Would you choose a Mealy or Moore FSM, and what happens to state count and output latency in each?',
    contextNotes: 'Moore outputs depend only on state (glitch-free, 1-cycle latency, usually +1 state). Mealy outputs react combinational to input (faster, fewer states, but propagates input glitches unless registered).',
    expectedConcepts: [
      'Moore output depends only on current state',
      'Mealy output depends on state + current inputs',
      'Moore isolates output from input glitches; Mealy has 0-cycle input-to-output path',
      'Moore typically needs more states for sequence detection',
    ],
    idealExplanation:
      'For a noisy external input, a Moore FSM is safer because its outputs depend solely on registered state bits—preventing combinational input glitches from corrupting the acknowledge line, at the cost of one extra cycle of latency and typically one extra state. A Mealy FSM reacts within the same cycle with fewer states, but passes input glitches directly unless its outputs are registered.',
    curriculumModuleId: 'm3_fsm_intro',
    practiceQuiz: {
      question: 'Why does a Mealy FSM typically require fewer states than an equivalent Moore FSM?',
      options: [
        'Mealy machines do not use flip-flops',
        'Mealy outputs are associated with transitions rather than individual states',
        'Moore machines cannot accept external inputs',
        'Mealy clocks run at double frequency',
      ],
      correctIndex: 1,
      explanation: 'Because Mealy outputs can vary per input transition from the same state, distinct output behaviors don’t require splitting into separate states.',
    },
  },
  {
    id: 'q15_r5_alu_project',
    checkpointDay: 15,
    minDay: 15,
    domain: 'Digital Electronics',
    subtopic: '4-Bit ALU Architecture & Flags',
    round: 5,
    format: 'project_discussion',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'In your Day 15 project (4-Bit Structural ALU & Parity Checker), how did you implement subtraction alongside addition without duplicating full adder hardware, and how did you verify the Zero and Overflow status flags across edge cases?',
    contextNotes: 'Look for XORing B with sub_sel and feeding sub_sel into C_in, NOR-reduction for Zero flag, and Cin_msb ^ Cout_msb for Overflow.',
    expectedConcepts: [
      'A - B = A + (~B) + 1 using XOR gates controlled by subtract bit',
      'Zero flag via NOR reduction of sum bits (~|result)',
      'Overflow flag via carry-in XOR carry-out of MSB',
      'Corner cases: -8 - (+1), +7 + (+1), 0 - 0',
    ],
    idealExplanation:
      'By passing operand B through XOR gates controlled by an `op_sub` signal and feeding `op_sub` into the LSB carry-in, the same 4-bit adder computes A + B when `op_sub=0` and A + (~B) + 1 when `op_sub=1`. The Zero flag is a 4-input NOR of the result, while signed Overflow is Cin[3] ^ Cout[3], tested specifically at -8 (4\'b1000) and +7 (4\'b0111) wrap boundaries.',
    curriculumModuleId: 'm3_fsm_intro',
    practiceQuiz: {
      question: 'In a shared 4-bit adder/subtractor computing A - B, what value is fed to the LSB carry-in (C0)?',
      options: ['0', '1', 'A[3]', 'B[3] ^ A[3]'],
      correctIndex: 1,
      explanation: 'Two’s complement negation is ~B + 1, so inverting B and setting C0 = 1 computes A - B.',
    },
  },
  {
    id: 'q15_r5_gate_fanout',
    checkpointDay: 15,
    minDay: 15,
    domain: 'Digital Electronics',
    subtopic: 'Design Decisions & Gate Delay Trade-offs',
    round: 5,
    format: 'project_discussion',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'During combinational datapath design in Phase 1, if your parity tree or comparator exhibits excessive propagation delay due to high fan-out or deep logic levels, how do you restructure the gate topology to minimize critical path depth?',
    contextNotes: 'Balanced binary XOR tree (log2(N) depth) vs linear daisy chain (N depth), buffer insertion for high fan-out nets.',
    expectedConcepts: [
      'Replace linear gate chain with balanced binary tree (O(log N) depth)',
      'Insert buffer tree / clone drivers for high fan-out nodes',
      'Use NAND/NOR restructuring to reduce transistor stack height',
    ],
    idealExplanation:
      'Instead of cascading gates linearly (O(N) levels), restructuring the parity or reduction network into a balanced binary tree cuts logic depth to O(log2 N). For high fan-out signals like select lines, cloning drivers or inserting a balanced buffer tree caps capacitive load per stage.',
    curriculumModuleId: 'm1_number_gates',
    practiceQuiz: {
      question: 'What is the logic-level depth of an 8-bit parity generator built as a balanced binary XOR tree?',
      options: ['8 levels', '7 levels', '3 levels', '1 level'],
      correctIndex: 2,
      explanation: 'log2(8) = 3 stages of 2-input XOR gates.',
    },
  },

  // =========================================================================
  // CHECKPOINT 2 — DAY 30: Digital Electronics, Sequential Circuits & Verilog
  // =========================================================================
  {
    id: 'q30_r1_wire_vs_reg',
    checkpointDay: 30,
    minDay: 30,
    domain: 'Verilog & RTL',
    subtopic: 'Wire vs Reg Semantics',
    round: 1,
    format: 'conceptual',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 1,
    prompt:
      'In Verilog-2001, explain the exact difference between `wire` and `reg`. Does declaring a signal as `reg` guarantee that synthesis will infer a flip-flop?',
    contextNotes: 'Crucial classic interview trap: reg inside always @(*) synthesizes to pure combinational logic, NOT a flip-flop.',
    expectedConcepts: [
      'wire is driven continuously (assign or module port output)',
      'reg holds value between procedural assignments inside always/initial',
      'reg does NOT imply flip-flop; always @(*) with reg synthesizes combinational logic',
    ],
    idealExplanation:
      'In Verilog, `wire` represents a physical net driven continuously by `assign` statements or submodule outputs, whereas `reg` is a procedural variable assigned inside `always` or `initial` blocks. Declaring `reg` does NOT automatically synthesize a flip-flop: a `reg` assigned in a fully specified `always @(*)` block synthesizes into pure combinational gates.',
    curriculumModuleId: 'm5_verilog_basics',
    practiceQuiz: {
      question: 'What hardware is synthesized from `reg y; always @(*) y = a & b;`?',
      options: [
        'A D flip-flop',
        'A D latch',
        'A 2-input combinational AND gate',
        'A tri-state buffer',
      ],
      correctIndex: 2,
      explanation: 'Even though y is declared as reg for procedural assignment, the sensitivity list @(*) with complete assignment synthesizes to combinational logic.',
    },
  },
  {
    id: 'q30_r1_sync_vs_ripple',
    checkpointDay: 30,
    minDay: 30,
    domain: 'Sequential Circuits',
    subtopic: 'Synchronous vs Asynchronous Counters',
    round: 1,
    format: 'conceptual',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 1,
    prompt:
      'Contrast a 4-bit ripple (asynchronous) counter with a 4-bit synchronous counter. Why do ripple counters suffer from decoding glitches and lower maximum clock frequency?',
    contextNotes: 'In ripple counters, Q of stage i clocks stage i+1, accumulating N * T_clk_q delay and producing transient invalid states during ripple.',
    expectedConcepts: [
      'Ripple counter chains flip-flop outputs as clocks; synchronous shares one global clock',
      'Ripple delay accumulates N * T_clk_q',
      'Transient intermediate states cause combinational decoding glitches',
      'Ripple clocks complicate STA and clock tree synthesis',
    ],
    idealExplanation:
      'In a ripple counter, each flip-flop is clocked by the previous stage’s output, so transitions ripple sequentially (N × T_clk_q total delay) and create transient intermediate codes (e.g., 0111→0110→0100→1000) that glitch downstream decoders. A synchronous counter clocks all flip-flops simultaneously, limiting delay to one flip-flop plus combinational next-state logic.',
    curriculumModuleId: 'm4_sequential_counters',
    practiceQuiz: {
      question: 'If each flip-flop has T_clk_to_q = 2 ns, what is the worst-case output settling delay of an 8-bit ripple counter?',
      options: ['2 ns', '4 ns', '16 ns', '64 ns'],
      correctIndex: 2,
      explanation: 'All 8 stages can ripple sequentially, totaling 8 × 2 ns = 16 ns.',
    },
  },
  {
    id: 'q30_r2_blocking_nonblocking',
    checkpointDay: 30,
    minDay: 30,
    domain: 'Verilog & RTL',
    subtopic: 'Blocking (=) vs Non-Blocking (<=) Assignments',
    round: 2,
    format: 'deep_dive',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Explain how the Verilog stratified event queue executes blocking (`=`) versus non-blocking (`<=`) assignments. What happens in simulation and synthesis if two sequential `always @(posedge clk)` blocks communicate using blocking assignments?',
    contextNotes: 'Active region vs NBA region. Blocking inside sequential creates race condition in simulation (depends on block execution order) and broken shift-register chains.',
    expectedConcepts: [
      'Blocking (=) evaluates and updates immediately in Active region',
      'Non-blocking (<=) evaluates RHS in Active region and schedules LHS update in NBA region',
      'Using (=) between posedge blocks causes simulation race conditions',
      'Using (=) in a shift register collapses stages into a single flip-flop',
    ],
    idealExplanation:
      'Blocking assignments (`=`) evaluate and update LHS immediately within the Active event region, whereas non-blocking (`<=`) reads all RHS values in the Active region and defers LHS updates to the Non-Blocking Assignment (NBA) region. Using `=` across multiple `always @(posedge clk)` blocks creates non-deterministic simulation race conditions depending on block scheduling order, and chaining `=` inside one block collapses shift stages into wires.',
    curriculumModuleId: 'm6_blocking_nonblocking',
    practiceQuiz: {
      question: 'In `always @(posedge clk) begin b = a; c = b; end`, what hardware does synthesis produce?',
      options: [
        'A 2-stage shift register (a -> b -> c)',
        'One flip-flop where both b and c mirror a after one clock',
        'A combinational latch',
        'A syntax error',
      ],
      correctIndex: 1,
      explanation: 'Because `b = a` updates immediately before `c = b`, `c` takes the new value of `a` on the same edge, collapsing the shift register.',
    },
  },
  {
    id: 'q30_r2_output_predict',
    checkpointDay: 30,
    minDay: 30,
    domain: 'Verilog & RTL',
    subtopic: 'Event Queue & Output Prediction',
    round: 2,
    format: 'output_prediction',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Predict the exact final values of `x`, `y`, and `z` after one rising clock edge if initially `x = 1`, `y = 2`, `z = 3`, inside:\n```verilog\nalways @(posedge clk) begin\n  x <= y;\n  y = x + z;\n  z <= y;\nend\n```\nExplain step-by-step why mixing `=` and `<=` here causes this behavior.',
    contextNotes: 'At posedge: 1) x<=y schedules x<=2 (x is still 1!). 2) y = x + z uses current x(1) + z(3) = 4, updates y=4 immediately. 3) z<=y reads updated y(4), schedules z<=4. Final: x=2, y=4, z=4.',
    expectedConcepts: [
      'x becomes 2 (NBA scheduled from initial y=2)',
      'y becomes 4 immediately (uses old x=1 plus old z=3)',
      'z becomes 4 (NBA reads newly updated y=4)',
      'Mixing = and <= in the same sequential block is dangerous anti-pattern',
    ],
    idealExplanation:
      'Line 1 schedules `x <= 2` in the NBA region while `x` remains `1` in the Active region. Line 2 executes immediately: `y = 1 + 3 = 4`. Line 3 reads the updated `y` (`4`) and schedules `z <= 4`. After the NBA region drains: `x = 2, y = 4, z = 4`. Never mix blocking and non-blocking assignments on sequential state.',
    curriculumModuleId: 'm6_blocking_nonblocking',
    practiceQuiz: {
      question: 'Which Verilog region executes `<=` left-hand-side updates?',
      options: ['Active region', 'Inactive region (#0)', 'Non-Blocking Assignment (NBA) region', 'Postponed ($monitor) region'],
      correctIndex: 2,
      explanation: 'RHS is evaluated in Active, and LHS updates occur in the NBA region.',
    },
  },
  {
    id: 'q30_r3_seq_detector_code',
    checkpointDay: 30,
    minDay: 30,
    domain: 'Sequential Circuits',
    subtopic: 'Overlapping Sequence Detector FSM in Verilog',
    round: 3,
    format: 'coding',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Write a synthesizable Verilog module for a Mealy FSM that detects the overlapping serial sequence `"1011"` on input `din` (MSB first, synchronous active-high reset `rst`). Use a clean 2-always-block style (sequential state register + combinational next-state/output logic) with no latches.',
    contextNotes: 'States S0 (idle), S1 ("1"), S2 ("10"), S3 ("101"). In S3, if din==1 -> detected=1 and next_state=S1 (overlapping "1"!). Check <= in sequential, = in comb, default case.',
    language: 'verilog',
    starterCode: `module seq_det_1011 (
  input  wire clk,
  input  wire rst,
  input  wire din,
  output reg  detected
);
  localparam [1:0] S0 = 2'b00,
                   S1 = 2'b01,
                   S2 = 2'b10,
                   S3 = 2'b11;

  reg [1:0] state, next_state;

  // TODO: Implement sequential state register and combinational next_state + detected logic

endmodule`,
    expectedConcepts: [
      'Sequential always @(posedge clk) with <= and reset to S0',
      'Combinational always @(*) with default assignments (=) to prevent latches',
      'Overlapping transition from S3 on din=1 goes to S1 (not S0) and asserts detected=1',
      'Transition from S2 on din=0 goes to S0; from S1 on din=1 stays in S1',
    ],
    idealExplanation:
      'A latch-free 2-always Mealy FSM assigns `next_state = state; detected = 1\'b0;` at the top of `always @(*)`. From `S3` ("101"), receiving `din=1` asserts `detected = 1\'b1` and transitions to `S1` (reusing the trailing `1` for overlapping detection).',
    curriculumModuleId: 'm4_sequential_counters',
    practiceQuiz: {
      question: 'In an overlapping "1011" detector, after detecting "1011", what state should the FSM transition to?',
      options: ['S0 (idle)', 'S1 (seen "1")', 'S2 (seen "10")', 'S3 (seen "101")'],
      correctIndex: 1,
      explanation: 'The final `1` of "1011" serves as the first `1` of a potential new "1011" sequence, so the FSM transitions to S1.',
    },
  },
  {
    id: 'q30_r3_buggy_shift_reg',
    checkpointDay: 30,
    minDay: 30,
    domain: 'Verilog & RTL',
    subtopic: 'Debugging Broken Verilog Shift Register',
    round: 3,
    format: 'debugging',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Review and fix the bugs in this 4-bit serial-in parallel-out shift register. Identify every simulation and synthesis bug present in the starter code.',
    contextNotes: 'Bugs: 1) Blocking (=) in sequential causes all bits to take din in 1 cycle! 2) Missing async/sync reset initialization leaves q unknown. 3) Output q is wired incorrectly or reset polarity mismatch.',
    language: 'verilog',
    starterCode: `module sipo_shift_buggy (
  input  wire       clk,
  input  wire       rst_n,
  input  wire       din,
  output reg  [3:0] q
);
  always @(posedge clk) begin
    if (!rst_n)
      q = 4'b0000;
    else begin
      q[0] = din;
      q[1] = q[0];
      q[2] = q[1];
      q[3] = q[2];
    end
  end
endmodule`,
    expectedConcepts: [
      'Blocking (=) overwrites q[0] before q[1] reads it, collapsing all 4 FFs into 1 stage',
      'Replace = with non-blocking <= for all sequential assignments',
      'Can concisely write q <= {q[2:0], din}',
    ],
    idealExplanation:
      'Because `=` executes sequentially, `q[0] = din` updates `q[0]` immediately, so `q[1]`, `q[2]`, and `q[3]` all receive `din` on the first clock cycle—synthesizing four parallel copies of one flip-flop instead of a 4-stage shift register. Changing all assignments to non-blocking `<=` (or `q <= {q[2:0], din};`) fixes both simulation and synthesis.',
    curriculumModuleId: 'm6_blocking_nonblocking',
    practiceQuiz: {
      question: 'In `sipo_shift_buggy`, if `q=0000` and `din=1`, what is `q` after 1 rising clock edge?',
      options: ['4\'b0001', '4\'b1000', '4\'b1111', '4\'b0000'],
      correctIndex: 2,
      explanation: 'Blocking assignments propagate `din=1` straight through `q[0]->q[1]->q[2]->q[3]` in the same clock edge.',
    },
  },
  {
    id: 'q30_r4_tb_race',
    checkpointDay: 30,
    minDay: 30,
    domain: 'Verilog & RTL',
    subtopic: 'Testbench Stimulus Race Conditions',
    round: 4,
    format: 'scenario',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Your Verilog testbench drives `din = 1` inside `always @(posedge clk)` while the DUT also samples `din` on `always @(posedge clk)`. Half of the simulation runs pass and half fail by 1 cycle. Explain why this happens and how to make the testbench deterministic.',
    contextNotes: 'Zero-delay race between TB and DUT at posedge clk. Drive stimulus on @(negedge clk) or use non-blocking <= in TB.',
    expectedConcepts: [
      'Both TB and DUT trigger at posedge clk in the Active region',
      'Simulator block scheduling order is non-deterministic',
      'Fix by driving inputs on negedge clk or with non-blocking assignments (<=)',
    ],
    idealExplanation:
      'Both the testbench driver and DUT flip-flop wake up in the Active event region on `posedge clk`, making execution order arbitrary across simulators or code edits. Driving testbench stimulus on `negedge clk` (or scheduling stimulus updates with `<=` in NBA) guarantees the DUT samples stable pre-edge values cleanly.',
    curriculumModuleId: 'm6_blocking_nonblocking',
    practiceQuiz: {
      question: 'Why does driving DUT inputs on `negedge clk` in a Verilog testbench eliminate posedge sampling races?',
      options: [
        'It doubles the clock frequency',
        'Inputs transition halfway through the period, stable well before the next posedge',
        'It converts reg signals to wires automatically',
        'It disables setup and hold checks in synthesis',
      ],
      correctIndex: 1,
      explanation: 'Driving on negedge ensures signals settle cleanly half a cycle before the DUT samples them on posedge.',
    },
  },
  {
    id: 'q30_r5_traffic_fsm',
    checkpointDay: 30,
    minDay: 30,
    domain: 'Sequential Circuits',
    subtopic: 'Traffic Light Controller FSM Architecture',
    round: 5,
    format: 'project_discussion',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Walk through your Day 30 Traffic Light Controller FSM project. How did you decouple the timer/counter from the FSM state transitions, how did you code the reset behavior, and how did your self-checking testbench confirm every state transition?',
    contextNotes: 'Look for clean state encoding, counter tick enable separating timing from control, default case handling, and automated scoreboard/assert checks in TB.',
    expectedConcepts: [
      'Separate timer counter from FSM state register',
      'Explicit state encoding (binary/one-hot) and default recovery state',
      'Self-checking testbench checking output values per state rather than visual waveform inspection only',
    ],
    idealExplanation:
      'Separating a reloadable down-counter from the Moore control FSM keeps state count small regardless of phase duration. A `default` case safely returns any illegal/SEU state to ALL_RED, and the self-checking testbench verifies expected light outputs and pedestrian interrupt latency automatically on each cycle.',
    curriculumModuleId: 'm6_blocking_nonblocking',
    practiceQuiz: {
      question: 'Why should an FSM include a `default` branch even when all binary encodings appear used?',
      options: [
        'To reduce clock power by 50%',
        'To prevent latch inference and guarantee recovery from unused/X states',
        'Verilog requires default in every always block',
        'To make the FSM run asynchronously',
      ],
      correctIndex: 1,
      explanation: 'A `default` branch prevents latches in combinational logic and ensures recovery from uninitialized or corrupted states.',
    },
  },

  // =========================================================================
  // CHECKPOINT 3 — DAY 45: Verilog, RTL Design, Simulation & Synthesis
  // =========================================================================
  {
    id: 'q45_r1_latch_inference',
    checkpointDay: 45,
    minDay: 45,
    domain: 'Synthesis & Timing',
    subtopic: 'Latch Inference & Synthesis Traps',
    round: 1,
    format: 'conceptual',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 1,
    prompt:
      'What exact RTL coding mistakes cause unintended latch inference during synthesis, and why are unintended latches flagged as critical lint errors in ASIC tape-out flows?',
    contextNotes: 'Incomplete if-else or missing default in case inside combinational always @(*). Causes STA complexity, DFT scan-chain breaks, and glitch vulnerability.',
    expectedConcepts: [
      'Missing else branch or incomplete case without default in combinational block',
      'Signal retains previous value on uncovered paths -> synthesis infers latch',
      'Breaks DFT scan insertion and complicates STA/timing closure',
    ],
    idealExplanation:
      'Unintended latches occur when a combinational `always @(*)` block fails to assign a variable across every execution branch (missing `else` or missing `default` in `case`), forcing synthesis to preserve the prior value via a level-sensitive latch. ASIC flows ban accidental latches because they break DFT scan chains, pass glitches when transparent, and complicate STA.',
    curriculumModuleId: 'm7_rtl_synthesis',
    practiceQuiz: {
      question: 'Which practice eliminates unintended latch inference in a complex combinational `always @(*)` block?',
      options: [
        'Changing `always @(*)` to `always @(posedge clk)`',
        'Assigning safe default values to all outputs at the very top of the block',
        'Declaring all signals as `wire`',
        'Adding `#1` propagation delays',
      ],
      correctIndex: 1,
      explanation: 'Initializing every combinational LHS output at the start of `always @(*)` guarantees no path leaves a signal unassigned.',
    },
  },
  {
    id: 'q45_r1_reset_strategies',
    checkpointDay: 45,
    minDay: 45,
    domain: 'Synthesis & Timing',
    subtopic: 'Synchronous vs Asynchronous Reset & Reset Synchronizer',
    round: 1,
    format: 'conceptual',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Compare synchronous reset and asynchronous reset in ASIC RTL design. What is a reset recovery/removal violation, and how does an async-assert, sync-deassert reset synchronizer solve it?',
    contextNotes: 'Async reset works without clock but deassertion near clock edge causes metastability (recovery/removal). Two-flop reset bridge asserts async and deasserts synchronously.',
    expectedConcepts: [
      'Sync reset requires active clock; cleaner timing & smaller FF cell',
      'Async reset works even when clock is gated/stopped',
      'Async deassertion near posedge clk violates recovery/removal timing -> metastability',
      'Reset synchronizer (2-FF bridge with D tied to 1) asserts async, deasserts sync',
    ],
    idealExplanation:
      'Synchronous resets integrate into the D-input cone and avoid reset-tree recovery checks, but fail if the clock is stopped. Asynchronous resets clear flip-flops immediately without a clock, yet if deasserted close to a clock edge they violate recovery/removal timing and cause metastability. A 2-FF reset synchronizer (async clear, D tied to `1\'b1`) asserts reset asynchronously and releases it synchronously to `clk`.',
    curriculumModuleId: 'm7_rtl_synthesis',
    practiceQuiz: {
      question: 'Why does a 2-flop reset synchronizer tie its first flip-flop data input `D` to `1\'b1` (for active-low `rst_n`)?',
      options: [
        'To hold the design permanently in reset',
        'So reset assertion happens asynchronously while release (`0 -> 1`) propagates cleanly across two clock edges',
        'To invert the clock polarity',
        'To reduce dynamic power to zero',
      ],
      correctIndex: 1,
      explanation: 'Async clear immediately forces the output low (`0`), and once external `rst_n` releases, `1\'b1` shifts cleanly through two flip-flops synchronized to `clk`.',
    },
  },
  {
    id: 'q45_r2_cdc_gray',
    checkpointDay: 45,
    minDay: 45,
    domain: 'Synthesis & Timing',
    subtopic: 'Clock Domain Crossing (CDC) & Gray Codes',
    round: 2,
    format: 'deep_dive',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Why is placing a 2-flip-flop synchronizer on each bit of a 4-bit binary counter crossing between asynchronous clock domains unsafe? Explain how Gray coding resolves this and identify one rule for the source domain before crossing.',
    contextNotes: 'Binary multi-bit transitions (0111 -> 1000) suffer independent skew/metastability across bits, yielding bogus sampled values (e.g., 1111 or 0000). Gray code changes only 1 bit per step, and must be registered in source domain before crossing (no combinational glitches!).',
    expectedConcepts: [
      'Multi-bit binary transitions have different wire delays/metastability outcomes -> incoherent values',
      'Gray code changes strictly 1 bit per increment (adjacent errors differ by at most 1 count)',
      'Must register Gray-coded signals in source clock domain before crossing (no combinational logic on CDC path)',
    ],
    idealExplanation:
      'When a binary counter transitions (e.g., 0111→1000), skew and independent metastability resolution across 4 synchronizers can capture bogus intermediate codes like 0000 or 1111. Gray coding guarantees only 1 bit changes per step, so even if that bit misses a cycle, the destination captures either the old or new valid count. Crucially, the Gray value must come directly from flip-flops in the source domain with zero combinational logic before the synchronizer.',
    curriculumModuleId: 'm8_cdc_timing',
    practiceQuiz: {
      question: 'Why must a Gray-coded pointer be registered in the launch clock domain before entering a 2-FF CDC synchronizer?',
      options: [
        'To double the FIFO capacity',
        'To prevent combinational glitches in the launch domain from violating single-bit change guarantees',
        'Because Verilog does not allow Gray XOR gates',
        'To eliminate the need for a destination clock',
      ],
      correctIndex: 1,
      explanation: 'Combinational binary-to-Gray logic can glitch on multiple bits simultaneously; registering it ensures glitch-free single-bit transitions.',
    },
  },
  {
    id: 'q45_r2_sync_fifo_wrap',
    checkpointDay: 45,
    minDay: 45,
    domain: 'Verilog & RTL',
    subtopic: 'Synchronous FIFO Full/Empty Pointer Logic',
    round: 2,
    format: 'deep_dive',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'In a synchronous FIFO of depth 16 (2^4), both `wr_ptr` and `rd_ptr` equal 0 when empty AND when full if using 4-bit pointers. Explain the extra-MSB (5-bit pointer) technique to disambiguate `full` vs `empty`, including simultaneous read+write behavior.',
    contextNotes: '5-bit pointers [4:0]: lower 4 bits [3:0] address memory. Empty when wr_ptr == rd_ptr (all 5 bits). Full when MSB differs and lower bits match: (wr_ptr[4] != rd_ptr[4]) && (wr_ptr[3:0] == rd_ptr[3:0]).',
    expectedConcepts: [
      'Use (ADDR_WIDTH + 1)-bit pointers with extra wrap MSB',
      'Empty: wr_ptr == rd_ptr (all bits identical)',
      'Full: wr_ptr[MSB] != rd_ptr[MSB] && wr_ptr[ADDR-1:0] == rd_ptr[ADDR-1:0]',
      'Address memory using only lower bits [ADDR-1:0]',
    ],
    idealExplanation:
      'By extending `wr_ptr` and `rd_ptr` to `ADDR_WIDTH + 1` bits (5 bits for depth 16), the lower 4 bits address the SRAM while the MSB tracks wrap-around parity. `empty` is `wr_ptr == rd_ptr` (same wrap phase and address), whereas `full` is `(wr_ptr[4] != rd_ptr[4]) && (wr_ptr[3:0] == rd_ptr[3:0])` (writer wrapped one full lap ahead).',
    curriculumModuleId: 'm9_rtl_fifo',
    practiceQuiz: {
      question: 'For an 8-entry synchronous FIFO using 4-bit pointers `wr_ptr[3:0]` and `rd_ptr[3:0]`, when is the FIFO `full`?',
      options: [
        'wr_ptr == rd_ptr',
        'wr_ptr == 4\'b1111',
        '(wr_ptr[3] != rd_ptr[3]) && (wr_ptr[2:0] == rd_ptr[2:0])',
        'wr_ptr[2:0] == rd_ptr[2:0]',
      ],
      correctIndex: 2,
      explanation: 'Inverted wrap MSB with matching 3-bit address means the write pointer is exactly 8 entries ahead.',
    },
  },
  {
    id: 'q45_r3_sync_fifo_rtl',
    checkpointDay: 45,
    minDay: 45,
    domain: 'Verilog & RTL',
    subtopic: 'Writing Parameterized Synchronous FIFO RTL',
    round: 3,
    format: 'coding',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 3,
    prompt:
      'Complete the parameterized Synchronous FIFO module in Verilog. Handle `wr_en && !full`, `rd_en && !empty`, simultaneous read & write safely, and compute `full` and `empty` cleanly using extra-MSB pointers.',
    contextNotes: 'Check non-blocking <= in always @(posedge clk), safe pointer increment only when (wr_en && !full) / (rd_en && !empty), synchronous reset, and exact full/empty combinational expressions.',
    language: 'verilog',
    starterCode: `module sync_fifo #(
  parameter WIDTH = 8,
  parameter DEPTH = 16,
  parameter ADDR_W = $clog2(DEPTH)
) (
  input  wire             clk,
  input  wire             rst,
  input  wire             wr_en,
  input  wire [WIDTH-1:0] wr_data,
  input  wire             rd_en,
  output reg  [WIDTH-1:0] rd_data,
  output wire             full,
  output wire             empty
);
  reg [WIDTH-1:0] mem [0:DEPTH-1];
  reg [ADDR_W:0]  wr_ptr, rd_ptr;

  // TODO: Implement full/empty flags and clocked write/read logic

endmodule`,
    expectedConcepts: [
      'empty = (wr_ptr == rd_ptr)',
      'full = (wr_ptr[ADDR_W] != rd_ptr[ADDR_W]) && (wr_ptr[ADDR_W-1:0] == rd_ptr[ADDR_W-1:0])',
      'Guard writes with (wr_en && !full) and reads with (rd_en && !empty)',
      'Use non-blocking <= inside always @(posedge clk)',
    ],
    idealExplanation:
      '`assign empty = (wr_ptr == rd_ptr);` and `assign full = (wr_ptr[ADDR_W] != rd_ptr[ADDR_W]) && (wr_ptr[ADDR_W-1:0] == rd_ptr[ADDR_W-1:0]);`. Inside `always @(posedge clk)`, on `rst` clear `wr_ptr`, `rd_ptr`, and `rd_data` to 0; otherwise write `mem[wr_ptr[ADDR_W-1:0]] <= wr_data; wr_ptr <= wr_ptr + 1\'b1;` when `wr_en && !full`, and read `rd_data <= mem[rd_ptr[ADDR_W-1:0]]; rd_ptr <= rd_ptr + 1\'b1;` when `rd_en && !empty`.',
    curriculumModuleId: 'm9_rtl_fifo',
    practiceQuiz: {
      question: 'In a synchronous FIFO with `full == 1`, what happens if `wr_en` and `rd_en` are both asserted in standard non-bypass pointer logic?',
      options: [
        'Write still occurs and overwrites unread data',
        'If guarded by `!full`, write is blocked while read drains one entry so full drops next cycle',
        'Both pointers reset to zero',
        'Empty becomes 1 immediately',
      ],
      correctIndex: 1,
      explanation: 'Standard `!full` guarding prevents overflow on `wr_en` while `rd_en && !empty` pops an entry cleanly.',
    },
  },
  {
    id: 'q45_r3_buggy_fsm_latch',
    checkpointDay: 45,
    minDay: 45,
    domain: 'Synthesis & Timing',
    subtopic: 'Debugging Latch & Synthesis Bugs in RTL',
    round: 3,
    format: 'debugging',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Identify and fix ALL synthesis and simulation defects in this Verilog arbiter module (unintended latches, blocking/non-blocking misuse, incomplete sensitivity, or non-synthesizable constructs).',
    contextNotes: 'Bugs: 1) `always @(req)` missing `state` in sensitivity list -> use `always @(*)`. 2) `grant` unassigned in some branches -> latch inference. 3) `<=` used inside combinational block. 4) `#1` delay in RTL.',
    language: 'verilog',
    starterCode: `module arbiter_buggy (
  input  wire       clk,
  input  wire       rst,
  input  wire [1:0] req,
  output reg  [1:0] grant
);
  reg state;

  always @(posedge clk) begin
    if (rst) state <= 1'b0;
    else     state <= ~state;
  end

  always @(req) begin
    if (state == 1'b0) begin
      if (req[0]) grant <= #1 2'b01;
    end else begin
      if (req[1]) grant <= 2'b10;
      else        grant <= 2'b00;
    end
  end
endmodule`,
    expectedConcepts: [
      'Incomplete sensitivity list always @(req) misses state -> use always @(*)',
      'Missing else when state==0 and !req[0] infers a latch on grant',
      'Use blocking = (not <=) inside combinational always @(*) blocks',
      'Remove #1 delay from synthesizable RTL',
    ],
    idealExplanation:
      'Four defects exist: (1) `always @(req)` omits `state`, causing pre-synthesis/post-synthesis mismatch—change to `always @(*)`. (2) When `state == 0` and `!req[0]`, `grant` is unassigned, inferring an unwanted latch—initialize `grant = 2\'b00;` at the top. (3) Non-blocking `<=` should be blocking `=` in combinational logic. (4) `#1` is non-synthesizable.',
    curriculumModuleId: 'm7_rtl_synthesis',
    practiceQuiz: {
      question: 'Why does omitting a signal from a combinational `always` sensitivity list cause RTL vs gate-level mismatch?',
      options: [
        'Synthesis ignores the sensitivity list and builds full combinational logic, while RTL simulation fails to re-evaluate when the omitted signal changes',
        'Synthesis deletes the omitted signal',
        'Gate-level netlists run without clocks',
        'Verilog treats omitted signals as constants',
      ],
      correctIndex: 0,
      explanation: 'Synthesis infers logic from equations, ignoring incomplete sensitivity lists, whereas RTL simulation only triggers on listed signals.',
    },
  },
  {
    id: 'q45_r4_timing_fix',
    checkpointDay: 45,
    minDay: 45,
    domain: 'Synthesis & Timing',
    subtopic: 'Fixing Setup Violations in Synthesis',
    round: 4,
    format: 'scenario',
    modes: ['Technical', 'Industry'],
    difficulty: 3,
    prompt:
      'Post-synthesis Static Timing Analysis reports a -0.45 ns setup violation on a 32-bit multiply-accumulate (MAC) path running at 400 MHz. You cannot lower the clock frequency. Describe three RTL/architectural techniques to close setup timing and explain any latency trade-offs.',
    contextNotes: 'Pipelining (registers between multiply and add), retiming / register balancing, carry-save adders or operator strength reduction / operand isolation.',
    expectedConcepts: [
      'Pipelining: split multiplier and accumulator across pipeline stages (adds 1+ cycles latency)',
      'Register retiming: redistribute combinational logic evenly across existing flip-flops',
      'Carry-save / Wallace tree arithmetic or parallel prefix adders',
    ],
    idealExplanation:
      'Without lowering frequency, we can: (1) Pipeline the MAC by placing registers between the 32-bit multiplier and accumulator (cutting critical path in half at the cost of +1 cycle latency); (2) Apply register retiming to rebalance logic across existing stage boundaries; (3) Replace ripple-carry structures with carry-save or parallel-prefix adders.',
    curriculumModuleId: 'm8_cdc_timing',
    practiceQuiz: {
      question: 'Which technique improves maximum clock frequency (Fmax) at the cost of increased cycle latency?',
      options: ['Adding buffers to the data path', 'Pipelining the combinational stage', 'Using a ripple counter', 'Removing reset logic'],
      correctIndex: 1,
      explanation: 'Pipelining inserts registers inside long combinational paths, shortening stage delay while adding pipeline latency.',
    },
  },
  {
    id: 'q45_r5_fifo_project',
    checkpointDay: 45,
    minDay: 45,
    domain: 'Verilog & RTL',
    subtopic: 'Synchronous FIFO Design & X-Propagation Debug',
    round: 5,
    format: 'project_discussion',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Discuss your Day 45 Parameterized Synchronous FIFO project. Why did you constrain `DEPTH` to powers of two (or how would non-power-of-two depth affect pointer wrap), and how did you debug any initial `X` values on `rd_data`?',
    contextNotes: 'Power-of-2 depth lets binary pointers wrap naturally at 2^N without modulo comparators. Initial X on rd_data occurs if reading before write or uninitialized memory/reset.',
    expectedConcepts: [
      'Power-of-2 depth allows natural binary counter wrap-around for MSB comparison',
      'Non-power-of-2 requires explicit wrap comparator (if ptr == DEPTH-1)',
      'X on rd_data stems from reading empty/unwritten mem or missing rd_data reset',
    ],
    idealExplanation:
      'With power-of-two `DEPTH`, `(ADDR_W+1)`-bit binary pointers wrap naturally on increment without costly modulo comparators. Reading `mem` on reset or when empty exposes uninitialized `X` unless `rd_data` is cleared on reset and reads are gated with `rd_en && !empty`.',
    curriculumModuleId: 'm9_rtl_fifo',
    practiceQuiz: {
      question: 'What happens to extra-MSB full/empty logic if FIFO `DEPTH` is 10 (not a power of 2) and pointers simply do `ptr <= ptr + 1`?',
      options: [
        'It still works identically',
        'Lower address bits exceed 9 (10..15), corrupting wrap symmetry unless wrapped explicitly at DEPTH-1',
        'Verilog refuses to compile',
        'Empty becomes permanently 0',
      ],
      correctIndex: 1,
      explanation: 'Non-power-of-2 depths cannot rely on natural binary overflow and require explicit wrap logic at `DEPTH - 1`.',
    },
  },

  // =========================================================================
  // CHECKPOINT 4 — DAY 60: SystemVerilog, OOP & Testbench Development
  // =========================================================================
  {
    id: 'q60_r1_logic_vs_bit',
    checkpointDay: 60,
    minDay: 60,
    domain: 'SystemVerilog & OOP',
    subtopic: 'SystemVerilog 4-State vs 2-State Data Types',
    round: 1,
    format: 'conceptual',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 1,
    prompt:
      'Explain the difference between `logic` (4-state) and `bit` / `int` (2-state) in SystemVerilog. Why is using `bit` on a DUT interface signal dangerous in verification?',
    contextNotes: '4-state values: 0, 1, X, Z. 2-state values: 0, 1 (X/Z silently convert to 0!). Using bit hides X-propagation and reset bugs on DUT signals.',
    expectedConcepts: [
      'logic supports 0, 1, X, Z and can be driven by continuous assign or one procedural block',
      'bit/int support only 0 and 1 (default initialize to 0)',
      'Connecting 2-state bit to DUT ports silently converts X/Z to 0, masking reset/uninitialized bugs',
    ],
    idealExplanation:
      '`logic` is a 4-state (`0, 1, X, Z`) type that replaces both `reg` and single-driver `wire` in RTL and interfaces. `bit` and `int` are 2-state (`0, 1`) types ideal for loop counters and scoreboard math—never for DUT pins, because 2-state types silently convert `X` and `Z` from the DUT into `0`, hiding reset and multi-driver bugs.',
    curriculumModuleId: 'm10_sv_types',
    practiceQuiz: {
      question: 'What happens if a DUT outputs `4\'b10XZ` onto a testbench signal declared as `bit [3:0] bus`?',
      options: [
        'Compilation error',
        'X and Z convert silently to 0, reading as 4\'b1000',
        'X becomes 1 and Z becomes 0',
        'Simulation halts immediately',
      ],
      correctIndex: 1,
      explanation: '2-state types coerce both `X` and `Z` to `0`, masking unknown states.',
    },
  },
  {
    id: 'q60_r1_arrays_queues',
    checkpointDay: 60,
    minDay: 60,
    domain: 'SystemVerilog & OOP',
    subtopic: 'Dynamic Arrays, Associative Arrays & Queues',
    round: 1,
    format: 'conceptual',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 1,
    prompt:
      'When building a SystemVerilog scoreboard and memory reference model, when would you choose a queue (`[$]`), a dynamic array (`[]`), and an associative array (`[*]`)?',
    contextNotes: 'Queue: FIFO/LIFO push_back/pop_front for scoreboard expected transactions. Dynamic array: contiguous burst payload sized at runtime. Associative array: sparse large memory model (e.g., 4GB address space).',
    expectedConcepts: [
      'Queue [$]: O(1) push/pop at ends for scoreboards and transaction buffers',
      'Dynamic array []: runtime-sized contiguous storage (e.g., packet bytes)',
      'Associative array [*]: hash/tree lookup for sparse large address spaces without allocating GBs of RAM',
    ],
    idealExplanation:
      'Use a **queue (`[$]`)** for scoreboard FIFOs where items are pushed and popped dynamically; a **dynamic array (`[]`)** for variable-length packet payloads allocated once per transaction; and an **associative array (`[bit[31:0]]`)** to model sparse 32-bit/64-bit memory spaces without wasting host RAM on unaccessed addresses.',
    curriculumModuleId: 'm10_sv_types',
    practiceQuiz: {
      question: 'Which SystemVerilog container models a sparse 4 GB memory space efficiently in a reference model?',
      options: ['Fixed unpacked array', 'Dynamic array', 'Associative array indexed by 32-bit address', 'Packed struct'],
      correctIndex: 2,
      explanation: 'Associative arrays allocate entries only for addresses actually written.',
    },
  },
  {
    id: 'q60_r2_oop_polymorphism',
    checkpointDay: 60,
    minDay: 60,
    domain: 'SystemVerilog & OOP',
    subtopic: 'OOP Inheritance, Virtual Methods & Deep Copy',
    round: 2,
    format: 'deep_dive',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'In SystemVerilog OOP, suppose `BaseTxn` defines `function void print();` (non-virtual) and `ErrTxn extends BaseTxn` overrides `print()`. If a `BaseTxn h = err_obj;` handle calls `h.print()`, which method executes—and how do shallow vs deep copies behave when transactions contain nested sub-objects?',
    contextNotes: 'Non-virtual methods bind statically to handle type (BaseTxn::print runs!). Adding `virtual` enables dynamic polymorphism (ErrTxn::print). Shallow copy `new obj` copies object handle pointers, not nested objects.',
    expectedConcepts: [
      'Without virtual, handle type (BaseTxn) determines method at compile time',
      'Adding `virtual` enables runtime polymorphism via actual object type (ErrTxn)',
      'Shallow copy copies nested class handles by reference; deep copy recursively clones sub-objects',
    ],
    idealExplanation:
      'Without the `virtual` keyword, method resolution is static based on the handle type, so `h.print()` calls `BaseTxn::print()`. Declaring `virtual function void print()` enables runtime polymorphism so `ErrTxn::print()` runs. Likewise, `dst = new src` only performs a shallow copy—sharing handles to nested class objects—so a custom `copy()` method is needed for independent deep copies in scoreboards.',
    curriculumModuleId: 'm11_sv_oop',
    practiceQuiz: {
      question: 'What happens when you copy a transaction object via `txn2 = new txn1;` if `txn1` contains a handle to a `Header` sub-object?',
      options: [
        'Header is automatically cloned into an independent copy',
        'Both txn1 and txn2 point to the exact same Header instance (shallow copy)',
        'Header becomes null in txn2',
        'SystemVerilog throws a runtime exception',
      ],
      correctIndex: 1,
      explanation: 'Default shallow copy (`new src`) duplicates scalar fields and handle references, not the objects behind nested handles.',
    },
  },
  {
    id: 'q60_r2_clocking_blocks',
    checkpointDay: 60,
    minDay: 60,
    domain: 'SystemVerilog & OOP',
    subtopic: 'Interfaces, Modports & Clocking Blocks',
    round: 2,
    format: 'deep_dive',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'How do SystemVerilog `clocking` blocks eliminate testbench-to-DUT race conditions? Explain `default input #1step output #0` (or `#1ns`) sampling and driving semantics.',
    contextNotes: 'Clocking block samples inputs in Preponed region (#1step = end of previous time slot before active clock updates) and drives outputs in Re-NBA region (#0 / skew).',
    expectedConcepts: [
      'input #1step samples pre-clock values in the Preponed region before DUT flip-flops update',
      'output skew drives DUT signals after active clock edge (or at specified skew) in Re-NBA',
      'modport restricts signal directions and exposes clocking block views to driver/monitor',
    ],
    idealExplanation:
      'A clocking block separates sampling and driving from the Active region where RTL flip-flops execute. `input #1step` samples DUT outputs in the Preponed region just before the clock edge (guaranteeing pre-edge values free of races), while `output #0` (or `#1ns`) drives inputs in the Re-NBA/delayed region so the DUT sees stable values until the next clock edge.',
    curriculumModuleId: 'm10_sv_types',
    practiceQuiz: {
      question: 'In a SystemVerilog clocking block, in which simulation region does `input #1step` sample signals?',
      options: ['Postponed region of the previous time step (Preponed)', 'Active region', 'NBA region', 'Reactive region'],
      correctIndex: 0,
      explanation: '`#1step` samples values at the end of the preceding time slot (Preponed region), cleanly before any clock-edge updates.',
    },
  },
  {
    id: 'q60_r3_sv_txn_driver',
    checkpointDay: 60,
    minDay: 60,
    domain: 'SystemVerilog & OOP',
    subtopic: 'Coding OOP Transaction & Mailbox Driver',
    round: 3,
    format: 'coding',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Write a SystemVerilog `FifoTxn` transaction class with `deep_copy()`, and implement the `Driver::run()` task that pulls transactions from a parameterized `mailbox #(FifoTxn)` and drives a `virtual fifo_if.DRV` interface.',
    contextNotes: 'Check class FifoTxn with rand fields + deep_copy allocating new FifoTxn, virtual interface handle in Driver, mailbox.get(tr), and @(vif.drv_cb) synchronized driving.',
    language: 'systemverilog',
    starterCode: `class FifoTxn;
  rand bit       wr_en;
  rand bit       rd_en;
  rand bit [7:0] data;

  // TODO: Implement copy() returning an independent FifoTxn clone

endclass

class FifoDriver;
  virtual fifo_if.DRV vif;
  mailbox #(FifoTxn) gen2drv;

  function new(virtual fifo_if.DRV vif, mailbox #(FifoTxn) gen2drv);
    this.vif = vif;
    this.gen2drv = gen2drv;
  endfunction

  // TODO: Implement task run() to fetch from mailbox and drive via clocking block

endclass`,
    expectedConcepts: [
      'copy() constructs a new FifoTxn and copies wr_en, rd_en, data',
      'forever loop calling gen2drv.get(tr)',
      'Drive signals synchronized to @(vif.drv_cb) using <= inside clocking block',
    ],
    idealExplanation:
      '`FifoTxn::copy()` allocates `FifoTxn c = new();` and copies each field. `FifoDriver::run()` loops `forever`, calls `gen2drv.get(tr);`, waits `@(vif.drv_cb);`, and drives `vif.drv_cb.wr_en <= tr.wr_en; vif.drv_cb.rd_en <= tr.rd_en; vif.drv_cb.wr_data <= tr.data;` without race conditions.',
    curriculumModuleId: 'm12_sv_tb',
    practiceQuiz: {
      question: 'Why must a class-based SystemVerilog driver hold a `virtual interface` rather than a static module interface instance?',
      options: [
        'Static interfaces cannot connect to DUTs',
        'Classes are dynamic objects created at runtime, so they require a virtual reference handle to a static interface',
        'Virtual interfaces run 10x faster',
        'Mailboxes only accept virtual interfaces',
      ],
      correctIndex: 1,
      explanation: 'Interfaces are static hardware constructs elaborated at compile time; dynamic classes access them via `virtual interface` handles.',
    },
  },
  {
    id: 'q60_r3_buggy_handle',
    checkpointDay: 60,
    minDay: 60,
    domain: 'SystemVerilog & OOP',
    subtopic: 'Debugging Handle Aliasing in Generator/Scoreboard',
    round: 3,
    format: 'debugging',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'A learner complains that every transaction received by their scoreboard has the exact same data—the last transaction generated! Inspect the generator snippet below and fix the root cause.',
    contextNotes: 'Classic SV bug: `tr = new();` is placed OUTSIDE the repeat loop! Putting `tr` inside the mailbox passes the same handle repeatedly, so each `randomize()` mutates the single object in-place.',
    language: 'systemverilog',
    starterCode: `task run();
  FifoTxn tr = new();
  repeat (20) begin
    assert(tr.randomize());
    gen2drv.put(tr);
    gen2scb.put(tr);
  end
endtask`,
    expectedConcepts: [
      'tr = new() is outside the loop, so only ONE object exists in memory',
      'Both mailboxes receive the exact same handle every iteration',
      'Subsequent tr.randomize() overwrites data seen by driver and scoreboard',
      'Fix: allocate `tr = new()` inside the loop (or pass `tr.copy()`)',
    ],
    idealExplanation:
      'Because `tr = new()` is outside the `repeat` loop, all 20 mailbox entries point to the exact same `FifoTxn` object in memory. Every `randomize()` call overwrites its fields in place. Moving `tr = new()` inside the loop (or passing `tr.copy()`) gives each transaction its own independent object.',
    curriculumModuleId: 'm11_sv_oop',
    practiceQuiz: {
      question: 'How do you prevent handle aliasing when sending transactions from a generator to both a driver and scoreboard?',
      options: [
        'Declare the class fields as `static`',
        'Construct a fresh object (`new()`) or deep `copy()` for each consumer per iteration',
        'Use `bit` instead of `logic`',
        'Increase mailbox size to 100',
      ],
      correctIndex: 1,
      explanation: 'Allocating a new object per iteration (or cloning with `copy()`) prevents mutations in one consumer from corrupting another.',
    },
  },
  {
    id: 'q60_r4_tb_architecture',
    checkpointDay: 60,
    minDay: 60,
    domain: 'SystemVerilog & OOP',
    subtopic: 'Layered Testbench & Passive Monitoring',
    round: 4,
    format: 'scenario',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'In a layered SystemVerilog testbench, why should the Scoreboard receive actual DUT inputs from a passive **Monitor** observing the pin interface rather than directly from the **Generator**?',
    contextNotes: 'Monitor captures actual pin-level protocol timing, stalls/backpressure, and driver bugs! Generator only knows intent, not when DUT accepted a transfer (e.g. wait states or full flags).',
    expectedConcepts: [
      'Generator knows intended stimulus, not pin-level handshakes or backpressure stalls',
      'Monitor observes actual interface pins (valid && ready, wr_en && !full)',
      'Catches driver bugs and protocol timing mismatches',
    ],
    idealExplanation:
      'The Generator only knows abstract stimulus intent; it cannot see DUT backpressure, wait states, reset-on-the-fly, or bugs inside the Driver itself. A passive Monitor reconstructs transactions directly from the physical pin interface, ensuring the Reference Model and Scoreboard evaluate what actually entered and exited the DUT.',
    curriculumModuleId: 'm12_sv_tb',
    practiceQuiz: {
      question: 'What is the primary job of a passive Monitor in a layered testbench?',
      options: [
        'To drive reset and clock signals onto the DUT',
        'To observe pin-level activity without driving signals and convert it into transaction objects for the scoreboard/coverage',
        'To randomize constraint blocks',
        'To synthesize RTL into gates',
      ],
      correctIndex: 1,
      explanation: 'Monitors passively sample pin interfaces and publish observed transactions to scoreboards and coverage collectors.',
    },
  },
  {
    id: 'q60_r5_sv_fifo_tb',
    checkpointDay: 60,
    minDay: 60,
    domain: 'SystemVerilog & OOP',
    subtopic: 'Layered SystemVerilog FIFO Testbench Discussion',
    round: 5,
    format: 'project_discussion',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Walk through your Day 60 Layered SystemVerilog FIFO Testbench project. How did your golden queue scoreboard handle simultaneous read/write on full or empty boundaries, and how did you synchronize the end-of-test drain phase?',
    contextNotes: 'Golden SV queue `ref_q[$]`: push when `wr_en && !full_exp`, pop & compare when `rd_en && !empty_exp`. Drain test via mailbox count / event / wait(ref_q.size() == 0).',
    expectedConcepts: [
      'Reference model uses a SystemVerilog queue `[$]` sized against DEPTH',
      'Models exact overflow/underflow gating (`!full` / `!empty`)',
      'Compares both `rd_data` and `full`/`empty` status flags every cycle',
      'Synchronizes test completion until generator finishes and FIFO drains',
    ],
    idealExplanation:
      'My reference model maintained a SystemVerilog queue `ref_q[$]` capped at `DEPTH`. On each monitored clock, if `wr_en && (ref_q.size() < DEPTH)` it pushed `wr_data`; if `rd_en && (ref_q.size() > 0)` it popped `exp_data` and compared against DUT `rd_data` (accounting for 1-cycle registered read latency). Test termination waited for generator completion plus drain cycles.',
    curriculumModuleId: 'm12_sv_tb',
    practiceQuiz: {
      question: 'When verifying a FIFO with registered `rd_data` (1-cycle read latency), when should the scoreboard pop and compare?',
      options: [
        'Before reset is deasserted',
        'On the cycle following `rd_en && !empty`, matching the DUT’s registered output latency',
        'Only at the end of simulation',
        'Whenever `wr_en` is high',
      ],
      correctIndex: 1,
      explanation: 'Reference models must mirror the DUT’s exact pipeline/read latency when comparing data.',
    },
  },

  // =========================================================================
  // CHECKPOINT 5 — DAY 75: Functional Verification, Assertions & UVM
  // =========================================================================
  {
    id: 'q75_r1_uvm_comp_vs_obj',
    checkpointDay: 75,
    minDay: 75,
    domain: 'UVM Architecture',
    subtopic: 'uvm_component vs uvm_object',
    round: 1,
    format: 'conceptual',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 1,
    prompt:
      'Contrast `uvm_component` and `uvm_object` in UVM. Why do components live in the static hierarchy with phases while sequence items extend `uvm_sequence_item` (`uvm_object`)?',
    contextNotes: 'uvm_component: static hierarchy (parent arg in new), participates in UVM phases (build/connect/run), config_db scoping. uvm_object: transient data/transactions/sequences, no parent, created/destroyed dynamically.',
    expectedConcepts: [
      'uvm_component has `parent` in `new(name, parent)` forming static testbench tree',
      'uvm_component executes UVM phases (build_phase, connect_phase, run_phase)',
      'uvm_object has only `name` in `new(name)`, transient lifetime (transactions, sequences)',
    ],
    idealExplanation:
      '`uvm_component` classes (env, agent, driver, monitor, scoreboard) form a quasi-static hierarchy built once during `build_phase`—requiring a `parent` handle in `new(name, parent)` and executing all UVM phases. `uvm_object` classes (transactions, `uvm_sequence`, config objects) are transient data containers with no hierarchy parent and no phases.',
    curriculumModuleId: 'm15_uvm_core',
    practiceQuiz: {
      question: 'Which base class should a UVM bus transaction inherit from?',
      options: ['uvm_component', 'uvm_sequence_item', 'uvm_agent', 'uvm_env'],
      correctIndex: 1,
      explanation: 'Transactions extend `uvm_sequence_item` (a subclass of `uvm_object`).',
    },
  },
  {
    id: 'q75_r1_sva_implication',
    checkpointDay: 75,
    minDay: 75,
    domain: 'Functional Verification & SVA',
    subtopic: 'SVA Overlapping (|->) vs Non-Overlapping (|=>)',
    round: 1,
    format: 'conceptual',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 1,
    prompt:
      'Explain the difference between overlapping implication (`|->`) and non-overlapping implication (`|=>`) in SystemVerilog Assertions (SVA), and explain why `vacuous pass` occurs.',
    contextNotes: '|-> evaluates consequent in same cycle antecedent finishes; |=> evaluates consequent 1 clock cycle later. Vacuous pass: antecedent never triggers, so implication evaluates true without testing consequent.',
    expectedConcepts: [
      '|-> checks consequent starting on the same clock tick antecedent matches',
      '|=> checks consequent starting on the next clock tick (equivalent to |-> ##1)',
      'Vacuous pass occurs when antecedent is false; use cover property to ensure stimulus actually hit antecedent',
    ],
    idealExplanation:
      'Overlapping implication (`|->`) evaluates the consequent in the exact same clock cycle that the antecedent completes, while non-overlapping (`|=>`) waits one clock cycle (`|-> ##1`). If the antecedent never occurs, an assertion passes *vacuously*—which is why engineers pair assertions with `cover property` to prove the antecedent was actually exercised.',
    curriculumModuleId: 'm14_sva_assertions',
    practiceQuiz: {
      question: 'Which SVA property checks that `ack` goes HIGH strictly 2 cycles after `req` rises?',
      options: [
        '@(posedge clk) $rose(req) |-> ack',
        '@(posedge clk) $rose(req) |=> ##1 ack',
        '@(posedge clk) $rose(req) ##2 ack',
        '@(posedge clk) ack |-> $rose(req)',
      ],
      correctIndex: 1,
      explanation: '`|=>` adds 1 cycle and `##1` adds a second cycle (`|-> ##2 ack`), whereas bare `##2` without implication fails whenever `req` does not rise.',
    },
  },
  {
    id: 'q75_r2_rand_solve_before',
    checkpointDay: 75,
    minDay: 75,
    domain: 'Constrained Random & Coverage',
    subtopic: 'Constrained Randomization & solve-before',
    round: 2,
    format: 'deep_dive',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Given `rand bit mode; rand bit [3:0] len; constraint c { (mode == 1) -> (len == 0); }`, explain why `mode == 1` only occurs ~1/17 of the time instead of 50%. How does `solve mode before len;` change the probability distribution without changing the solution space?',
    contextNotes: 'Constraint solver picks uniformly across valid (mode, len) pairs: 1 pair has mode=1 (len=0) and 16 pairs have mode=0 (len=0..15) -> P(mode=1)=1/17! `solve mode before len` forces mode to be chosen 50/50 first, then len.',
    expectedConcepts: [
      'Solver picks uniformly from all valid (mode, len) tuples: 16 with mode=0 vs 1 with mode=1',
      'Probability of mode=1 is 1/17 (~5.9%)',
      '`solve mode before len` keeps same valid solutions but chooses mode first (50/50)',
      'Difference between hard vs soft constraints',
    ],
    idealExplanation:
      'By default, the constraint solver samples uniformly across all valid `(mode, len)` combinations: there are 16 valid pairs with `mode=0` (`len=0..15`) and only 1 valid pair with `mode=1` (`len=0`), making `mode=1` appear only 1/17 (~5.9%) of the time. Adding `solve mode before len;` forces the solver to pick `mode` uniformly first (50/50) and then satisfy `len`.',
    curriculumModuleId: 'm13_crv_coverage',
    practiceQuiz: {
      question: 'Does `solve A before B` add or remove valid solutions from the constraint space?',
      options: [
        'It removes illegal solutions',
        'It leaves the valid solution space identical and alters only sampling probability',
        'It converts `rand` into `randc`',
        'It disables all other constraints on B',
      ],
      correctIndex: 1,
      explanation: '`solve A before B` strictly alters solver probability ordering, never the set of legal solutions.',
    },
  },
  {
    id: 'q75_r2_uvm_phases_factory',
    checkpointDay: 75,
    minDay: 75,
    domain: 'UVM Architecture',
    subtopic: 'UVM Phases, Config DB & Factory Overrides',
    round: 2,
    format: 'deep_dive',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Explain why `build_phase` executes top-down while `connect_phase` executes bottom-up in UVM. How do `uvm_config_db` and UVM Factory type overrides work together without touching testbench source code?',
    contextNotes: 'Top-down build_phase lets env/test configure children (via config_db or factory overrides) BEFORE children construct themselves. Bottom-up connect_phase ensures inner TLM ports exist before outer exports connect.',
    expectedConcepts: [
      'build_phase runs top-down so parent test/env can set config_db & factory overrides before child creation',
      'connect_phase runs bottom-up (same functional effect for TLM wiring)',
      'Factory `type_id::create` enables swapping derived driver/transaction classes from the test',
    ],
    idealExplanation:
      '`build_phase` executes top-down so the top-level `uvm_test` and `uvm_env` can push `uvm_config_db` settings (like `is_active`) and register Factory overrides (`set_type_override_by_type`) *before* child components call `type_id::create()`. `connect_phase` executes bottom-up so leaf ports and exports are guaranteed to exist when parent components bind TLM connections.',
    curriculumModuleId: 'm15_uvm_core',
    practiceQuiz: {
      question: 'Why must UVM components be created with `type_id::create()` instead of `new()`?',
      options: [
        '`new()` is deprecated in SystemVerilog',
        '`type_id::create()` consults the UVM Factory so tests can override component/object types without editing env code',
        '`type_id::create()` skips `build_phase`',
        '`new()` cannot accept a parent argument',
      ],
      correctIndex: 1,
      explanation: 'Calling `type_id::create()` routes instantiation through the UVM Factory lookup table for seamless overrides.',
    },
  },
  {
    id: 'q75_r3_sva_protocol_code',
    checkpointDay: 75,
    minDay: 75,
    domain: 'Functional Verification & SVA',
    subtopic: 'Writing SVA Protocol & Coverage Properties',
    round: 3,
    format: 'coding',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 3,
    prompt:
      'Write two SystemVerilog Assertions (SVA) inside a verification checker: (1) On a `valid`/`ready` handshake, whenever `valid && !ready`, `valid` and `data` must remain stable on the next clock cycle (unless reset `rst` is active); (2) A FIFO must never overflow (`wr_en && full` is illegal when `!rst`).',
    contextNotes: 'Check `disable iff (rst)`, `@(posedge clk)`, `(valid && !ready) |=> (valid && $stable(data))`, and `!(wr_en && full)`.',
    language: 'systemverilog',
    starterCode: `module handshake_sva #(parameter W = 8) (
  input logic         clk,
  input logic         rst,
  input logic         valid,
  input logic         ready,
  input logic [W-1:0] data,
  input logic         wr_en,
  input logic         full
);
  // TODO: Write property p_valid_stable and p_no_fifo_overflow with assert statements

endmodule`,
    expectedConcepts: [
      'property p_valid_stable with @(posedge clk) disable iff (rst)',
      '(valid && !ready) |=> (valid && $stable(data))',
      'property p_no_overflow checking !(wr_en && full) with disable iff (rst)',
      'assert property (...) with $error messaging',
    ],
    idealExplanation:
      '`property p_valid_stable; @(posedge clk) disable iff (rst) (valid && !ready) |=> (valid && $stable(data)); endproperty` checks AXI-style hold stability under backpressure. `property p_no_overflow; @(posedge clk) disable iff (rst) !(wr_en && full); endproperty` flags illegal writes to a full FIFO.',
    curriculumModuleId: 'm14_sva_assertions',
    practiceQuiz: {
      question: 'What does `disable iff (rst)` do inside a concurrent SVA property?',
      options: [
        'Asserts reset whenever the property fails',
        'Asynchronously aborts and disables property evaluation while `rst` is true',
        'Disables only the first cycle of simulation',
        'Converts concurrent assertions into immediate assertions',
      ],
      correctIndex: 1,
      explanation: '`disable iff (rst)` prevents false assertion failures during reset initialization.',
    },
  },
  {
    id: 'q75_r3_uvm_seq_bug',
    checkpointDay: 75,
    minDay: 75,
    domain: 'UVM Architecture',
    subtopic: 'Debugging UVM Objections & Sequencer Hang',
    round: 3,
    format: 'debugging',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'A UVM test finishes immediately at time 0ns without driving a single transaction, even though `run_phase` starts `my_seq.start(env.agent.seqr)`. Examine the code below and fix both the zero-time exit bug and the sequencer handshake bug in the driver.',
    contextNotes: 'Bugs: 1) Missing `phase.raise_objection(this)` and `phase.drop_objection(this)` in test `run_phase` -> simulation exits at 0ns! 2) Driver calls `seq_item_port.get_next_item(req)` without `seq_item_port.item_done()`, hanging after 1st item.',
    language: 'systemverilog',
    starterCode: `class my_test extends uvm_test;
  // ... factory & build omitted ...
  task run_phase(uvm_phase phase);
    my_seq seq = my_seq::type_id::create("seq");
    seq.start(env.agent.seqr);
  endtask
endclass

class my_driver extends uvm_driver #(my_item);
  task run_phase(uvm_phase phase);
    forever begin
      seq_item_port.get_next_item(req);
      drive_item(req);
    end
  endtask
endclass`,
    expectedConcepts: [
      'Raise objection before seq.start and drop objection after seq.start',
      'Driver must call seq_item_port.item_done() after drive_item(req) so sequence unblocks',
    ],
    idealExplanation:
      'First, `my_test::run_phase` omits `phase.raise_objection(this);` and `phase.drop_objection(this);`, causing UVM to terminate `run_phase` immediately at 0ns. Second, `my_driver` calls `get_next_item(req)` without calling `seq_item_port.item_done();`, which deadlocks `finish_item()` inside the sequence after the very first transaction.',
    curriculumModuleId: 'm15_uvm_core',
    practiceQuiz: {
      question: 'Which TLM method in a UVM driver unblocks `finish_item()` in the active sequence?',
      options: ['put_response()', 'item_done()', 'raise_objection()', 'wait_for_grant()'],
      correctIndex: 1,
      explanation: '`seq_item_port.item_done()` completes the `get_next_item`/`item_done` handshake with the sequencer.',
    },
  },
  {
    id: 'q75_r4_cov_closure',
    checkpointDay: 75,
    minDay: 75,
    domain: 'Constrained Random & Coverage',
    subtopic: 'Code Coverage vs Functional Coverage Closure',
    round: 4,
    format: 'scenario',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Your regression achieves 99% RTL line and toggle code coverage, yet functional coverage is stuck at 68% and the customer finds a bug in production. Explain why high code coverage is NOT sufficient, and outline your workflow to close the remaining 32% functional coverage holes.',
    contextNotes: 'Code coverage checks RTL structure executed (misses missing features/corner combinations). Functional coverage checks specification/vplan cross scenarios. Close holes via constraint tuning, directed/corner sequences, and cross-bin inspection.',
    expectedConcepts: [
      'Code coverage measures RTL lines/branches hit; cannot detect missing spec features or multi-event interactions',
      'Functional coverage tracks verification plan scenarios and cross-product corners',
      'Closure workflow: analyze uncovered bins/crosses, add targeted constraints or directed sequences, verify no dead/illegal bins',
    ],
    idealExplanation:
      'High code coverage only proves existing RTL lines toggled; it cannot catch missing specification features or untested simultaneous interactions (e.g., simultaneous reset + backpressure + wrap). Closing the 32% functional gap requires inspecting uncovered `coverpoint`/`cross` bins, pruning truly unreachable illegal bins (`ignore_bins`), and writing biased sequences or constraints to hit remaining corner scenarios.',
    curriculumModuleId: 'm13_crv_coverage',
    practiceQuiz: {
      question: 'If a design has 100% code coverage but 65% functional coverage, what does that indicate?',
      options: [
        'Verification is complete and ready for tape-out',
        'Every RTL line executed, but key architectural combinations/scenarios from the verification plan have not been exercised',
        'The simulator failed to compile covergroups',
        'The RTL has zero bugs',
      ],
      correctIndex: 1,
      explanation: 'Code coverage does not verify scenario combinations or missing spec logic.',
    },
  },
  {
    id: 'q75_r5_uvm_dpram_project',
    checkpointDay: 75,
    minDay: 75,
    domain: 'UVM Architecture',
    subtopic: 'UVM Dual-Port RAM Environment Walkthrough',
    round: 5,
    format: 'project_discussion',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Discuss your Day 75 UVM Verification Environment for the Dual-Port RAM project. How did you structure your agents, TLM analysis ports into the scoreboard, and Factory overrides for error-injection tests?',
    contextNotes: 'Two agents (Port A & Port B), uvm_analysis_port -> uvm_tlm_analysis_fifo (or separate write macros) into scoreboard, factory type override replacing normal_seq/driver with err_seq.',
    expectedConcepts: [
      'Two agent instances (or active/passive config) publishing via uvm_analysis_port',
      'Scoreboard uses `uvm_analysis_imp_decl` or `uvm_tlm_analysis_fifo` for dual ports',
      'Address collision checking between Port A and Port B',
      'Factory override swaps base sequence/transaction with fault-injection subclass',
    ],
    idealExplanation:
      'I instantiated two configurable `dpram_agent` instances (Port A and Port B), each exposing a `uvm_analysis_port` connected to separate `uvm_tlm_analysis_fifo` buffers inside the scoreboard to avoid `write()` name collisions. The scoreboard modeled simultaneous same-address read/write hazards, while error-injection tests used Factory `set_type_override_by_type` to swap in collision-stress sequences.',
    curriculumModuleId: 'm15_uvm_core',
    practiceQuiz: {
      question: 'When a single UVM scoreboard receives transactions from two different monitors (Port A and Port B), how do you avoid `write()` method signature collisions?',
      options: [
        'Delete one of the monitors',
        'Use `uvm_tlm_analysis_fifo` per port or `` `uvm_analysis_imp_decl `` suffixes',
        'Connect both monitors to the same driver',
        'Store transactions in global variables',
      ],
      correctIndex: 1,
      explanation: 'Using `uvm_tlm_analysis_fifo` or `` `uvm_analysis_imp_decl `` gives each port an independent sink.',
    },
  },

  // =========================================================================
  // CHECKPOINT 6 — DAY 90: Complete Entry-Level RTL & DV Engineer Interview
  // =========================================================================
  {
    id: 'q90_r1_apb_protocol',
    checkpointDay: 90,
    minDay: 90,
    domain: 'Protocols & FIFO Verification',
    subtopic: 'AMBA APB Protocol Fundamentals',
    round: 1,
    format: 'conceptual',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Walk through the three states of an AMBA APB transfer (`IDLE`, `SETUP`, `ACCESS`). What must `PSEL`, `PENABLE`, `PADDR`, and `PWDATA` do during a wait-state extended transfer when `PREADY` is low?',
    contextNotes: 'IDLE (PSEL=0, PENABLE=0) -> SETUP (PSEL=1, PENABLE=0 for 1 cycle) -> ACCESS (PSEL=1, PENABLE=1 until PREADY=1). Address, write, data, and PSEL/PENABLE must remain constant while PREADY==0.',
    expectedConcepts: [
      'IDLE: PSEL=0, PENABLE=0',
      'SETUP: PSEL=1, PENABLE=0 for strictly 1 clock cycle',
      'ACCESS: PSEL=1, PENABLE=1; transfer extends while PREADY=0',
      'PADDR, PWRITE, PWDATA, PSEL, PENABLE must stay stable during ACCESS wait states',
    ],
    idealExplanation:
      'An APB transfer starts in `IDLE` (`PSEL=0, PENABLE=0`), moves to `SETUP` for strictly one clock cycle (`PSEL=1, PENABLE=0`) where address/control become valid, and enters `ACCESS` (`PSEL=1, PENABLE=1`). If the slave holds `PREADY=0`, the master remains in `ACCESS` keeping `PSEL`, `PENABLE`, `PADDR`, `PWRITE`, and `PWDATA` completely stable until `PREADY=1`.',
    curriculumModuleId: 'm17_apb_fifo_verif',
    practiceQuiz: {
      question: 'In AMBA APB, how many clock cycles does the bus stay in the `SETUP` phase for a single transfer?',
      options: ['Wait until PREADY is 1', 'Strictly 1 clock cycle', '2 clock cycles minimum', '0 cycles for reads'],
      correctIndex: 1,
      explanation: 'SETUP lasts strictly 1 clock cycle before transitioning unconditionally to ACCESS.',
    },
  },
  {
    id: 'q90_r1_sv_uvm_ral',
    checkpointDay: 90,
    minDay: 90,
    domain: 'UVM Architecture',
    subtopic: 'UVM Register Abstraction Layer (RAL) & Predictors',
    round: 1,
    format: 'conceptual',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Explain the role of the UVM Register Abstraction Layer (RAL) adapter and predictor. Contrast **frontdoor** versus **backdoor** register access, and explain why explicit/auto prediction matters.',
    contextNotes: 'Adapter converts uvm_reg_bus_op <-> protocol bus seq_item (reg2bus/bus2reg). Predictor updates mirrored reg model from actual monitored bus transactions. Frontdoor goes through bus protocol cycles; backdoor uses HDL path ($deposit/peek/poke) in 0 sim time.',
    expectedConcepts: [
      'Adapter translates generic uvm_reg_bus_op into protocol items (e.g., apb_seq_item)',
      'Explicit predictor observes monitor analysis port to update mirror accurately',
      'Frontdoor exercises real bus protocol/RTL; backdoor probes HDL hierarchy in 0 time',
    ],
    idealExplanation:
      'The `uvm_reg_adapter` translates generic `uvm_reg_bus_op` read/write requests into bus-specific sequence items (`reg2bus`/`bus2reg`), while an explicit `uvm_reg_predictor` listens to the passive monitor’s `analysis_port` to update the register model’s mirror from actual bus transfers. Frontdoor access drives real bus cycles; backdoor access uses HDL hierarchy paths in zero simulation time—ideal for preloading memories or cross-checking frontdoor writes.',
    curriculumModuleId: 'm16_uvm_advanced',
    practiceQuiz: {
      question: 'Why do production UVM environments prefer an explicit `uvm_reg_predictor` connected to the bus monitor over auto-prediction?',
      options: [
        'Auto-prediction does not work with frontdoor accesses',
        'Explicit prediction updates the register mirror even when non-RAL sequences or other masters access registers on the bus',
        'Explicit prediction eliminates the need for an adapter',
        'Auto-prediction disables functional coverage',
      ],
      correctIndex: 1,
      explanation: 'Monitoring the actual bus captures traffic from all sequences, not only RAL-initiated calls.',
    },
  },
  {
    id: 'q90_r2_async_fifo_cdc',
    checkpointDay: 90,
    minDay: 90,
    domain: 'Protocols & FIFO Verification',
    subtopic: 'Asynchronous FIFO Architecture & Verification Corner Cases',
    round: 2,
    format: 'deep_dive',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 3,
    prompt:
      'In an asynchronous FIFO (write clock `wclk`, read clock `rclk`), explain the exact Gray-code `full` condition `(wgray_next == {~rgray_sync[N:N-1], rgray_sync[N-2:0]})`—why must BOTH top MSBs be inverted instead of just the single MSB?',
    contextNotes: 'Critical DV/RTL interview classic! In Gray code, advancing half a full cycle flips BOTH the MSB and MSB-1 (e.g., 4-bit Gray: 0000 -> 1100 at half-lap, wait: 0=0000, 8=1100! Wait: 3-bit Gray: 0=000, 4=110; MSB and MSB-1 are inverted while lower bits match!).',
    expectedConcepts: [
      'Gray code symmetry mirrors lower bits across the midpoint',
      'Inverting only 1 MSB fails because Gray bit N-1 also differs by half-lap',
      'Both MSB and MSB-1 must be inverted while lower N-2 bits match',
      'Pessimistic full/empty flags due to 2-FF sync latency are safe (no overflow/underflow)',
    ],
    idealExplanation:
      'In binary, wrapping half a lap flips only the single MSB. In Gray code (reflective code), advancing by `DEPTH` (half the pointer space) flips **both** the MSB and the second-MSB (`N` and `N-1`) while the lower `N-2` bits are identical (e.g., for 3-bit Gray, `0=000` vs `4=110`; `1=001` vs `5=111`). Also, 2-FF sync delay makes `full`/`empty` slightly pessimistic, which safely prevents overflow/underflow.',
    curriculumModuleId: 'm17_apb_fifo_verif',
    practiceQuiz: {
      question: 'What is the effect of 2-flop CDC synchronizer latency on an asynchronous FIFO’s `full` flag?',
      options: [
        'It causes data corruption by asserting `full` too late',
        'It makes `full` clear conservatively (pessimistic), safely preventing write overflow while potentially delaying writes by 2 cycles',
        'It causes `empty` and `full` to assert simultaneously',
        'It corrupts Gray code parity',
      ],
      correctIndex: 1,
      explanation: 'Synchronizing `rptr` into `wclk` delays noticing a read, making `full` conservative rather than causing overflow.',
    },
  },
  {
    id: 'q90_r2_oop_crv_deep',
    checkpointDay: 90,
    minDay: 90,
    domain: 'SystemVerilog & OOP',
    subtopic: 'Constrained Random, randc & Inline Constraints',
    round: 2,
    format: 'deep_dive',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Compare `rand` and `randc` in SystemVerilog. Why can declaring a 16-bit vector as `randc` degrade performance, and what happens if a `randomize() with { ... }` inline constraint conflicts with a non-soft class constraint?',
    contextNotes: 'randc stores cyclic permutation history (huge table for wide vectors / resets permutation whenever constraints change). Hard constraint conflict causes randomize() to return 0 with un-randomized stale fields.',
    expectedConcepts: [
      'randc guarantees all unique values occur before repeating (cyclic permutation)',
      'Wide randc fields create large solver history tables and reset cycle if constraints change',
      'Hard constraint conflict makes randomize() return 0 (always check return value!)',
      'Use `soft` constraints in base transactions so tests can override safely',
    ],
    idealExplanation:
      '`randc` cycles through every valid value without repetition before starting a new permutation, which makes wide vectors (`>8–12` bits) slow and memory-heavy—plus any constraint change resets the cycle. If an inline `randomize() with` conflicts with a hard class constraint, `randomize()` returns `0` and leaves fields untouched unless the base constraint was marked `soft`.',
    curriculumModuleId: 'm13_crv_coverage',
    practiceQuiz: {
      question: 'What happens if `obj.randomize() with { addr == 8\'hFF; }` conflicts with a hard constraint `constraint c { addr < 16; }`?',
      options: [
        'Inline constraint always wins automatically',
        '`randomize()` fails and returns `0`, leaving object fields unmodified',
        'The simulator picks a random value between 16 and 255',
        'It converts `c` into a soft constraint',
      ],
      correctIndex: 1,
      explanation: 'Hard constraint conflicts cause `randomize()` to return `0`; `soft` is required for overridable defaults.',
    },
  },
  {
    id: 'q90_r3_apb_slave_code',
    checkpointDay: 90,
    minDay: 90,
    domain: 'Protocols & FIFO Verification',
    subtopic: 'Implementing APB Slave Register Interface + UVM Monitor',
    round: 3,
    format: 'coding',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 3,
    prompt:
      'Complete the SystemVerilog APB3 Slave register block (4x 32-bit registers at `PADDR[3:2]`, 0 wait states `PREADY = 1\'b1`) AND implement the APB Monitor `collect_transfer()` check verifying that sampling happens strictly when `PSEL && PENABLE && PREADY`.',
    contextNotes: 'Check write condition `psel && penable && pwrite && pready`, read output on `psel && !pwrite`, non-blocking `<=` on `always_ff`, and APB protocol transfer capture condition.',
    language: 'systemverilog',
    starterCode: `module apb_reg_slave (
  input  logic        pclk,
  input  logic        presetn,
  input  logic        psel,
  input  logic        penable,
  input  logic        pwrite,
  input  logic [3:0]  paddr,
  input  logic [31:0] pwdata,
  output logic [31:0] prdata,
  output logic        pready
);
  logic [31:0] regs [0:3];
  assign pready = 1'b1;

  // TODO: Implement always_ff write logic (reset regs to 0) and read logic

endmodule`,
    expectedConcepts: [
      'Write occurs when psel && penable && pwrite && pready',
      'Word index is paddr[3:2]',
      'Read returns regs[paddr[3:2]] cleanly without latches',
      'Active-low reset !presetn clears regs',
    ],
    idealExplanation:
      'Inside `always_ff @(posedge pclk or negedge presetn)`, clear `regs` when `!presetn`; otherwise if `psel && penable && pwrite && pready`, update `regs[paddr[3:2]] <= pwdata;`. For reads, assign `prdata = (psel && !pwrite) ? regs[paddr[3:2]] : 32\'h0;` (or register `prdata` in `SETUP` when `psel && !penable && !pwrite` for zero-wait-state `ACCESS` availability).',
    curriculumModuleId: 'm17_apb_fifo_verif',
    practiceQuiz: {
      question: 'On which cycle of an APB transfer should a passive APB Monitor capture `PADDR`, `PWDATA`/`PRDATA`, and push the transaction to the scoreboard?',
      options: [
        'Whenever PSEL == 1',
        'Strictly when PSEL && PENABLE && PREADY at posedge PCLK',
        'Whenever PENABLE == 0',
        'On negedge PRESETn',
      ],
      correctIndex: 1,
      explanation: 'In APB, data transfer completes strictly on the `ACCESS` cycle when `PSEL && PENABLE && PREADY` are all high.',
    },
  },
  {
    id: 'q90_r3_uvm_comp_code',
    checkpointDay: 90,
    minDay: 90,
    domain: 'UVM Architecture',
    subtopic: 'Implementing UVM Scoreboard & Functional Covergroup',
    round: 3,
    format: 'coding',
    modes: ['Technical', 'Industry'],
    difficulty: 3,
    prompt:
      'Write a SystemVerilog UVM `apb_coverage` subscriber extending `uvm_subscriber #(apb_txn)` containing a `covergroup` covering `pwrite` (READ/WRITE), `paddr` (4 register offsets), and `cross` coverage between direction and register address.',
    contextNotes: 'Check `uvm_component_utils(apb_coverage)`, `super.new(name, parent)`, embedded `covergroup cg` instantiated in `new()`, and `write(apb_txn t)` sampling `cg.sample()`.',
    language: 'systemverilog',
    starterCode: `class apb_coverage extends uvm_subscriber #(apb_txn);
  ` + '`uvm_component_utils(apb_coverage)' + `

  apb_txn item;

  // TODO: Define covergroup cg_apb, constructor new(), and write(apb_txn t)

endclass`,
    expectedConcepts: [
      'covergroup cg_apb with coverpoints for item.pwrite and item.paddr[3:2]',
      'cross cp_write, cp_addr',
      'Instantiate cg_apb = new() inside function new(string name, uvm_component parent)',
      'Implement function void write(apb_txn t) calling item = t; cg_apb.sample();',
    ],
    idealExplanation:
      'Extending `uvm_subscriber #(apb_txn)` provides `analysis_export` automatically. Inside `new(name, parent)` call `super.new(name, parent); cg_apb = new();`. Inside `function void write(apb_txn t)`, store `item = t;` and call `cg_apb.sample();` to track all READ/WRITE × register address cross bins.',
    curriculumModuleId: 'm15_uvm_core',
    practiceQuiz: {
      question: 'Why must a `covergroup` inside a `uvm_component` be constructed with `new()` inside the component’s constructor?',
      options: [
        'SystemVerilog forbids creating covergroups in build_phase',
        'An embedded covergroup is only allocated when `new()` is called in the enclosing class constructor (or before sampling)',
        'Covergroups automatically sample every clock without `new()`',
        'uvm_subscriber lacks a build_phase',
      ],
      correctIndex: 1,
      explanation: 'Covergroup instances inside classes are created via `cg = new()` inside `new()` before `sample()` is invoked.',
    },
  },
  {
    id: 'q90_r4_debug_regression',
    checkpointDay: 90,
    minDay: 90,
    domain: 'Protocols & FIFO Verification',
    subtopic: 'Root-Cause Debugging of Intermittent Regression Failure',
    round: 4,
    format: 'scenario',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 3,
    prompt:
      'A constrained-random regression passes 999 seeds, but Seed #4821 fails with a scoreboard mismatch on the APB-to-FIFO bridge right after a mid-test reset pulse. Describe your step-by-step root-cause debug methodology from log failure to RTL vs TB triage.',
    contextNotes: 'Reproduce exact seed (+ntb_random_seed=4821), inspect timestamp of first mismatch vs reset, trace scoreboard/reference model reset handling vs DUT reset, check waveforms & assertions.',
    expectedConcepts: [
      'Re-run failing seed #4821 with waveform dump & high UVM verbosity',
      'Locate first mismatch timestamp relative to mid-test reset',
      'Check if scoreboard/reference queue or monitor forgot to clear state on mid-test reset',
      'Verify APB/FIFO RTL reset clearing and SVA reset checks',
    ],
    idealExplanation:
      'First, replay exact seed #4821 with waveform dumping and `UVM_HIGH` logging to isolate the earliest divergence. Because it happens right after a mid-test reset, inspect whether the Reference Model / Scoreboard `ref_q` or APB Monitor cleared in-flight transactions on `presetn == 0`—a classic testbench reset-awareness bug—before checking whether the DUT leaked stale FIFO pointers or `prdata` across reset.',
    curriculumModuleId: 'm18_dv_interview_prep',
    practiceQuiz: {
      question: 'In constrained-random DV regressions, what is the FIRST action when 1 out of 1,000 tests fails?',
      options: [
        'Modify the RTL immediately',
        'Reproduce the exact failing test with its captured random seed and enable waveform/UVM debug logging',
        'Delete the failing seed from the regression list',
        'Increase functional coverage targets',
      ],
      correctIndex: 1,
      explanation: 'Random seed reproducibility lets you deterministically capture waveforms and verbose logs for the exact failure.',
    },
  },
  {
    id: 'q90_r4_fifo_vplan',
    checkpointDay: 90,
    minDay: 90,
    domain: 'Protocols & FIFO Verification',
    subtopic: 'Verification Planning for FIFO + APB',
    round: 4,
    format: 'scenario',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'If asked by a verification lead to write a concise Verification Plan for a synchronous FIFO wrapped behind an APB slave interface, list the top 5 high-risk corner cases you would prioritize and how you would check each (Scoreboard vs SVA vs Coverage).',
    contextNotes: 'Look for: (1) Simultaneous write & read at empty/full boundaries, (2) Write-when-full & read-when-empty overflow/underflow guards, (3) Back-to-back full->empty->full pointer wrap, (4) APB wait states / backpressure, (5) Reset-on-the-fly with non-empty FIFO.',
    expectedConcepts: [
      'Write when full & read when empty protection (SVA + Scoreboard)',
      'Simultaneous read+write when full, empty, and mid-fill (Cross coverage + Scoreboard)',
      'Pointer wrap-around across depth boundary (Covergroup)',
      'APB SETUP->ACCESS timing & PREADY wait-state stalls (SVA)',
      'Reset while FIFO contains valid entries (Directed/CRV + Scoreboard)',
    ],
    idealExplanation:
      'Priority verification plan items: (1) Overflow/underflow protection on `wr_en && full` / `rd_en && empty` via SVA + scoreboard; (2) Simultaneous R/W at `empty`, `full`, and `almost_full` tracked via cross coverage; (3) Multi-lap pointer wrap-around integrity via scoreboard; (4) APB `PREADY=0` wait-state signal stability via SVA; (5) Mid-traffic reset-on-the-fly verifying zero stale data leakage.',
    curriculumModuleId: 'm17_apb_fifo_verif',
    practiceQuiz: {
      question: 'Which verification mechanism is best suited to catch an illegal APB protocol signal transition (e.g., `PADDR` changing while `PREADY=0` in `ACCESS`)?',
      options: ['Code toggle coverage', 'Concurrent SVA protocol assertion on the pin interface', 'Generator constraint', 'Line coverage'],
      correctIndex: 1,
      explanation: 'Pin-level timing and stability rules belong in concurrent SVA interface assertions.',
    },
  },
  {
    id: 'q90_r5_capstone_portfolio',
    checkpointDay: 90,
    minDay: 90,
    domain: 'Protocols & FIFO Verification',
    subtopic: 'Day 90 Portfolio Defense: APB Memory-Mapped FIFO UVM Suite',
    round: 5,
    format: 'project_discussion',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 3,
    prompt:
      'Defend your Day 90 Capstone Project (AMBA APB Memory-Mapped FIFO with Full UVM Signoff Suite) as if speaking to a hiring panel. Explain your UVM virtual sequence coordination, RAL register checks, key bugs uncovered in your own RTL, and how you justified verification signoff.',
    contextNotes: 'Assess candidate’s ability to articulate end-to-end architecture, virtual sequence coordination, RAL tests (hw_reset/bit_bash), real bug discovery story, and coverage/assertion signoff metrics.',
    expectedConcepts: [
      'Clear end-to-end block diagram: APB agent, FIFO monitor, RAL predictor, scoreboard',
      'Virtual sequence orchestrating register config + data bursts + reset',
      'Concrete RTL/TB bug found and fixed during verification',
      'Signoff criteria combining 0 SVA errors, 100% scoreboard match, and functional+code coverage',
    ],
    idealExplanation:
      'Strong entry-level defense clearly connects the architecture (APB agent + passive monitor -> RAL predictor + scoreboard), explains how virtual sequences coordinated register configuration (`CTRL/STATUS`) with FIFO data bursts and mid-stream resets, describes a concrete corner-case bug caught (e.g., off-by-one `almost_full` flag or reset leak), and justifies signoff via zero assertion failures, passing RAL built-in sequences, and closed cross-coverage.',
    curriculumModuleId: 'm18_dv_interview_prep',
    practiceQuiz: {
      question: 'What is the main purpose of a UVM `virtual sequence` in a multi-interface SoC testbench?',
      options: [
        'To synthesize SystemVerilog into gate netlists',
        'To coordinate and synchronize sequences running across multiple agent sequencers from one central flow',
        'To replace the scoreboard entirely',
        'To bypass the UVM Factory',
      ],
      correctIndex: 1,
      explanation: 'Virtual sequences orchestrate child sequences across multiple agents via a virtual sequencer.',
    },
  },
  // Extra Round 4 & Round 5 questions for Days 30, 45, 60, 75, 90 to guarantee 10 unique questions per checkpoint
  {
    id: 'q30_r4_lfsr_lockup',
    checkpointDay: 30,
    minDay: 30,
    domain: 'Sequential Circuits',
    subtopic: 'LFSR Lock-Up State Prevention',
    round: 4,
    format: 'scenario',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'A 4-bit Fibonacci LFSR (XOR feedback taps) initializes to `4\'b0000` on power-up and never generates any pseudo-random sequence. Why does this happen, and how do you fix it in RTL?',
    contextNotes: 'All-zeros is the illegal lock-up state for XOR LFSRs (0^0=0). Seed to non-zero value on reset (e.g. 4\'b0001) or use XNOR taps where 1111 is lock-up.',
    expectedConcepts: [
      'XOR of all zeros remains zero indefinitely (lock-up state)',
      'Reset LFSR to a non-zero seed such as 4\'b0001',
      'Alternatively use XNOR feedback (lock-up shifts to all-ones)',
    ],
    idealExplanation:
      'An XOR-feedback LFSR locked at `4\'b0000` feeds `0 ^ 0 = 0` back forever. Resetting the shift register to a non-zero seed (e.g., `4\'b0001`) or adding lock-up recovery logic ensures it cycles through all 15 non-zero states.',
    curriculumModuleId: 'm4_sequential_counters',
    practiceQuiz: {
      question: 'How many unique states does a maximal-length 4-bit XOR LFSR cycle through?',
      options: ['16', '15', '8', '4'],
      correctIndex: 1,
      explanation: 'A maximal-length N-bit LFSR cycles through 2^N - 1 states (15 for 4 bits), excluding the all-zero lock-up state.',
    },
  },
  {
    id: 'q30_r5_tb_selfcheck',
    checkpointDay: 30,
    minDay: 30,
    domain: 'Verilog & RTL',
    subtopic: 'Self-Checking Verilog Testbench Design',
    round: 5,
    format: 'project_discussion',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'In your Day 30 Verilog project testbench, how did you make your verification automated and self-checking without manually eyeballing every waveform transition?',
    contextNotes: 'Task-based stimulus + expected output checks (`if (out !== exp) $fatal/$error`), pass/fail counters, and automated timeout watchdog.',
    expectedConcepts: [
      'Encapsulate directed stimulus in Verilog tasks',
      'Compare DUT outputs against expected values with !== (catches X/Z)',
      'Track error_count and print PASS/FAIL summary with watchdog timeout',
    ],
    idealExplanation:
      'Using `!==` (case inequality) instead of `!=` catches unexpected `X`/`Z` states automatically. Wrapping checks inside reusable Verilog tasks that compare against expected outputs, tally errors, and enforce a watchdog timeout yields deterministic pass/fail regression results.',
    curriculumModuleId: 'm6_blocking_nonblocking',
    practiceQuiz: {
      question: 'Why should a self-checking Verilog testbench use `!==` rather than `!=` when comparing DUT outputs?',
      options: [
        'It executes faster in synthesis',
        '`!==` treats X and Z as distinct values instead of returning X when unknown bits appear',
        '`!=` is invalid in Verilog-2001',
        'It automatically fixes race conditions',
      ],
      correctIndex: 1,
      explanation: 'In Verilog, `(4\'bxxxx != 4\'b0000)` evaluates to `X` (falsy in `if`), whereas `!==` returns `1` and catches uninitialized X bugs.',
    },
  },
  {
    id: 'q45_r4_reset_glitch',
    checkpointDay: 45,
    minDay: 45,
    domain: 'Synthesis & Timing',
    subtopic: 'Comb Logic on CDC & Glitch-Induced Failure',
    round: 4,
    format: 'scenario',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'An engineer feeds a decoded combinational `addr == 8\'hA5` comparator directly across a clock boundary into a 2-FF synchronizer. In silicon lab testing, spurious triggers occur intermittently. Diagnose the failure and fix the RTL.',
    contextNotes: 'Combinational glitches on `addr == 8\'hA5` during bit skew can get captured by the destination clock! Register the single-bit pulse in the launch clock domain before crossing.',
    expectedConcepts: [
      'Combinational comparators glitch during multi-bit bus transitions',
      'Destination clock can sample a narrow glitch even though steady-state was false',
      'Register the decoded signal in the source clock domain prior to the 2-FF synchronizer',
    ],
    idealExplanation:
      'Multi-bit bus transitions cause transient skew glitches on `addr == 8\'hA5`, and an asynchronous destination clock can sample that glitch. Any signal crossing clock domains must be driven directly from a flip-flop in the source domain—never from combinational logic.',
    curriculumModuleId: 'm8_cdc_timing',
    practiceQuiz: {
      question: 'What is the golden structural rule for any signal entering a 2-FF CDC synchronizer?',
      options: [
        'It must pass through at least 3 levels of LUTs first',
        'It must originate directly from a flip-flop in the source clock domain with no combinational logic in between',
        'It must be declared as a latch',
        'It must use blocking assignments',
      ],
      correctIndex: 1,
      explanation: 'Only registered outputs are guaranteed glitch-free when crossing to an asynchronous clock domain.',
    },
  },
  {
    id: 'q45_r5_synthesis_warnings',
    checkpointDay: 45,
    minDay: 45,
    domain: 'Synthesis & Timing',
    subtopic: 'Synthesizable Coding & Resource Trade-offs',
    round: 5,
    format: 'project_discussion',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'When synthesizing your Phase 3 RTL modules (FIFO and control logic), what synthesis warnings or area/timing surprises did you check for—such as register-file muxing vs SRAM macros, or bit-width truncation?',
    contextNotes: 'Deep flip-flop arrays synthesize huge mux trees (prefer SRAM for large depths), width mismatches cause silent truncation, and unused registers get swept away.',
    expectedConcepts: [
      'Flip-flop arrays scale poorly for deep FIFOs vs dual-port SRAM macros',
      'Lint checks for width mismatches and unintentional bit truncation',
      'Checking synthesis reports for inferred latches or swept-away logic',
    ],
    idealExplanation:
      'For shallow FIFOs (depth 8–16), flip-flop arrays are fast and simple, whereas deep FIFOs require compiled SRAM macros to avoid massive read-mux area. Reviewing lint/synthesis logs for inferred latches, port width mismatches, and dead-logic optimization prevents silent hardware bugs.',
    curriculumModuleId: 'm9_rtl_fifo',
    practiceQuiz: {
      question: 'Why are large FIFOs (e.g., 1024 × 64-bit) implemented with SRAM macros rather than flip-flop arrays in ASICs?',
      options: [
        'Flip-flops cannot store 64-bit words',
        'Flip-flop arrays consume excessive silicon area, clock power, and massive read multiplexer trees',
        'SRAM macros require no read/write pointers',
        'Verilog forbids arrays larger than 32 entries',
      ],
      correctIndex: 1,
      explanation: 'Flip-flops are ~6–10x larger per bit than SRAM bitcells and require large read mux trees.',
    },
  },
  {
    id: 'q60_r4_program_vs_module',
    checkpointDay: 60,
    minDay: 60,
    domain: 'SystemVerilog & OOP',
    subtopic: 'Testbench Scheduling & Delta-Cycle Races',
    round: 4,
    format: 'scenario',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'When migrating from a simple Verilog testbench to a SystemVerilog testbench with interfaces and classes, how do you verify that your driver and monitor never observe stale or future-cycle values on the exact same clock edge?',
    contextNotes: 'Use clocking blocks (`input #1step output #0` or `#1ns`), avoid `#0` hacks, and sample DUT outputs before driver applies next cycle stimulus.',
    expectedConcepts: [
      'Clocking blocks sample in Preponed region (`#1step`) and drive in Re-NBA',
      'Monitor sees pre-edge settled values; driver updates take effect for the next clock edge',
      'Avoid `#0` delay hacks which just shift races into Inactive region',
    ],
    idealExplanation:
      'Using a `clocking` block with `default input #1step output #0` guarantees that monitors capture DUT outputs in the Preponed region before flip-flops toggle, while drivers apply new stimulus in Re-NBA after RTL active evaluations settle—removing delta-cycle ordering dependency.',
    curriculumModuleId: 'm10_sv_types',
    practiceQuiz: {
      question: 'Why are `#0` procedural delays discouraged as a fix for testbench race conditions?',
      options: [
        'They cause syntax errors in SystemVerilog',
        'They merely defer execution to the Inactive region without establishing clean pre-clock/post-clock timing separation',
        'They stop the simulation clock',
        'They synthesize into inverters',
      ],
      correctIndex: 1,
      explanation: '`#0` only moves events within the same time step and creates fragile, hard-to-debug ordering dependencies.',
    },
  },
  {
    id: 'q60_r5_sv_coverage_goals',
    checkpointDay: 60,
    minDay: 60,
    domain: 'SystemVerilog & OOP',
    subtopic: 'Testbench Modularity & Reusability Decisions',
    round: 5,
    format: 'project_discussion',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Looking back at your Day 60 SystemVerilog FIFO testbench, why did you separate the Generator, Driver, and Monitor into distinct classes instead of writing one monolithic testbench loop, and how did mailboxes decouple them?',
    contextNotes: 'Separation of concerns: Generator produces abstract scenarios, Driver handles pin-level BFM timing, Monitor enables reuse across block/SoC levels, bounded/unbounded mailboxes synchronize producer-consumer.',
    expectedConcepts: [
      'Decoupling stimulus intent (Generator) from pin timing (Driver)',
      'Passive Monitor and Scoreboard remain reusable even when DUT sits inside a larger SoC',
      'Mailboxes provide thread-safe blocking `put()`/`get()` synchronization',
    ],
    idealExplanation:
      'Separating stimulus generation from pin-level driving lets you swap scenarios without touching BFM timing, while keeping the Monitor passive allows the exact same Scoreboard to work at top-level SoC integration. Mailboxes handle thread-safe producer-consumer handoff between concurrent `fork..join` components.',
    curriculumModuleId: 'm12_sv_tb',
    practiceQuiz: {
      question: 'What is the difference between `mailbox.get(tr)` and `mailbox.try_get(tr)` in SystemVerilog?',
      options: [
        '`get()` blocks until an item is available; `try_get()` returns immediately with 0 if empty',
        '`try_get()` deletes the mailbox',
        '`get()` copies without removing; `try_get()` removes',
        'There is no difference',
      ],
      correctIndex: 0,
      explanation: '`get()` is a blocking task, whereas `try_get()` is a non-blocking function returning success/failure status.',
    },
  },
  {
    id: 'q75_r4_tlm_debug',
    checkpointDay: 75,
    minDay: 75,
    domain: 'UVM Architecture',
    subtopic: 'UVM Config DB Failures & Hierarchy Debug',
    round: 4,
    format: 'scenario',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'Your UVM simulation fails at `build_phase` with `UVM_FATAL: Virtual interface not found in uvm_config_db`. List the three most common root causes for `uvm_config_db::get` returning 0 and how you debug them quickly.',
    contextNotes: '1) Instance path string mismatch or typo (`uvm_test_top.env.agt*`), 2) Field name string mismatch (`"vif"` vs `"axi_vif"`), 3) Parameter type mismatch (`virtual my_if` vs `virtual my_if.DRV` or missing `set` before `run_test`). Plus `+UVM_CONFIG_DB_TRACE`!',
    expectedConcepts: [
      'Hierarchical scope string mismatch in `set()` vs `get()`',
      'Field name typo or parameter type mismatch (e.g., modport vs full interface)',
      '`uvm_config_db::set()` called after `run_test()` starts `build_phase`',
      'Debug using `+UVM_CONFIG_DB_TRACE` or `check_config_usage()`',
    ],
    idealExplanation:
      'The top three causes are: (1) hierarchical path mismatch (`uvm_test_top.*` vs `env.agt`), (2) exact type mismatch between `set #(virtual bus_if)` and `get #(virtual bus_if.DRV)`, and (3) `field_name` typo or calling `set` after `run_test()`. Running with `+UVM_CONFIG_DB_TRACE` prints every `set`/`get` lookup so mismatches stand out immediately.',
    curriculumModuleId: 'm15_uvm_core',
    practiceQuiz: {
      question: 'Which simulator runtime switch traces every `uvm_config_db::set` and `get` lookup to debug missing virtual interfaces?',
      options: ['+UVM_FACTORY_TRACE', '+UVM_CONFIG_DB_TRACE', '+UVM_OBJECTION_TRACE', '+UVM_PHASE_TRACE'],
      correctIndex: 1,
      explanation: '`+UVM_CONFIG_DB_TRACE` logs all config_db writes and lookups with exact scopes and types.',
    },
  },
  {
    id: 'q75_r5_sva_vs_scb',
    checkpointDay: 75,
    minDay: 75,
    domain: 'Functional Verification & SVA',
    subtopic: 'Partitioning Checks Between SVA and UVM Scoreboard',
    round: 5,
    format: 'project_discussion',
    modes: ['Technical', 'Industry'],
    difficulty: 2,
    prompt:
      'In your Day 75 verification project, how did you decide which checks belong in SVA interface assertions versus inside the UVM Scoreboard?',
    contextNotes: 'SVA excels at cycle-accurate pin-level protocol timing, X-checks, and handshake stability. Scoreboard excels at cycle-independent data integrity, multi-cycle transforms, and large memory/queue state tracking.',
    expectedConcepts: [
      'SVA checks cycle-accurate pin-level protocol rules, handshakes, and immediate invariants',
      'UVM Scoreboard handles data-integrity transforms, multi-packet reordering, and memory reference models',
      'Combining both prevents blind spots between timing compliance and payload correctness',
    ],
    idealExplanation:
      'I placed cycle-accurate pin-level rules (valid/ready hold stability, no FIFO overflow/underflow, reset clearing) in SVA right on the interface, while keeping data transformation, multi-beat ordering, and memory modeling in the UVM Scoreboard. That keeps SVA properties concise and makes scoreboard logic independent of bus wait states.',
    curriculumModuleId: 'm14_sva_assertions',
    practiceQuiz: {
      question: 'Which verification check is best implemented in a UVM Scoreboard rather than SVA?',
      options: [
        'Ensuring `PENABLE` never rises before `PSEL`',
        'Comparing 10,000 out-of-order memory-mapped packet payloads against a golden reference model',
        'Checking that `valid` stays high when `ready` is 0',
        'Flagging `X` on control pins out of reset',
      ],
      correctIndex: 1,
      explanation: 'Large stateful data comparisons and out-of-order transaction matching belong in the UVM Scoreboard.',
    },
  },
  {
    id: 'q90_r5_career_readiness',
    checkpointDay: 90,
    minDay: 90,
    domain: 'Protocols & FIFO Verification',
    subtopic: 'End-to-End Verification Trade-offs & Bug Discovery',
    round: 5,
    format: 'project_discussion',
    modes: ['Beginner', 'Technical', 'Industry'],
    difficulty: 3,
    prompt:
      'Imagine you have 48 hours left before RTL freeze on your Day 90 APB FIFO block. Functional coverage is 91% and two low-priority APB error-response cross bins remain uncovered. How do you prioritize your final verification tasks and communicate risk at signoff?',
    contextNotes: 'Prioritize by risk/severity: check all P0/P1 safety & data integrity paths first (overflow/underflow, reset, PREADY stalls), inspect whether remaining bins are genuinely reachable or need a targeted directed sequence, document residual risk transparently.',
    expectedConcepts: [
      'Triage uncovered bins by functional risk (data corruption vs rare error corners)',
      'Write targeted directed/constrained sequences for reachable high-risk bins',
      'Use exclusions only with documented justification for unreachable/invalid combos',
      'Present objective assertion, scoreboard, and coverage metrics—never conceal gaps',
    ],
    idealExplanation:
      'First verify zero regressions in assertions and scoreboard checks on critical paths (reset-on-the-fly, backpressure, wrap boundaries). Next, write a quick targeted sequence to hit the remaining reachable APB `PSLVERR` cross bins—since closing 2 error bins takes minutes—and document any genuinely unreachable exclusions transparently in the signoff review.',
    curriculumModuleId: 'm18_dv_interview_prep',
    practiceQuiz: {
      question: 'When should a verification engineer add an `ignore_bins` or coverage exclusion before signoff?',
      options: [
        'Whenever a test is taking too long to run',
        'Only when the combination is architecturally impossible or illegal by specification, with documented review',
        'To artificially inflate coverage from 70% to 100%',
        'To hide failing scoreboard mismatches',
      ],
      correctIndex: 1,
      explanation: 'Exclusions are strictly reserved for architecturally impossible or out-of-spec conditions after design review.',
    },
  },
];

