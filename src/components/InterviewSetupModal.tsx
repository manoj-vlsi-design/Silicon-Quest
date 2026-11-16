import React, { useState } from 'react';
import { X, Clock, ShieldCheck, Layers } from 'lucide-react';
import { CHECKPOINTS } from '../data/curriculum';
import { CheckpointDay, InterviewMode } from '../types/interview';
import { isCheckpointUnlocked } from '../utils/scoring';

interface InterviewSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDay: number;
  initialCheckpointDay?: CheckpointDay;
  completedDays: CheckpointDay[];
  onStartInterview: (checkpointDay: CheckpointDay, mode: InterviewMode, isRetest: boolean) => void;
  starting: boolean;
}

export const InterviewSetupModal: React.FC<InterviewSetupModalProps> = ({
  isOpen,
  onClose,
  currentDay,
  initialCheckpointDay,
  completedDays,
  onStartInterview,
  starting,
}) => {
  const defaultDay: CheckpointDay =
    initialCheckpointDay ??
    CHECKPOINTS.slice()
      .reverse()
      .find((c) => isCheckpointUnlocked(c.day, currentDay))?.day ??
    15;

  const [selectedDay, setSelectedDay] = useState<CheckpointDay>(defaultDay);
  const [selectedMode, setSelectedMode] = useState<InterviewMode>('Technical');

  if (!isOpen) return null;

  const activeCp = CHECKPOINTS.find((c) => c.day === selectedDay) ?? CHECKPOINTS[0];
  const unlocked = isCheckpointUnlocked(selectedDay, currentDay);
  const alreadyCompleted = completedDays.includes(selectedDay);

  const modes: Array<{
    id: InterviewMode;
    title: string;
    desc: string;
  }> = [
    {
      id: 'Beginner',
      title: 'Beginner Interview',
      desc: 'Core definitions, circuit intuition, and guided conceptual checks.',
    },
    {
      id: 'Technical',
      title: 'Technical Interview',
      desc: 'Detailed RTL/SV engineering depth, HDL coding, and bug diagnosis.',
    },
    {
      id: 'Industry',
      title: 'Industry Interview',
      desc: 'Production silicon scenarios, CDC/timing trade-offs, and aggressive follow-ups.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="setup-modal-title" className="font-display text-lg font-bold text-slate-900">
              Configure Mock Technical Interview
            </h2>
            <p className="text-xs text-slate-500">
              Select an unlocked 15-day checkpoint and interviewer difficulty mode.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close interview setup"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Checkpoint Selection */}
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-700">
              Assessment Checkpoint (Syllabus-Scoped)
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {CHECKPOINTS.map((cp) => {
                const cpUnlocked = isCheckpointUnlocked(cp.day, currentDay);
                const cpDone = completedDays.includes(cp.day);
                const isSelected = selectedDay === cp.day;
                return (
                  <button
                    key={cp.day}
                    type="button"
                    disabled={!cpUnlocked}
                    onClick={() => setSelectedDay(cp.day)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/70 text-slate-900'
                        : cpUnlocked
                          ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold tabular-nums">
                      <span>Day {cp.day}</span>
                      <span className="text-[11px] font-medium">
                        {!cpUnlocked ? 'Locked' : cpDone ? 'Retest' : 'Unlocked'}
                      </span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-600">{cp.topicsCovered}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interview Mode Selection */}
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-700">
              Interviewer Mode
            </label>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {modes.map((m) => {
                const isSelected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMode(m.id)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/70'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Summary */}
          <div className="flex flex-wrap items-center gap-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-sky-700" aria-hidden="true" />
              <span className="tabular-nums font-medium text-slate-800">
                {activeCp.durationMinutes} min session
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-sky-700" aria-hidden="true" />
              <span>5 Rounds · 10 Questions + Dynamic Follow-Ups</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <span>
                {alreadyCompleted
                  ? 'Retest mode (original score preserved)'
                  : 'Primary checkpoint attempt'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!unlocked || starting}
            onClick={() => onStartInterview(selectedDay, selectedMode, alreadyCompleted)}
            className="rounded-lg bg-sky-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-800 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {starting
              ? 'Preparing Interviewer...'
              : alreadyCompleted
                ? `Start Day ${selectedDay} Re-Interview`
                : `Begin Day ${selectedDay} Interview`}
          </button>
        </div>
      </div>
    </div>
  );
};
