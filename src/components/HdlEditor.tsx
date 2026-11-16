import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Play, RotateCcw, Terminal } from 'lucide-react';
import { HdlAnalysisResult } from '../types/interview';

interface HdlEditorProps {
  code: string;
  onChange: (nextCode: string) => void;
  language: 'verilog' | 'systemverilog';
  starterCode?: string;
  readOnly?: boolean;
}

export const HdlEditor: React.FC<HdlEditorProps> = ({
  code,
  onChange,
  language,
  starterCode,
  readOnly = false,
}) => {
  const [checking, setChecking] = useState(false);
  const [analysis, setAnalysis] = useState<HdlAnalysisResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const lines = code.split('\n');

  const handleRunCheck = async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const resp = await fetch('/api/hdl/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'HDL check failed.');
      }
      setAnalysis(data as HdlAnalysisResult);
    } catch (err: unknown) {
      setCheckError(err instanceof Error ? err.message : 'Unable to run HDL check.');
    } finally {
      setChecking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const next = code.slice(0, start) + '  ' + code.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-3.5 py-2">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Terminal className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
          <span className="font-mono font-medium">
            {language === 'systemverilog' ? 'SystemVerilog (IEEE 1800)' : 'Verilog RTL (IEEE 1364-2001)'}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="tabular-nums text-slate-400">{lines.length} lines</span>
        </div>

        <div className="flex items-center gap-2">
          {starterCode && !readOnly && (
            <button
              type="button"
              onClick={() => {
                onChange(starterCode);
                setAnalysis(null);
              }}
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Reset Template
            </button>
          )}
          <button
            type="button"
            onClick={handleRunCheck}
            disabled={checking}
            className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Play className="h-3 w-3" aria-hidden="true" />
            {checking ? 'Analyzing...' : 'Run RTL Lint Check'}
          </button>
        </div>
      </div>

      {/* Line-numbered code editor */}
      <div className="relative flex max-h-[320px] min-h-[210px] overflow-auto studio-scroll font-mono text-[13px] leading-6">
        <div
          aria-hidden="true"
          className="select-none border-r border-slate-800/80 bg-slate-900/60 px-3 py-3 text-right text-slate-500 tabular-nums"
        >
          {lines.map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>
        <textarea
          aria-label="HDL code editor"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          className="min-h-[210px] w-full resize-none bg-transparent p-3 font-mono text-[13px] leading-6 text-slate-100 placeholder-slate-500 focus:outline-none"
          placeholder="// Write synthesizable Verilog or SystemVerilog code here..."
        />
      </div>

      {/* Real Static Analysis / Simulator Output Panel */}
      {(analysis || checkError) && (
        <div className="border-t border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs">
          {checkError ? (
            <div className="flex items-start gap-2 text-rose-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{checkError}</span>
            </div>
          ) : analysis ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {analysis.syntaxValid && analysis.issues.length === 0 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                  )}
                  <span className="font-semibold text-slate-200">
                    {analysis.simulatorAvailable
                      ? 'Icarus Verilog Compiler + Static Lint'
                      : 'Static RTL Structural & Lint Check'}
                  </span>
                </div>
                <span className="text-slate-400">
                  {analysis.simulatorAvailable
                    ? 'Local simulator active'
                    : 'No local simulator binary installed — full logic verified by AI reviewer'}
                </span>
              </div>

              {analysis.simulatorOutput && (
                <pre className="mt-1 whitespace-pre-wrap rounded bg-slate-950 p-2 font-mono text-[11px] text-slate-300">
                  {analysis.simulatorOutput}
                </pre>
              )}

              {analysis.issues.length === 0 ? (
                <p className="text-emerald-300">
                  No structural syntax errors, blocking/non-blocking mismatches, or missing case defaults detected.
                </p>
              ) : (
                <ul className="space-y-1">
                  {analysis.issues.map((issue, idx) => (
                    <li
                      key={idx}
                      className={
                        issue.severity === 'error'
                          ? 'text-rose-300'
                          : issue.severity === 'warning'
                            ? 'text-amber-300'
                            : 'text-sky-300'
                      }
                    >
                      <span className="font-mono font-semibold">
                        [{issue.severity.toUpperCase()} L{issue.line}]
                      </span>{' '}
                      {issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
