import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Lock,
  PlayCircle,
  RotateCcw,
} from 'lucide-react';
import { CHECKPOINTS, CURRICULUM_MODULES } from '../data/curriculum';
import { getConceptVisual } from '../data/conceptVisuals';
import {
  CheckpointDay,
  InterviewReport,
  LearnerProfileState,
} from '../types/interview';
import {
  evaluateProgressionGate,
  getCheckpointScoreSummary,
  isCheckpointUnlocked,
} from '../utils/scoring';
import { ConceptImageFrame } from './ConceptImageFrame';
import { AppView } from './TopNav';

interface DashboardViewProps {
  mode: 'arena' | 'curriculum';
  state: LearnerProfileState;
  onUpdateDay: (nextDay: number) => void;
  onToggleModule: (moduleId: string) => void;
  onScheduleDate: (day: CheckpointDay, dateStr: string) => void;
  onOpenSetup: (checkpointDay?: CheckpointDay) => void;
  onViewReport: (report: InterviewReport) => void;
  onNavigate: (view: AppView) => void;
  onOpenConceptLab: (moduleId?: string) => void;
  onResetDemo: () => void;
  gateWarning: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  mode,
  state,
  onUpdateDay,
  onToggleModule,
  onScheduleDate,
  onOpenSetup,
  onViewReport,
  onNavigate,
  onOpenConceptLab,
  onResetDemo,
  gateWarning,
}) => {
  const completedCheckpointDays = Array.from(
    new Set(state.reports.map((r) => r.checkpointDay))
  ) as CheckpointDay[];

  const completionPct = Math.round((completedCheckpointDays.length / CHECKPOINTS.length) * 100);
  const latestReport =
    state.reports.length > 0
      ? [...state.reports].sort(
          (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        )[0]
      : null;

  const nextCheckpoint =
    CHECKPOINTS.find((cp) => !completedCheckpointDays.includes(cp.day)) ??
    CHECKPOINTS[CHECKPOINTS.length - 1];

  const daysRemaining = Math.max(0, nextCheckpoint.day - state.currentDay);
  const approachingNext =
    !completedCheckpointDays.includes(nextCheckpoint.day) &&
    state.currentDay >= nextCheckpoint.day - 3;

  const activeWeakTopics = state.weakTopics.filter((w) => !w.resolved);
  const gateStatus = evaluateProgressionGate(state);

  // Recommended preparation tasks tied directly to next checkpoint & weak areas
  const recommendedTasks: Array<{ title: string; detail: string; actionView: AppView }> = [];
  if (activeWeakTopics.length > 0) {
    recommendedTasks.push({
      title: `Resolve ${activeWeakTopics[0].topic}`,
      detail: activeWeakTopics[0].description,
      actionView: 'weak_topics',
    });
  }
  const upcomingMods = CURRICULUM_MODULES.filter(
    (m) => m.phaseDay === nextCheckpoint.day && !state.completedModuleIds.includes(m.id)
  );
  if (upcomingMods.length > 0) {
    recommendedTasks.push({
      title: `Complete ${upcomingMods[0].title}`,
      detail: upcomingMods[0].summary,
      actionView: 'curriculum',
    });
  }
  if (recommendedTasks.length < 2) {
    recommendedTasks.push({
      title: `Prepare for ${nextCheckpoint.title}`,
      detail: `Review ${nextCheckpoint.topicsCovered} before launching the ${nextCheckpoint.durationMinutes}-minute evaluation.`,
      actionView: 'arena',
    });
  }

  return (
    <main className="mx-auto max-w-[1440px] space-y-10 px-6 py-8">
      {/* Upcoming Interview Notification Banner */}
      {approachingNext && (
        <section
          aria-label="Upcoming checkpoint notification"
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sky-200 bg-sky-50/80 px-5 py-4"
        >
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-sky-800">
              Checkpoint Notification · Day {state.currentDay} of 90
            </div>
            <p className="text-sm font-medium text-slate-900">
              {daysRemaining === 0
                ? `${nextCheckpoint.title} milestone reached today.`
                : `Approaching ${nextCheckpoint.title} (${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining).`}{' '}
              {isCheckpointUnlocked(nextCheckpoint.day, state.currentDay)
                ? 'Your assessment window is now open.'
                : `Unlocks on Day ${nextCheckpoint.windowStartDay}.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isCheckpointUnlocked(nextCheckpoint.day, state.currentDay) && (
              <button
                type="button"
                onClick={() => onOpenSetup(nextCheckpoint.day)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 whitespace-nowrap shrink-0"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                Launch Day {nextCheckpoint.day} Interview
              </button>
            )}
          </div>
        </section>
      )}

      {/* Knowledge Gap Gate Banner (if blocked from advancing past unresolved gaps) */}
      {(gateWarning || gateStatus.blocked) && (
        <section
          role="alert"
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-amber-950">
                Knowledge Gap Remediation Required
              </h2>
              <p className="mt-0.5 text-sm text-amber-900">
                {gateWarning || gateStatus.reason}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('weak_topics')}
            className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 whitespace-nowrap shrink-0"
          >
            Open Weak Topics
          </button>
        </section>
      )}

      {mode === 'arena' ? (
        <>
          {/* Hero Split Section (2-column items-stretch) */}
          <section className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-7 lg:col-span-7">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  <span>90-Day VLSI RTL &amp; Design Verification Track</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">Day {state.currentDay} of 90</span>
                  <span aria-hidden="true">·</span>
                  <span>{state.learnerName}</span>
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-balance">
                  Mock Interview Arena
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                  Every 15 days of your Silicon Quest journey unlocks a mandatory 5-round technical
                  assessment scoped strictly to your completed modules—combining conceptual depth,
                  live HDL coding, debugging scenarios, and project defense.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onOpenSetup(nextCheckpoint.day)}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-800 whitespace-nowrap shrink-0"
                >
                  Start Day {nextCheckpoint.day} Interview
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenConceptLab()}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  Open Visual Concept Lab
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('curriculum')}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  90-Day Curriculum
                </button>
                {latestReport && (
                  <button
                    type="button"
                    onClick={() => onViewReport(latestReport)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap shrink-0"
                  >
                    Review Latest Report ({latestReport.totalScore}/100)
                  </button>
                )}
              </div>
            </div>

            <div className="relative min-h-[240px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 lg:col-span-5">
              <img
                src="/src/assets/images/hero_silicon_die_1794810564779.jpg"
                alt="Architectural rendering of a semiconductor silicon microprocessor die"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="text-xs font-medium text-slate-200">
                  Next Milestone · Checkpoint {nextCheckpoint.checkpointNumber}
                </div>
                <div className="mt-0.5 font-display text-lg font-bold">{nextCheckpoint.title}</div>
                <div className="mt-1 text-xs text-slate-200">{nextCheckpoint.topicsCovered}</div>
              </div>
            </div>
          </section>

          {/* 4-Column KPI Strip directly below hero */}
          <section
            aria-label="Mock Interview Arena overview metrics"
            className="grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
          >
            <div className="p-5">
              <div className="text-xs font-medium text-slate-500">Next Mock Interview</div>
              <div className="mt-1.5 font-display text-xl font-bold text-slate-900 tabular-nums">
                {state.scheduledInterviews[nextCheckpoint.day] || `Day ${nextCheckpoint.day} Milestone`}
              </div>
              <div className="mt-1 text-xs text-slate-600 tabular-nums">
                {daysRemaining === 0
                  ? 'Window active today'
                  : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`}
              </div>
            </div>

            <div className="p-5">
              <div className="text-xs font-medium text-slate-500">Interview Completion</div>
              <div className="mt-1.5 font-display text-xl font-bold text-slate-900 tabular-nums">
                {completionPct}%
              </div>
              <div className="mt-1 text-xs text-slate-600 tabular-nums">
                {completedCheckpointDays.length} of {CHECKPOINTS.length} checkpoints completed
              </div>
            </div>

            <div className="p-5">
              <div className="text-xs font-medium text-slate-500">Latest Score</div>
              <div className="mt-1.5 font-display text-xl font-bold text-slate-900 tabular-nums">
                {latestReport ? `${latestReport.totalScore} / 100` : 'No attempts yet'}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {latestReport
                  ? `Day ${latestReport.checkpointDay} · ${latestReport.performanceCategory}`
                  : 'Complete Day 15 to benchmark'}
              </div>
            </div>

            <div className="p-5">
              <div className="text-xs font-medium text-slate-500">Active Weak Topics</div>
              <div className="mt-1.5 font-display text-xl font-bold text-slate-900 tabular-nums">
                {activeWeakTopics.length}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {activeWeakTopics.length === 0
                  ? 'All tracked concepts verified'
                  : activeWeakTopics[0].topic}
              </div>
            </div>
          </section>

          {/* Six Mandatory Checkpoints Schedule & Scheduler */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Six Mandatory Assessment Checkpoints
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Each checkpoint unlocks when its syllabus window opens and tests only studied topics.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Learning Day Control:</span>
                <button
                  type="button"
                  onClick={() => onUpdateDay(Math.max(1, state.currentDay - 5))}
                  className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 tabular-nums"
                >
                  -5d
                </button>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  Day {state.currentDay}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateDay(Math.min(90, state.currentDay + 5))}
                  className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 tabular-nums"
                >
                  +5d
                </button>
                <button
                  type="button"
                  onClick={onResetDemo}
                  title="Reset learner progress to default Day 29 state"
                  className="ml-2 inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-100"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Reset
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    <th className="px-5 py-3.5">Checkpoint</th>
                    <th className="px-4 py-3.5">Interview Day</th>
                    <th className="px-4 py-3.5">Topics Covered</th>
                    <th className="px-4 py-3.5">Window &amp; Schedule</th>
                    <th className="px-4 py-3.5 text-right">Original / Retest</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {CHECKPOINTS.map((cp) => {
                    const unlocked = isCheckpointUnlocked(cp.day, state.currentDay);
                    const { originalReport, latestRetestReport } = getCheckpointScoreSummary(
                      state.reports,
                      cp.day
                    );
                    const scheduledDate = state.scheduledInterviews[cp.day] || '';

                    return (
                      <tr key={cp.day} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">
                            Interview {cp.checkpointNumber}
                          </div>
                          <div className="text-xs text-slate-500">
                            {originalReport ? (
                              <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                Completed
                              </span>
                            ) : unlocked ? (
                              <span className="text-sky-700 font-medium">Unlocked</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                                Unlocks Day {cp.windowStartDay}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 font-mono text-xs font-semibold text-slate-800 tabular-nums">
                          Day {cp.day}
                        </td>

                        <td className="px-4 py-4 text-slate-700">{cp.topicsCovered}</td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                            <input
                              type="date"
                              aria-label={`Schedule date for Day ${cp.day} checkpoint`}
                              value={scheduledDate}
                              onChange={(e) => onScheduleDate(cp.day, e.target.value)}
                              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 tabular-nums focus:border-sky-600 focus:outline-none"
                            />
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500 tabular-nums">
                            Window: Days {cp.windowStartDay}–{cp.windowEndDay}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right font-mono text-xs tabular-nums">
                          {originalReport ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-900">
                                {originalReport.totalScore}/100 ({originalReport.performanceCategory})
                              </div>
                              {latestRetestReport && (
                                <div className="text-teal-700">
                                  Retest: {latestRetestReport.totalScore}/100
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            {originalReport && (
                              <button
                                type="button"
                                onClick={() => onViewReport(latestRetestReport || originalReport)}
                                className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                              >
                                Report
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={!unlocked}
                              onClick={() => onOpenSetup(cp.day)}
                              className={`rounded px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                                unlocked
                                  ? 'bg-sky-700 text-white hover:bg-sky-800'
                                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
                              }`}
                            >
                              {originalReport ? 'Retest' : 'Start'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Weak Areas & Recommended Preparation Split */}
          <section className="grid gap-8 lg:grid-cols-12">
            <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Recommended Preparation &amp; Weak Areas
                  </h2>
                  <p className="text-xs text-slate-500">
                    Targeted actions generated from your interview evaluations and upcoming syllabus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('weak_topics')}
                  className="text-xs font-semibold text-sky-700 hover:text-sky-800 whitespace-nowrap shrink-0"
                >
                  View All Weak Topics
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {recommendedTasks.map((task, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4 py-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{task.title}</div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{task.detail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate(task.actionView)}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                    >
                      Practice
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Previous Scores &amp; Day 90 Target
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Day 90 simulates an entry-level RTL &amp; Design Verification Engineer interview.
                </p>

                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                  <img
                    src="/src/assets/images/chip_verification_blueprint_1794810565832.jpg"
                    alt="Digital IC verification architecture blueprint"
                    referrerPolicy="no-referrer"
                    className="h-36 w-full object-cover"
                  />
                </div>

                <div className="mt-4 space-y-2">
                  {state.reports.length === 0 ? (
                    <p className="text-xs text-slate-500">No completed interviews recorded yet.</p>
                  ) : (
                    state.reports
                      .slice()
                      .reverse()
                      .slice(0, 3)
                      .map((rep) => (
                        <div
                          key={rep.id}
                          className="flex items-center justify-between border-b border-slate-100 py-2 text-xs last:border-b-0"
                        >
                          <div className="text-slate-700">
                            <span className="font-semibold text-slate-900">
                              Day {rep.checkpointDay}
                            </span>{' '}
                            · {rep.mode} {rep.isRetest ? '(Retest)' : '(Original)'}
                          </div>
                          <div className="flex items-center gap-3 tabular-nums">
                            <span className="font-mono font-semibold text-slate-900">
                              {rep.totalScore}/100
                            </span>
                            <button
                              type="button"
                              onClick={() => onViewReport(rep)}
                              className="font-medium text-sky-700 hover:underline"
                            >
                              Open
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('analytics')}
                className="mt-4 w-full rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open Full Performance Analytics
              </button>
            </div>
          </section>
        </>
      ) : (
        /* CURRICULUM VIEW: Existing 90-Day Silicon Quest Journey Preserved & Integrated */
        <section className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="text-xs font-medium text-slate-500 tabular-nums">
                Silicon Quest 90-Day Roadmap · Day {state.currentDay} of 90 ·{' '}
                {state.completedModuleIds.length}/{CURRICULUM_MODULES.length} Modules Completed
              </div>
              <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">
                90-Day RTL Design &amp; Verification Curriculum
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Complete technical modules and hands-on projects across six 15-day phases. Each
                phase culminates in a mandatory Mock Interview Checkpoint.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Jump / Advance Day:</span>
              {[15, 30, 45, 60, 75, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onUpdateDay(d)}
                  className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold tabular-nums transition-colors ${
                    state.currentDay >= d
                      ? 'bg-sky-700 text-white'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Day {d}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {CHECKPOINTS.map((cp) => {
              const phaseModules = CURRICULUM_MODULES.filter((m) => m.phaseDay === cp.day);
              const unlocked = isCheckpointUnlocked(cp.day, state.currentDay);
              const { originalReport, latestRetestReport } = getCheckpointScoreSummary(
                state.reports,
                cp.day
              );

              return (
                <div
                  key={cp.day}
                  className="py-8 first:pt-2 last:pb-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
                    <div>
                      <div className="text-xs font-semibold text-sky-700 tabular-nums">
                        Phase {cp.checkpointNumber} · Days {cp.day - 14}–{cp.day}
                      </div>
                      <h2 className="mt-0.5 font-display text-xl font-bold text-slate-900">
                        {cp.topicsCovered}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3">
                      {originalReport ? (
                        <button
                          type="button"
                          onClick={() => onViewReport(latestRetestReport || originalReport)}
                          className="rounded-lg border border-teal-300 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 tabular-nums"
                        >
                          Checkpoint {cp.checkpointNumber}: {originalReport.totalScore}/100
                          {latestRetestReport ? ` · Retest ${latestRetestReport.totalScore}/100` : ''}
                        </button>
                      ) : unlocked ? (
                        <button
                          type="button"
                          onClick={() => onOpenSetup(cp.day)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 whitespace-nowrap shrink-0"
                        >
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          Take Checkpoint {cp.checkpointNumber} Interview
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                          Interview unlocks Day {cp.windowStartDay}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    {phaseModules.map((mod) => {
                      const isDone = state.completedModuleIds.includes(mod.id);
                      const vis = getConceptVisual(mod.id);
                      return (
                        <div
                          key={mod.id}
                          className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white"
                        >
                          <div>
                            <ConceptImageFrame
                              src={vis.imageUrl}
                              alt={vis.imageAlt}
                              caption={vis.visualCaption}
                              heightClass="h-32 rounded-none border-0 border-b border-slate-200"
                              compact
                            />
                            <div className="p-5 pb-0">
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="tabular-nums font-medium">{mod.dayRange}</span>
                                <span>{mod.domain}</span>
                              </div>
                              <h3 className="mt-1.5 font-display text-base font-semibold text-slate-900">
                                {mod.title}
                              </h3>
                              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                                {mod.summary}
                              </p>
                              <ul className="mt-3 space-y-1 text-xs text-slate-700">
                                {mod.lessons.map((lesson, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span aria-hidden="true" className="text-sky-600">•</span>
                                    <span>{lesson}</span>
                                  </li>
                                ))}
                              </ul>

                              {mod.projectTitle && (
                                <div className="mt-4 border-t border-slate-100 pt-3 text-xs">
                                  <div className="font-semibold text-slate-900">
                                    Milestone Project: {mod.projectTitle}
                                  </div>
                                  <p className="mt-0.5 text-slate-600">{mod.projectDescription}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-2 p-5 pt-0">
                            <button
                              type="button"
                              onClick={() => onOpenConceptLab(mod.id)}
                              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-sky-700 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-800"
                            >
                              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                              Simulate Concept Visually
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleModule(mod.id)}
                              className={`flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors ${
                                isDone
                                  ? 'border border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100'
                                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              {isDone ? 'Module Completed' : 'Mark Module Completed'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
};
