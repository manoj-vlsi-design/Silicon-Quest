import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHdlCode } from './hdlAnalyzer';

test('detects empty HDL code', () => {
  const res = analyzeHdlCode('   \n  ', 'verilog', false);
  assert.equal(res.syntaxValid, false);
  assert.equal(res.issues[0].rule, 'empty-submission');
});

test('passes valid 2-always Verilog FSM with non-blocking sequential and blocking comb', () => {
  const code = `
module fsm_ok(input wire clk, input wire rst, input wire din, output reg y);
  reg [1:0] state, next_state;
  always @(posedge clk) begin
    if (rst) state <= 2'b00;
    else state <= next_state;
  end
  always @(*) begin
    next_state = state;
    y = 1'b0;
    case (state)
      2'b00: if (din) next_state = 2'b01;
      default: next_state = 2'b00;
    endcase
  end
endmodule`;
  const res = analyzeHdlCode(code, 'verilog', false);
  assert.equal(res.syntaxValid, true);
  assert.equal(res.issues.length, 0);
  assert.ok(res.detectedConstructs.includes('sequential_always'));
  assert.ok(res.detectedConstructs.includes('combinational_always'));
});

test('flags blocking assignment inside sequential always block and missing default in case', () => {
  const code = `
module bad_seq(input wire clk, input wire din, output reg q);
  always @(posedge clk) begin
    q = din;
  end
  always @(*) begin
    case (q)
      1'b0: ;
    endcase
  end
endmodule`;
  const res = analyzeHdlCode(code, 'verilog', false);
  assert.ok(res.issues.some((i) => i.rule === 'blocking-in-sequential'));
  assert.ok(res.issues.some((i) => i.rule === 'case-missing-default'));
});

test('flags unbalanced begin/end and module/endmodule', () => {
  const code = `
module broken(input logic a);
  always_comb begin
    if (a) begin
      ;
    end
endmodule`;
  const res = analyzeHdlCode(code, 'systemverilog', false);
  assert.equal(res.syntaxValid, false);
  assert.ok(res.issues.some((i) => i.rule === 'unbalanced-begin-end'));
});
