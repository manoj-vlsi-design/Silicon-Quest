import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Code2,
  Mic,
  MicOff,
  Send,
  SkipForward,
  StopCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ActiveInterviewSession } from '../types/interview';
import { HdlEditor } from './HdlEditor';

interface InterviewSessionViewProps {
  session: ActiveInterviewSession;
  onUpdateSessionState: (nextSession: ActiveInterviewSession) => void;
  onReportReady: (reportId: string) => void;
}

const ROUND_LABELS: Record<number, string> = {
  1: 'Round 1: Technical Fundamentals',
  2: 'Round 2: Technical Deep Dive',
  3: 'Round 3: Practical Coding',
  4: 'Round 4: Real-World Problem Solving',
  5: 'Round 5: Project Discussion',
};

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export const InterviewSessionView: React.FC<InterviewSessionViewProps> = ({
  session,
  onUpdateSessionState,
  onReportReady,
}) => {
  const currentQuestion = session.questions[session.currentQuestionIndex];
  const isFinishedAll = session.currentQuestionIndex >= session.questions.length;

  const [answerText, setAnswerText] = useState('');
  const [codeValue, setCodeValue] = useState(currentQuestion?.starterCode || '');
  const [showEditor, setShowEditor] = useState(
    Boolean(currentQuestion?.language || currentQuestion?.starterCode)
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(session.elapsedSeconds || 0);
  const [questionStartElapsed, setQuestionStartElapsed] = useState(session.elapsedSeconds || 0);
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Optional Voice Support (Web Speech API)
  const [voiceSpeakEnabled, setVoiceSpeakEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const dialogueEndRef = useRef<HTMLDivElement | null>(null);

  // Sync editor starter code whenever question index advances
  useEffect(() => {
    const q = session.questions[session.currentQuestionIndex];
    if (q && !session.awaitingFollowUp) {
      setCodeValue(q.starterCode || '');
      setShowEditor(Boolean(q.language || q.starterCode));
      setQuestionStartElapsed(elapsedSeconds);
    }
    setConfirmSkip(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.currentQuestionIndex]);

  // Interview countdown / elapsed timer
  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Scroll transcript to latest message
  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.dialogue.length]);

  // Optional AI interviewer speech read-aloud
  useEffect(() => {
    if (!voiceSpeakEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const lastTurn = session.dialogue[session.dialogue.length - 1];
    if (lastTurn && lastTurn.speaker === 'interviewer') {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(lastTurn.text);
      utter.rate = 1.02;
      window.speechSynthesis.speak(utter);
    }
  }, [session.dialogue, voiceSpeakEnabled]);

  const remaining = Math.max(0, session.durationLimitSeconds - elapsedSeconds);
  const formatClock = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const toggleVoiceMic = () => {
    setVoiceNotice(null);
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceNotice('Voice dictation is not supported in this browser; please type your response.');
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (ev) => {
      let transcript = '';
      for (let i = 0; i < ev.results.length; i++) {
        transcript += ev.results[i][0].transcript + ' ';
      }
      setAnswerText((prev) => (prev ? `${prev.trim()} ${transcript.trim()}` : transcript.trim()));
    };
    rec.onerror = () => {
      setListening(false);
      setVoiceNotice('Microphone input interrupted. You can continue typing your answer.');
    };
    rec.onend = () => {
      setListening(false);
    };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim() && (!showEditor || !codeValue.trim())) {
      setErrorMsg('Please enter an explanation or HDL code before submitting.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const resp = await fetch('/api/interview/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerText,
          submittedCode: showEditor ? codeValue : undefined,
          skipped: false,
          timeSpentSeconds: Math.max(1, elapsedSeconds - questionStartElapsed),
          elapsedSeconds,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Evaluation request failed.');
      }
      setAnswerText('');
      onUpdateSessionState(data.session);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to evaluate answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipQuestion = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const resp = await fetch('/api/interview/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answerText: '',
          skipped: true,
          timeSpentSeconds: Math.max(1, elapsedSeconds - questionStartElapsed),
          elapsedSeconds,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Skip request failed.');
      }
      setAnswerText('');
      setConfirmSkip(false);
      onUpdateSessionState(data.session);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to skip question.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async (endedEarly: boolean) => {
    setFinalizing(true);
    setErrorMsg(null);
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      const resp = await fetch('/api/interview/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elapsedSeconds, endedEarly }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to generate feedback report.');
      }
      onReportReady(data.report.id);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to finalize interview.');
    } finally {
      setFinalizing(false);
    }
  };

  const progressCurrent = Math.min(session.currentQuestionIndex + 1, session.questions.length);

  return (
    <main className="mx-auto max-w-[1440px] space-y-5 px-6 py-6">
      {/* Studio Session Bar */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-sky-700">
              Checkpoint {session.checkpointNumber} · Day {session.checkpointDay}
            </span>
            <span aria-hidden="true">·</span>
            <span>{session.mode} Interview</span>
            {session.isRetest && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-amber-700">Retest Attempt</span>
              </>
            )}
          </div>
          <h1 className="font-display text-base font-bold text-slate-900">
            {currentQuestion
              ? ROUND_LABELS[currentQuestion.round]
              : 'Interview Complete — Ready for Scoring'}
          </h1>
        </div>

        {/* Round & Question Progress + Timer + Voice Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] font-medium text-slate-500">Question Progress</div>
            <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
              {progressCurrent} / {session.questions.length}
            </div>
          </div>

          <div className="h-7 w-px bg-slate-200" aria-hidden="true" />

          <div className="text-right">
            <div className="text-[11px] font-medium text-slate-500">Time Remaining</div>
            <div
              className={`font-mono text-sm font-semibold tabular-nums ${
                remaining < 300 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {formatClock(remaining)}
            </div>
          </div>

          <div className="h-7 w-px bg-slate-200" aria-hidden="true" />

          <button
            type="button"
            onClick={() => {
              const next = !voiceSpeakEnabled;
              setVoiceSpeakEnabled(next);
              if (!next && 'speechSynthesis' in window) window.speechSynthesis.cancel();
            }}
            aria-label={voiceSpeakEnabled ? 'Mute AI interviewer voice' : 'Enable AI interviewer voice'}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${
              voiceSpeakEnabled
                ? 'border-sky-300 bg-sky-50 text-sky-800'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {voiceSpeakEnabled ? (
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Voice Read-Aloud
          </button>

          {!confirmEnd ? (
            <button
              type="button"
              onClick={() => setConfirmEnd(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 whitespace-nowrap shrink-0"
            >
              <StopCircle className="h-3.5 w-3.5" aria-hidden="true" />
              End Interview
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={finalizing}
                onClick={() => handleFinalize(true)}
                className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 whitespace-nowrap shrink-0"
              >
                {finalizing ? 'Scoring...' : 'Confirm End & Score'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmEnd(false)}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 5-Round Progress Indicator */}
      <div
        aria-label="Interview round progress"
        className="grid grid-cols-5 gap-2"
      >
        {[1, 2, 3, 4, 5].map((r) => {
          const activeRound = currentQuestion ? currentQuestion.round : 6;
          const isDone = activeRound > r;
          const isCurrent = activeRound === r;
          return (
            <div
              key={r}
              className={`rounded-lg border px-3 py-2 text-xs ${
                isCurrent
                  ? 'border-sky-600 bg-sky-50 font-semibold text-sky-900'
                  : isDone
                    ? 'border-teal-200 bg-teal-50/60 text-teal-800'
                    : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              <span className="tabular-nums">Round {r}</span>
              <span className="hidden sm:inline">
                {' · '}
                {r === 1
                  ? 'Fundamentals'
                  : r === 2
                    ? 'Deep Dive'
                    : r === 3
                      ? 'HDL Coding'
                      : r === 4
                        ? 'Problem Solving'
                        : 'Project Defense'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Split Interview Room */}
      <section className="grid gap-6 lg:grid-cols-12">
        {/* Left Pane: AI Interviewer Dialogue + Single Active Question */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white lg:col-span-5">
          <div className="flex items-center gap-3.5 border-b border-slate-200 px-5 py-4">
            <img
              src="/src/assets/images/interviewer_avatar_1794810564999.jpg"
              alt="Principal Silicon Verification Technical Interviewer"
              referrerPolicy="no-referrer"
              className="h-11 w-11 rounded-lg object-cover border border-slate-200"
            />
            <div>
              <div className="font-display text-sm font-bold text-slate-900">
                Principal Silicon Interviewer
              </div>
              <div className="text-xs text-slate-500">
                RTL Design &amp; DV Technical Assessment Panel
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5 max-h-[540px] studio-scroll">
            {session.dialogue.map((turn) => (
              <div
                key={turn.id}
                className={`rounded-lg p-3.5 text-sm leading-relaxed ${
                  turn.speaker === 'interviewer'
                    ? 'border border-slate-200 bg-slate-50 text-slate-800'
                    : 'border border-sky-200 bg-sky-50/70 text-slate-900 ml-5'
                }`}
              >
                <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>{turn.speaker === 'interviewer' ? 'Interviewer' : 'Your Response'}</span>
                  {turn.evaluationBadge && (
                    <span
                      className={
                        turn.evaluationBadge === 'Strong'
                          ? 'text-teal-700'
                          : turn.evaluationBadge === 'Partial'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                      }
                    >
                      {turn.evaluationBadge}
                    </span>
                  )}
                </div>
                <div className="whitespace-pre-wrap">{turn.text}</div>
                {turn.codeSnippet && (
                  <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-2.5 font-mono text-xs text-slate-200">
                    {turn.codeSnippet}
                  </pre>
                )}
              </div>
            ))}
            <div ref={dialogueEndRef} />
          </div>
        </div>

        {/* Right Pane: Active Question Response + Integrated HDL Workbench */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          {isFinishedAll ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <h2 className="font-display text-2xl font-bold text-slate-900">
                All Five Rounds Complete
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Your answers, HDL code submissions, and follow-up responses have been logged.
                Generate your detailed 100-mark evaluation report and personalized improvement plan.
              </p>
              <button
                type="button"
                disabled={finalizing}
                onClick={() => handleFinalize(false)}
                className="mt-6 rounded-lg bg-sky-700 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
              >
                {finalizing ? 'Generating Feedback Report...' : 'Generate Final Feedback Report'}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Active Question Focus Banner */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">
                    {session.awaitingFollowUp ? 'Follow-Up Probe' : `Question ${progressCurrent}`} ·{' '}
                    {currentQuestion.domain}
                  </span>
                  <span>{currentQuestion.subtopic}</span>
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-900 whitespace-pre-wrap">
                  {session.awaitingFollowUp && session.currentFollowUpPrompt
                    ? session.currentFollowUpPrompt
                    : currentQuestion.prompt}
                </p>
              </div>

              {/* Integrated HDL Editor Toggle + Editor */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="candidate-answer-input"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Technical Explanation &amp; Reasoning
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEditor((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:text-sky-800"
                  >
                    <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {showEditor ? 'Hide HDL Editor' : 'Open HDL Code Editor'}
                  </button>
                </div>

                {showEditor && (
                  <HdlEditor
                    code={codeValue}
                    onChange={setCodeValue}
                    language={currentQuestion.language || 'verilog'}
                    starterCode={currentQuestion.starterCode}
                  />
                )}

                <textarea
                  id="candidate-answer-input"
                  rows={showEditor ? 4 : 7}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Explain your engineering reasoning, timing assumptions, edge cases, or walkthrough clearly..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:outline-none"
                />
              </div>

              {(errorMsg || voiceNotice) && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{errorMsg || voiceNotice}</span>
                </div>
              )}

              {/* Action Controls: Voice Mic, Skip Question (with score implication), Submit Answer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={toggleVoiceMic}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 ${
                      listening
                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {listening ? (
                      <MicOff className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {listening ? 'Stop Dictation' : 'Voice Answer'}
                  </button>

                  {!confirmSkip ? (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setConfirmSkip(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                    >
                      <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
                      Skip Question
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs">
                      <span className="font-medium text-amber-900">
                        Skipping scores 0/10 &amp; logs weak topic. Confirm?
                      </span>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSkipQuestion}
                        className="font-semibold text-amber-900 underline"
                      >
                        Yes, Skip
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmSkip(false)}
                        className="text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitAnswer}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-800 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {submitting
                    ? 'Evaluating Response...'
                    : session.awaitingFollowUp
                      ? 'Submit Follow-Up'
                      : 'Submit Answer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};
