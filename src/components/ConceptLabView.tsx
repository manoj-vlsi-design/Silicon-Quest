import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, PlayCircle } from 'lucide-react';
import { CHECKPOINTS, CURRICULUM_MODULES } from '../data/curriculum';
import { getConceptVisual } from '../data/conceptVisuals';
import { CheckpointDay } from '../types/interview';
import { ConceptImageFrame } from './ConceptImageFrame';
import { ConceptSimulator } from './ConceptSimulator';

interface ConceptLabViewProps {
  selectedModuleId: string;
  onSelectModule: (moduleId: string) => void;
  completedModuleIds: string[];
  onBackToCurriculum: () => void;
  onLaunchInterviewForDay: (day: CheckpointDay) => void;
}

export const ConceptLabView: React.FC<ConceptLabViewProps> = ({
  selectedModuleId,
  onSelectModule,
  completedModuleIds,
  onBackToCurriculum,
  onLaunchInterviewForDay,
}) => {
  const [phaseFilter, setPhaseFilter] = useState<'all' | CheckpointDay>('all');

  const activeModule =
    CURRICULUM_MODULES.find((m) => m.id === selectedModuleId) || CURRICULUM_MODULES[0];
  const activeVisual = getConceptVisual(activeModule.id);

  const visibleModules = CURRICULUM_MODULES.filter((m) =>
    phaseFilter === 'all' ? true : m.phaseDay === phaseFilter
  );

  const currentIdx = CURRICULUM_MODULES.findIndex((m) => m.id === activeModule.id);
  const prevMod = currentIdx > 0 ? CURRICULUM_MODULES[currentIdx - 1] : null;
  const nextMod =
    currentIdx >= 0 && currentIdx < CURRICULUM_MODULES.length - 1
      ? CURRICULUM_MODULES[currentIdx + 1]
      : null;

  return (
    <main className="mx-auto max-w-[1440px] space-y-8 px-6 py-8">
      {/* Header & Phase Filter */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <button
            type="button"
            onClick={onBackToCurriculum}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to 90-Day Curriculum
          </button>
          <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">
            Visual Concept Lab &amp; Hardware Simulators
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Explore every RTL Design and Verification concept across Days 1–90 with interactive
            waveform/circuit simulations and architectural silicon visuals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setPhaseFilter('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              phaseFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All (18)
          </button>
          {CHECKPOINTS.map((cp) => (
            <button
              key={cp.day}
              type="button"
              onClick={() => {
                setPhaseFilter(cp.day);
                const firstInPhase = CURRICULUM_MODULES.find((m) => m.phaseDay === cp.day);
                if (firstInPhase) onSelectModule(firstInPhase.id);
              }}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-colors tabular-nums ${
                phaseFilter === cp.day
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day {cp.day}
            </button>
          ))}
        </div>
      </div>

      {/* Two-Zone Sandbox Layout: Selector Rail + Cinematic Visual & Interactive Stage */}
      <section className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Concept Directory */}
        <aside className="space-y-2 lg:col-span-4">
          <div className="text-xs font-semibold text-slate-500">
            Select Concept ({visibleModules.length} shown)
          </div>
          <div className="max-h-[760px] space-y-2 overflow-y-auto pr-1 studio-scroll">
            {visibleModules.map((mod) => {
              const isActive = mod.id === activeModule.id;
              const isDone = completedModuleIds.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => onSelectModule(mod.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                    isActive
                      ? 'border-sky-600 bg-sky-50/70'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono font-semibold tabular-nums">{mod.dayRange}</span>
                    <span className="flex items-center gap-1">
                      {isDone && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
                      )}
                      <span>{mod.domain}</span>
                    </span>
                  </div>
                  <div className="mt-1 font-display text-sm font-bold text-slate-900">
                    {mod.title}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Primary Visual & Interactive Stage */}
        <div className="space-y-6 lg:col-span-8">
          <ConceptImageFrame
            src={activeVisual.imageUrl}
            alt={activeVisual.imageAlt}
            kicker={`${activeModule.dayRange} · ${activeModule.domain} · Phase Target Day ${activeModule.phaseDay}`}
            caption={`${activeModule.title} — ${activeVisual.visualCaption}`}
            invariant={activeVisual.keyInvariant}
            heightClass="h-56 sm:h-72"
          />

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    Concept Breakdown
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    {activeModule.summary}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchInterviewForDay(activeModule.phaseDay)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 whitespace-nowrap shrink-0"
                >
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  Practice Day {activeModule.phaseDay} Interview
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs">
                {activeModule.lessons.map((lesson, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 font-medium text-slate-700"
                  >
                    {lesson}
                  </div>
                ))}
              </div>
            </div>

            <ConceptSimulator moduleId={activeModule.id} />

            {/* Previous / Next Concept Stepper */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <button
                type="button"
                disabled={!prevMod}
                onClick={() => prevMod && onSelectModule(prevMod.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                {prevMod ? `Prev: ${prevMod.dayRange}` : 'Start of Curriculum'}
              </button>

              <span className="font-mono text-xs text-slate-500 tabular-nums">
                Concept {currentIdx + 1} / {CURRICULUM_MODULES.length}
              </span>

              <button
                type="button"
                disabled={!nextMod}
                onClick={() => nextMod && onSelectModule(nextMod.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                {nextMod ? `Next: ${nextMod.dayRange}` : 'End of Curriculum'}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
