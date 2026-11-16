import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CHECKPOINTS } from '../data/curriculum';
import { InterviewReport, LearnerProfileState, TopicDomain } from '../types/interview';
import { computeConsecutiveTrend, getCheckpointScoreSummary } from '../utils/scoring';

interface AnalyticsViewProps {
  state: LearnerProfileState;
  onViewReport: (report: InterviewReport) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ state, onViewReport }) => {
  const trend = computeConsecutiveTrend(state.reports);

  // Aggregate topic mastery across all recorded answers
  const domainMap = new Map<TopicDomain, { sum: number; count: number }>();
  let codingSum = 0;
  let codingCount = 0;
  let conceptualSum = 0;
  let conceptualCount = 0;

  for (const rep of state.reports) {
    for (const rec of rep.questionRecords) {
      const existing = domainMap.get(rec.domain) || { sum: 0, count: 0 };
      domainMap.set(rec.domain, { sum: existing.sum + rec.scoreOutOf10 * 10, count: existing.count + 1 });

      if (rec.format === 'coding' || rec.format === 'debugging') {
        codingSum += rec.scoreOutOf10 * 10;
        codingCount += 1;
      } else {
        conceptualSum += rec.scoreOutOf10 * 10;
        conceptualCount += 1;
      }
    }
  }

  const domainRows = Array.from(domainMap.entries()).map(([domain, stats]) => ({
    domain,
    avg: Math.round(stats.sum / stats.count),
    count: stats.count,
  }));

  const codingAvg = codingCount > 0 ? Math.round(codingSum / codingCount) : null;
  const conceptualAvg = conceptualCount > 0 ? Math.round(conceptualSum / conceptualCount) : null;

  // SVG Chart Geometry (Day 15 -> Day 90)
  const chartW = 720;
  const chartH = 240;
  const padL = 44;
  const padR = 24;
  const padT = 20;
  const padB = 34;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const checkpointPoints = CHECKPOINTS.map((cp, idx) => {
    const x = padL + (idx / (CHECKPOINTS.length - 1)) * plotW;
    const { originalReport, latestRetestReport } = getCheckpointScoreSummary(state.reports, cp.day);
    const origY = originalReport
      ? padT + plotH - (originalReport.totalScore / 100) * plotH
      : null;
    const retestY = latestRetestReport
      ? padT + plotH - (latestRetestReport.totalScore / 100) * plotH
      : null;
    return {
      day: cp.day,
      x,
      originalScore: originalReport?.totalScore ?? null,
      origY,
      retestScore: latestRetestReport?.totalScore ?? null,
      retestY,
    };
  });

  const completedOrigPoints = checkpointPoints.filter(
    (p): p is typeof p & { origY: number; originalScore: number } => p.origY !== null
  );
  const origPolyline = completedOrigPoints.map((p) => `${p.x},${p.origY}`).join(' ');

  return (
    <main className="mx-auto max-w-[1440px] space-y-8 px-6 py-8">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Interview Performance &amp; Progress Tracking
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Track checkpoint progression from Day 15 to Day 90 with original and retest scores stored separately.
        </p>
      </div>

      {/* Top Metrics Strip */}
      <section className="grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Consecutive Interview Trend</div>
          <div className="mt-1.5 flex items-center gap-2 font-display text-lg font-bold text-slate-900">
            {trend.direction === 'improving' ? (
              <TrendingUp className="h-5 w-5 text-teal-700" aria-hidden="true" />
            ) : trend.direction === 'declining' ? (
              <TrendingDown className="h-5 w-5 text-rose-700" aria-hidden="true" />
            ) : (
              <Minus className="h-5 w-5 text-slate-500" aria-hidden="true" />
            )}
            <span>
              {trend.delta !== null
                ? `${trend.delta >= 0 ? '+' : ''}${trend.delta} pts`
                : 'Awaiting 2nd Checkpoint'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">{trend.summaryText}</p>
        </div>

        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Coding &amp; Debugging Accuracy</div>
          <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {codingAvg !== null ? `${codingAvg}%` : '—'}
          </div>
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            Across {codingCount} practical HDL / debugging evaluation(s)
          </p>
        </div>

        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Conceptual Understanding</div>
          <div className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {conceptualAvg !== null ? `${conceptualAvg}%` : '—'}
          </div>
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            Across {conceptualCount} conceptual, scenario &amp; project evaluation(s)
          </p>
        </div>
      </section>

      {/* Day 15 to Day 90 SVG Score Progression Graph */}
      <section className="grid gap-8 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Score Progression (Day 15 → Day 90)
              </h2>
              <p className="text-xs text-slate-500">
                Original checkpoint attempt scores compared against retest achievements.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-700" aria-hidden="true" />
                Original Score
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-600" aria-hidden="true" />
                Retest Score
              </span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              role="img"
              aria-label="Mock interview score progression chart from Day 15 to Day 90"
              className="w-full min-w-[520px]"
            >
              {/* Horizontal grid lines */}
              {[0, 25, 50, 75, 100].map((val) => {
                const y = padT + plotH - (val / 100) * plotH;
                return (
                  <g key={val}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray={val === 70 ? '4 4' : undefined}
                    />
                    <text
                      x={padL - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 font-mono text-[10px]"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* 70-mark benchmark line */}
              <line
                x1={padL}
                y1={padT + plotH - 0.7 * plotH}
                x2={chartW - padR}
                y2={padT + plotH - 0.7 * plotH}
                stroke="#0ea5e9"
                strokeOpacity="0.4"
                strokeDasharray="5 4"
              />

              {/* Original Score connecting line */}
              {completedOrigPoints.length >= 2 && (
                <polyline
                  fill="none"
                  stroke="#0369a1"
                  strokeWidth="2.5"
                  points={origPolyline}
                />
              )}

              {/* Data points & Day X-axis labels */}
              {checkpointPoints.map((pt) => (
                <g key={pt.day}>
                  <text
                    x={pt.x}
                    y={chartH - 10}
                    textAnchor="middle"
                    className="fill-slate-600 font-mono text-[11px]"
                  >
                    Day {pt.day}
                  </text>
                  {pt.origY !== null && (
                    <>
                      <circle cx={pt.x} cy={pt.origY} r="5" fill="#0369a1" />
                      <text
                        x={pt.x}
                        y={pt.origY - 10}
                        textAnchor="middle"
                        className="fill-slate-900 font-mono text-[11px] font-semibold"
                      >
                        {pt.originalScore}
                      </text>
                    </>
                  )}
                  {pt.retestY !== null && (
                    <>
                      <circle cx={pt.x} cy={pt.retestY} r="5" fill="#0d9488" />
                      <text
                        x={pt.x + 14}
                        y={pt.retestY + 4}
                        textAnchor="start"
                        className="fill-teal-700 font-mono text-[11px] font-semibold"
                      >
                        R:{pt.retestScore}
                      </text>
                    </>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Topic-Wise Mastery */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Topic-Wise Mastery Breakdown
          </h2>
          <p className="text-xs text-slate-500">
            Average score per VLSI domain across evaluated answers.
          </p>

          <div className="mt-4 space-y-3.5">
            {domainRows.length === 0 ? (
              <p className="text-xs text-slate-500">Complete an interview to see domain breakdowns.</p>
            ) : (
              domainRows.map((row) => (
                <div key={row.domain} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{row.domain}</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {row.avg}% ({row.count}q)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        row.avg >= 75 ? 'bg-teal-600' : row.avg >= 60 ? 'bg-sky-600' : 'bg-amber-600'
                      }`}
                      style={{ width: `${row.avg}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Complete Interview History Table */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Complete Mock Interview History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                <th className="px-6 py-3">Checkpoint</th>
                <th className="px-4 py-3">Attempt Type</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {state.reports
                .slice()
                .reverse()
                .map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3.5 font-semibold text-slate-900 tabular-nums">
                      Checkpoint {rep.checkpointNumber} (Day {rep.checkpointDay})
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {rep.isRetest ? 'Retest Attempt' : 'Original Attempt'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">{rep.mode}</td>
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-900 tabular-nums">
                      {rep.totalScore}/100
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                      {rep.performanceCategory}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 tabular-nums">
                      {new Date(rep.completedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewReport(rep)}
                        className="text-xs font-semibold text-sky-700 hover:underline"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};
