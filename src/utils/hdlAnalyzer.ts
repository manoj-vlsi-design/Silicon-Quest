import { HdlAnalysisResult, HdlLintIssue } from '../types/interview';

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
    .replace(/\/\/.*$/gm, '');
}

export function analyzeHdlCode(
  rawCode: string,
  language: 'verilog' | 'systemverilog',
  simulatorAvailable = false
): HdlAnalysisResult {
  const trimmed = rawCode.trim();
  const lines = rawCode.split(/\r?\n/);
  const issues: HdlLintIssue[] = [];
  const detectedConstructs: string[] = [];

  if (!trimmed) {
    return {
      language,
      simulatorAvailable,
      executionMode: simulatorAvailable ? 'simulator' : 'static_analysis_plus_ai',
      syntaxValid: false,
      lineCount: 0,
      detectedConstructs: [],
      issues: [
        {
          severity: 'error',
          line: 1,
          rule: 'empty-submission',
          message: 'No HDL code was provided in the editor.',
        },
      ],
    };
  }

  const cleaned = stripComments(rawCode);
  const cleanedLines = cleaned.split(/\r?\n/);

  // 1. Check structural block pairs (module/endmodule, class/endclass, property/endproperty, task/endtask, function/endfunction)
  const blockPairs: Array<[RegExp, RegExp, string]> = [
    [/\bmodule\b/, /\bendmodule\b/, 'module/endmodule'],
    [/\bclass\b/, /\bendclass\b/, 'class/endclass'],
    [/\bproperty\b/, /\bendproperty\b/, 'property/endproperty'],
    [/\bcovergroup\b/, /\bendgroup\b/, 'covergroup/endgroup'],
    [/\btask\b/, /\bendtask\b/, 'task/endtask'],
    [/\bfunction\b/, /\bendfunction\b/, 'function/endfunction'],
  ];

  for (const [openRe, closeRe, label] of blockPairs) {
    const opens = (cleaned.match(new RegExp(openRe.source, 'g')) || []).length;
    const closes = (cleaned.match(new RegExp(closeRe.source, 'g')) || []).length;
    if (opens > 0) {
      detectedConstructs.push(label.split('/')[0]);
    }
    if (opens !== closes) {
      issues.push({
        severity: 'error',
        line: lines.length,
        rule: 'unbalanced-block',
        message: `Unbalanced ${label}: found ${opens} opening and ${closes} closing keyword(s).`,
      });
    }
  }

  // 2. Check begin/end matching
  const beginCount = (cleaned.match(/\bbegin\b/g) || []).length;
  const endCount = (cleaned.match(/\bend\b/g) || []).length;
  if (beginCount !== endCount) {
    issues.push({
      severity: 'error',
      line: lines.length,
      rule: 'unbalanced-begin-end',
      message: `Unbalanced begin/end blocks: found ${beginCount} 'begin' and ${endCount} 'end'.`,
    });
  }

  // 3. Detect constructs & check block-specific RTL/SV lint rules
  let blockKind: 'none' | 'seq' | 'comb' = 'none';
  let blockDepth = 0;

  cleanedLines.forEach((lineText, idx) => {
    const lineNo = idx + 1;
    const line = lineText.trim();
    if (!line) return;

    if (/\balways_ff\b|\balways\s*@\s*\(\s*(posedge|negedge)\b/.test(line)) {
      blockKind = 'seq';
      blockDepth = 0;
      detectedConstructs.push('sequential_always');
    } else if (/\balways_comb\b|\balways\s*@\s*\(\s*\*\s*\)/.test(line)) {
      blockKind = 'comb';
      blockDepth = 0;
      detectedConstructs.push('combinational_always');
    } else if (/\balways\s*@\s*\((?!\s*\*)/.test(line) && !/(posedge|negedge)/.test(line)) {
      blockKind = 'comb';
      blockDepth = 0;
      issues.push({
        severity: 'warning',
        line: lineNo,
        rule: 'explicit-comb-sensitivity',
        message: 'Explicit combinational sensitivity list detected; prefer always @(*) or always_comb to prevent RTL/gate mismatch.',
      });
    }

    if (/\bassign\b/.test(line)) {
      detectedConstructs.push('continuous_assign');
    }
    if (/\bassert\s+property\b/.test(line)) {
      detectedConstructs.push('sva_assert');
    }
    if (/\bconstraint\b/.test(line)) {
      detectedConstructs.push('sv_constraint');
    }
    if (/\bmailbox\b/.test(line)) {
      detectedConstructs.push('sv_mailbox');
    }

    const lineBegins = (line.match(/\bbegin\b/g) || []).length;
    const lineEnds = (line.match(/\bend\b/g) || []).length;
    blockDepth += lineBegins - lineEnds;

    // Check sequential blocking assignment misuse (outside local loop vars)
    if (blockKind === 'seq') {
      if (/(?<![!<>=])=(?!=)/.test(line) && !/\b(for|int|integer|localparam|parameter)\b/.test(line)) {
        issues.push({
          severity: 'warning',
          line: lineNo,
          rule: 'blocking-in-sequential',
          message: 'Blocking assignment (=) inside sequential block; use non-blocking (<=) for flip-flop state updates.',
        });
      }
    }

    // Check combinational non-blocking misuse & non-synthesizable delays
    if (blockKind === 'comb') {
      if (/<=\s*/.test(line) && !/\b(if|else|<=.*<)\b/.test(line) && /^[a-zA-Z_][\w\[\]:.]*\s*<=/.test(line)) {
        issues.push({
          severity: 'warning',
          line: lineNo,
          rule: 'nonblocking-in-combinational',
          message: 'Non-blocking assignment (<=) inside combinational always block; use blocking (=) for combinational logic.',
        });
      }
      if (/#\d+/.test(line)) {
        issues.push({
          severity: 'error',
          line: lineNo,
          rule: 'delay-in-rtl',
          message: 'Propagation delay (#N) inside combinational RTL is ignored by synthesis and causes RTL/gate mismatch.',
        });
      }
    }

    if (blockKind !== 'none' && blockDepth <= 0 && lineEnds > 0) {
      blockKind = 'none';
    }
  });

  // 4. Case without default check
  const caseMatches = (cleaned.match(/\b(case|casez|casex)\b/g) || []).length;
  const defaultMatches = (cleaned.match(/\bdefault\b/g) || []).length;
  if (caseMatches > defaultMatches) {
    issues.push({
      severity: 'warning',
      line: 1,
      rule: 'case-missing-default',
      message: 'A case statement appears to lack a default branch, risking latch inference or stuck FSM states.',
    });
  }

  // 5. TODO leftover detection
  if (/\/\/\s*TODO/i.test(rawCode)) {
    issues.push({
      severity: 'info',
      line: 1,
      rule: 'todo-marker',
      message: 'Starter TODO comment is still present—verify all required logic has been implemented.',
    });
  }

  const hasError = issues.some((i) => i.severity === 'error');
  return {
    language,
    simulatorAvailable,
    executionMode: simulatorAvailable ? 'simulator' : 'static_analysis_plus_ai',
    syntaxValid: !hasError,
    lineCount: lines.length,
    detectedConstructs: Array.from(new Set(detectedConstructs)),
    issues,
  };
}
