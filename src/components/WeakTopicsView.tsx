import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Code2,
  Send,
} from 'lucide-react';
import { CURRICULUM_MODULES } from '../data/curriculum';
import { getConceptVisual } from '../data/conceptVisuals';
import { QUESTION_BANK } from '../data/questionBank';
import { AdaptivePlanItem, LearnerProfileState } from '../types/interview';
import { ConceptImageFrame } from './ConceptImageFrame';
import { ConceptSimulator } from './ConceptSimulator';
import { HdlEditor } from './HdlEditor';

interface WeakTopicsViewProps {
  state: LearnerProfileState;
  onStateUpdated: (nextState: LearnerProfileState) => void;
  onNavigateToCurriculum: () => void;
}

export const WeakTopicsView: React.FC<WeakTopicsViewProps> = ({
  state,
  onStateUpdated,
  onNavigateToCurriculum,
}) => {
  const [filter, setFilter] = useState<'active' | 'resolved' | 'all'>('active');
  const [selectedGapId, setSelectedGapId] = useState<string | null>(
    state.weakTopics.find((w) => !w.resolved)?.id || state.weakTopics[0]?.id || null
  );
  const [practiceTab, setPracticeTab] = useState<'visual' | 'quiz' | 'retry'>('quiz');
  const [selectedQuizIdx, setSelectedQuizIdx] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<{
    passed: boolean;
    explanation: string;
  } | null>(null);

  const [retryAnswer, setRetryAnswer] = useState('');
  const [retryCode, setRetryCode] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [retryResult, setRetryResult] = useState<{
    passed: boolean;
    score: number;
    feedback: string;
    idealExplanation: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const visibleGaps = state.weakTopics.filter((item) => {
    if (filter === 'active') return !item.resolved;
    if (filter === 'resolved') return item.resolved;
    return true;
  });

  const activeGap: AdaptivePlanItem | undefined =
    state.weakTopics.find((w) => w.id === selectedGapId) || visibleGaps[0];

  const relatedQuestion = activeGap
    ? QUESTION_BANK.find((q) => q.id === activeGap.relatedQuestionId)
    : undefined;
  const relatedModule = activeGap
    ? CURRICULUM_MODULES.find((m) => m.id === activeGap.curriculumModuleId)
    : undefined;

  const handleSelectGap = (gap: AdaptivePlanItem) => {
    setSelectedGapId(gap.id);
    setSelectedQuizIdx(null);
    setQuizResult(null);
    setRetryResult(null);
    setRetryAnswer('');
    const q = QUESTION_BANK.find((item) => item.id === gap.relatedQuestionId);
    setRetryCode(q?.starterCode || '');
    setErrorMsg(null);
  };

  const handleSubmitQuiz = async () => {
    if (!activeGap || selectedQuizIdx === null) return;
    setEvaluating(true);
    setErrorMsg(null);
    try {
      const resp = await fetch('/api/remediation/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapId: activeGap.id,
          type: 'practice_quiz',
          quizSelectedIndex: selectedQuizIdx,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Quiz evaluation failed.');
      setQuizResult({ passed: data.passed, explanation: data.explanation });
      onStateUpdated(data.state);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to grade quiz.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleSubmitRetry = async () => {
    if (!activeGap) return;
    if (!retryAnswer.trim() && !retryCode.trim()) {
      setErrorMsg('Provide an updated technical explanation or HDL code before submitting.');
      return;
    }
    setEvaluating(true);
    setErrorMsg(null);
    try {
      const resp = await fetch('/api/remediation/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapId: activeGap.id,
          type: 'retry_question',
          answerText: retryAnswer,
          code: relatedQuestion?.language ? retryCode : undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Retry evaluation failed.');
      setRetryResult({
        passed: data.passed,
        score: data.score,
        feedback: data.feedback,
        idealExplanation: data.idealExplanation,
      });
      onStateUpdated(data.state);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to evaluate retry.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1440px] space-y-8 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Weak Topics &amp; Adaptive Learning
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Close knowledge gaps identified during mock interviews through targeted practice quizzes,
            curriculum reviews, and AI-evaluated question retries.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(['active', 'resolved', 'all'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {visibleGaps.length === 0 && !activeGap ? (
        <section className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-teal-600" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-bold text-slate-900">
            {filter === 'active' ? 'No Unresolved Weak Topics' : 'No Weak Topics Found'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            All identified interview gaps have been addressed. You are cleared to advance along the
            90-day curriculum.
          </p>
          <button
            type="button"
            onClick={onNavigateToCurriculum}
            className="mt-4 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800"
          >
            Return to Curriculum
          </button>
        </section>
      ) : (
        <section className="grid gap-8 lg:grid-cols-12">
          {/* Gap List */}
          <div className="space-y-3 lg:col-span-5">
            {visibleGaps.length === 0 ? (
              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-5 text-sm text-teal-900">
                <div className="font-semibold">All active weak topics resolved</div>
                <p className="mt-1 text-xs text-teal-800">
                  Review your explanation on the right or switch to the Resolved tab to revisit past drills.
                </p>
                <button
                  type="button"
                  onClick={onNavigateToCurriculum}
                  className="mt-3 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                >
                  Return to Curriculum
                </button>
              </div>
            ) : (
              visibleGaps.map((gap) => {
                const isSelected = activeGap?.id === gap.id;
                return (
                <button
                  key={gap.id}
                  type="button"
                  onClick={() => handleSelectGap(gap)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/70'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">{gap.domain}</span>
                    {gap.resolved ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-teal-700">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Resolved
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          gap.severity === 'critical' ? 'text-rose-700' : 'text-amber-700'
                        }`}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        {gap.severity === 'critical' ? 'Critical Gap' : 'Moderate Gap'}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-display text-base font-bold text-slate-900">
                    {gap.topic}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{gap.description}</p>
                </button>
                );
              })
            )}
          </div>

          {/* Targeted Practice & Retry Workbench */}
          {activeGap && relatedQuestion && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-semibold text-sky-700">{activeGap.domain}</div>
                  <h2 className="mt-0.5 font-display text-xl font-bold text-slate-900">
                    {activeGap.topic}
                  </h2>
                  {relatedModule && (
                    <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      Recommended Lesson: {relatedModule.dayRange} · {relatedModule.title}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setPracticeTab('visual')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                      practiceTab === 'visual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Visual Simulation
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticeTab('quiz')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                      practiceTab === 'quiz' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Targeted Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPracticeTab('retry');
                      if (!retryCode && relatedQuestion.starterCode) {
                        setRetryCode(relatedQuestion.starterCode);
                      }
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                      practiceTab === 'retry' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Retry Failed Question
                  </button>
                </div>
              </div>

              {practiceTab === 'visual' ? (
                <div className="space-y-5">
                  {(() => {
                    const vis = getConceptVisual(activeGap.curriculumModuleId);
                    return (
                      <ConceptImageFrame
                        src={vis.imageUrl}
                        alt={vis.imageAlt}
                        kicker={`${activeGap.domain} · ${relatedModule?.dayRange || 'Concept Review'}`}
                        caption={vis.visualCaption}
                        invariant={vis.keyInvariant}
                        heightClass="h-44"
                      />
                    );
                  })()}
                  <ConceptSimulator moduleId={activeGap.curriculumModuleId} />
                </div>
              ) : practiceTab === 'quiz' ? (
                <div className="space-y-4">
                  <div className="text-sm font-semibold text-slate-900">
                    {relatedQuestion.practiceQuiz.question}
                  </div>
                  <div className="space-y-2">
                    {relatedQuestion.practiceQuiz.options.map((opt, idx) => (
                      <label
                        key={idx}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                          selectedQuizIdx === idx
                            ? 'border-sky-600 bg-sky-50/60'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`quiz_${activeGap.id}`}
                          checked={selectedQuizIdx === idx}
                          onChange={() => setSelectedQuizIdx(idx)}
                          className="mt-1"
                        />
                        <span className="text-slate-800">{opt}</span>
                      </label>
                    ))}
                  </div>

                  {quizResult && (
                    <div
                      className={`rounded-lg border p-4 text-xs ${
                        quizResult.passed
                          ? 'border-teal-200 bg-teal-50 text-teal-900'
                          : 'border-rose-200 bg-rose-50 text-rose-900'
                      }`}
                    >
                      <div className="font-bold">
                        {quizResult.passed ? 'Concept Verified — Weak Topic Resolved' : 'Incorrect — Review Explanation'}
                      </div>
                      <p className="mt-1 leading-relaxed">{quizResult.explanation}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={selectedQuizIdx === null || evaluating}
                      onClick={handleSubmitQuiz}
                      className="rounded-lg bg-sky-700 px-5 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
                    >
                      {evaluating ? 'Checking...' : 'Check Answer'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 whitespace-pre-wrap">
                    {relatedQuestion.prompt}
                  </div>

                  {relatedQuestion.language && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Code2 className="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
                        HDL Implementation
                      </div>
                      <HdlEditor
                        code={retryCode}
                        onChange={setRetryCode}
                        language={relatedQuestion.language}
                        starterCode={relatedQuestion.starterCode}
                      />
                    </div>
                  )}

                  <textarea
                    rows={5}
                    value={retryAnswer}
                    onChange={(e) => setRetryAnswer(e.target.value)}
                    placeholder="Provide your complete engineering explanation..."
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                  />

                  {retryResult && (
                    <div
                      className={`rounded-lg border p-4 text-xs space-y-2 ${
                        retryResult.passed
                          ? 'border-teal-200 bg-teal-50 text-teal-950'
                          : 'border-amber-200 bg-amber-50 text-amber-950'
                      }`}
                    >
                      <div className="font-bold tabular-nums">
                        Retry Score: {retryResult.score}/100 ·{' '}
                        {retryResult.passed ? 'Gap Resolved' : 'Needs Further Review'}
                      </div>
                      <p>{retryResult.feedback}</p>
                      <div className="border-t border-black/10 pt-2">
                        <span className="font-semibold">Reference Solution: </span>
                        {retryResult.idealExplanation}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={evaluating}
                      onClick={handleSubmitRetry}
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-5 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      {evaluating ? 'Evaluating with AI...' : 'Submit Retry for AI Review'}
                    </button>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                  {errorMsg}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
};
