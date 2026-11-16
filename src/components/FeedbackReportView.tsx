import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldAlert,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import { PlayCircle } from 'lucide-react';
import { CURRICULUM_MODULES } from '../data/curriculum';
import { getConceptVisual } from '../data/conceptVisuals';
import { CheckpointDay, InterviewReport } from '../types/interview';
import { ConceptImageFrame } from './ConceptImageFrame';
import { AppView } from './TopNav';

interface FeedbackReportViewProps {
  report: InterviewReport;
  onBackToArena: () => void;
  onLaunchRetest: (day: CheckpointDay) => void;
  onNavigate: (view: AppView) => void;
  onOpenConceptLab: (moduleId: string) => void;
}

export const FeedbackReportView: React.FC<FeedbackReportViewProps> = ({
  report,
  onBackToArena,
  onLaunchRetest,
  onNavigate,
  onOpenConceptLab,
}) => {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    report.questionRecords.find((r) => r.status !== 'correct')?.questionId ||
      report.questionRecords[0]?.questionId ||
      null
  );

  const rubricRows = [
    {
      label: 'Conceptual Understanding',
      score: report.rubricTotals.conceptualUnderstanding,
      max: 25,
    },
    {
      label: 'Technical Accuracy',
      score: report.rubricTotals.technicalAccuracy,
      max: 20,
    },
    {
      label: 'Practical Problem Solving',
      score: report.rubricTotals.practicalProblemSolving,
      max: 20,
    },
    {
      label: 'Coding and Debugging',
      score: report.rubricTotals.codingAndDebugging,
      max: 20,
    },
    {
      label: 'Communication and Explanation',
      score: report.rubricTotals.communicationAndExplanation,
      max: 15,
    },
  ];

  const categoryColor =
    report.totalScore >= 80
      ? 'text-teal-700'
      : report.totalScore >= 70
        ? 'text-sky-700'
        : report.totalScore >= 60
          ? 'text-amber-700'
          : 'text-rose-700';

  return (
    <main className="mx-auto max-w-[1440px] space-y-8 px-6 py-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBackToArena}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Mock Interview Arena
          </button>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Checkpoint {report.checkpointNumber} Feedback Report · Day {report.checkpointDay}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{report.mode} Mode</span>
            <span aria-hidden="true">·</span>
            <span>{report.isRetest ? 'Retest Attempt (Original Score Preserved)' : 'Original Attempt'}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Duration: {Math.max(1, Math.round(report.durationSeconds / 60))} min
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {report.adaptivePlan.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('weak_topics')}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Open Weak Topics ({report.adaptivePlan.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => onLaunchRetest(report.checkpointDay)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Attempt Re-Interview
          </button>
        </div>
      </div>

      {/* Day 90 Industry Readiness Banner */}
      {report.checkpointDay === 90 && report.readinessLevel && (
        <section className="rounded-xl border border-sky-200 bg-sky-50/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-sky-800">
                Day 90 Final Entry-Level DV &amp; RTL Readiness Assessment
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold text-slate-900">
                {report.readinessLevel}
              </h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-700">
                {report.readinessSummary}
              </p>
            </div>
            <div className="rounded-lg border border-sky-200 bg-white px-4 py-3 text-xs text-slate-600 max-w-xs">
              <div className="font-semibold text-slate-900">Readiness Scale</div>
              <div className="mt-1 space-y-0.5">
                <div>• Beginner · Developing</div>
                <div>• Intermediate · Ready to Apply for Entry-Level Positions</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Score Summary & 100-Mark Rubric */}
      <section className="grid gap-8 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Evaluation Score</div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-5xl font-bold text-slate-900 tabular-nums">
                {report.totalScore}
              </span>
              <span className="font-mono text-lg text-slate-500 tabular-nums">/ 100 ({report.percentage}%)</span>
            </div>
            <div className={`mt-2 text-lg font-bold ${categoryColor}`}>
              {report.performanceCategory}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 divide-x divide-slate-200 border-t border-slate-200 pt-5 text-center">
            <div>
              <div className="font-mono text-lg font-bold text-teal-700 tabular-nums">
                {report.correctCount}
              </div>
              <div className="text-[11px] text-slate-500">Correct</div>
            </div>
            <div>
              <div className="font-mono text-lg font-bold text-amber-700 tabular-nums">
                {report.partialCount}
              </div>
              <div className="text-[11px] text-slate-500">Partial</div>
            </div>
            <div>
              <div className="font-mono text-lg font-bold text-rose-700 tabular-nums">
                {report.incorrectCount}
              </div>
              <div className="text-[11px] text-slate-500">Incorrect</div>
            </div>
            <div>
              <div className="font-mono text-lg font-bold text-slate-500 tabular-nums">
                {report.skippedCount}
              </div>
              <div className="text-[11px] text-slate-500">Skipped</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Weighted Rubric Breakdown (100 Marks)
          </h2>
          <div className="mt-4 space-y-4">
            {rubricRows.map((row) => {
              const pct = Math.round((row.score / row.max) * 100);
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{row.label}</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {row.score} / {row.max} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-sky-600 transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Diagnostic Narrative Grid */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-display text-sm font-bold text-slate-900">Strongest Technical Topics</h3>
          {report.strongestTopics.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No topics scored 7+/10 in this attempt.</p>
          ) : (
            <ul className="mt-2.5 space-y-1.5 text-xs text-slate-700">
              {report.strongestTopics.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-display text-sm font-bold text-slate-900">Weakest Technical Topics</h3>
          {report.weakestTopics.length === 0 ? (
            <p className="mt-2 text-xs text-teal-700">No major topic weaknesses flagged.</p>
          ) : (
            <ul className="mt-2.5 space-y-1.5 text-xs text-slate-700">
              {report.weakestTopics.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-700" aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-xs">
          <div>
            <div className="font-semibold text-slate-900">Coding Performance</div>
            <p className="mt-0.5 text-slate-600 leading-relaxed">{report.codingPerformance}</p>
          </div>
          <div>
            <div className="font-semibold text-slate-900">Debugging Performance</div>
            <p className="mt-0.5 text-slate-600 leading-relaxed">{report.debuggingPerformance}</p>
          </div>
          <div>
            <div className="font-semibold text-slate-900">Communication Assessment</div>
            <p className="mt-0.5 text-slate-600 leading-relaxed">{report.communicationAssessment}</p>
          </div>
        </div>
      </section>

      {/* Personalized Adaptive Improvement Plan */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Personalized Adaptive Improvement Plan
            </h2>
            <p className="text-xs text-slate-500">
              Targeted Silicon Quest lessons, coding challenges, and quizzes tailored to your gaps.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('weak_topics')}
            className="rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 whitespace-nowrap shrink-0"
          >
            Start Targeted Remediation
          </button>
        </div>

        {report.adaptivePlan.length === 0 ? (
          <p className="pt-4 text-sm text-teal-700">
            Excellent command across all evaluated rounds. Continue progressing toward the next 15-day milestone.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {report.adaptivePlan.map((item) => {
              const mod = CURRICULUM_MODULES.find((m) => m.id === item.curriculumModuleId);
              return (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-semibold ${
                          item.severity === 'critical' ? 'text-rose-700' : 'text-amber-700'
                        }`}
                      >
                        {item.severity === 'critical' ? 'Critical Gap' : 'Moderate Gap'}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-500">{item.domain}</span>
                      {mod && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-sky-700">Module: {mod.title}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{item.title}</div>
                    <p className="mt-0.5 text-xs text-slate-600">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('weak_topics')}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    Retry / Practice
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Detailed Question-by-Question Review */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Question-by-Question Technical Review
        </h2>
        <div className="mt-4 divide-y divide-slate-200">
          {report.questionRecords.map((rec, idx) => {
            const isOpen = expandedQuestionId === rec.questionId;
            const mod = CURRICULUM_MODULES.find((m) => m.id === rec.curriculumModuleId);
            return (
              <div key={rec.questionId} className="py-4">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setExpandedQuestionId(isOpen ? null : rec.questionId)
                  }
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-700">Q{idx + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>Round {rec.round}</span>
                      <span aria-hidden="true">·</span>
                      <span>{rec.subtopic}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{rec.prompt}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums">
                      {rec.status === 'correct' ? (
                        <CheckCircle2 className="h-4 w-4 text-teal-700" aria-hidden="true" />
                      ) : rec.status === 'skipped' ? (
                        <MinusCircle className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-700" aria-hidden="true" />
                      )}
                      <span className="font-mono">{rec.scoreOutOf10}/10</span>
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">Your Response</div>
                      <p className="mt-1 whitespace-pre-wrap text-slate-700">{rec.answerText}</p>
                      {rec.submittedCode && (
                        <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-3 font-mono text-[12px] text-slate-100">
                          {rec.submittedCode}
                        </pre>
                      )}
                    </div>

                    <div>
                      <div className="font-semibold text-slate-800">Interviewer Evaluation</div>
                      <p className="mt-1 text-slate-700 leading-relaxed">{rec.aiFeedback}</p>
                    </div>

                    <div>
                      <div className="font-semibold text-teal-800">Ideal Engineering Reference</div>
                      <p className="mt-1 text-slate-700 leading-relaxed">{rec.idealExplanation}</p>
                    </div>

                    {mod && (() => {
                      const vis = getConceptVisual(mod.id);
                      return (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-3">
                          <div className="flex items-center gap-3">
                            <div className="w-28 shrink-0">
                              <ConceptImageFrame
                                src={vis.imageUrl}
                                alt={vis.imageAlt}
                                heightClass="h-16"
                                compact
                              />
                            </div>
                            <div>
                              <div className="text-sky-700 font-semibold">
                                {mod.dayRange} — {mod.title}
                              </div>
                              <div className="font-mono text-[11px] text-slate-600">
                                {vis.keyInvariant}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenConceptLab(mod.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-800 whitespace-nowrap shrink-0"
                          >
                            <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            Simulate Concept Visually
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};
