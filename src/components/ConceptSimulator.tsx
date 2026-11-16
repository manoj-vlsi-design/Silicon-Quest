import React from 'react';
import { getConceptVisual } from '../data/conceptVisuals';
import { ConceptSimDigitalRtl } from './ConceptSimDigitalRtl';
import { ConceptSimVerification } from './ConceptSimVerification';

interface ConceptSimulatorProps {
  moduleId: string;
  showWalkthrough?: boolean;
}

const DIGITAL_RTL_IDS = new Set([
  'm1_number_gates',
  'm2_comb_circuits',
  'm3_fsm_intro',
  'm4_sequential_counters',
  'm5_verilog_basics',
  'm6_blocking_nonblocking',
  'm7_rtl_synthesis',
  'm8_cdc_timing',
  'm9_rtl_fifo',
]);

export const ConceptSimulator: React.FC<ConceptSimulatorProps> = ({
  moduleId,
  showWalkthrough = true,
}) => {
  const meta = getConceptVisual(moduleId);

  return (
    <div className="space-y-4" data-testid={`concept-simulator-${meta.moduleId}`}>
      <div className="space-y-1">
        <div className="text-xs font-semibold text-sky-700">{meta.domain}</div>
        <h3 className="font-display text-lg font-bold text-slate-900">{meta.simulationTitle}</h3>
        <p className="text-xs leading-relaxed text-slate-600">{meta.simulationSubtitle}</p>
      </div>

      {DIGITAL_RTL_IDS.has(meta.moduleId) ? (
        <ConceptSimDigitalRtl moduleId={meta.moduleId} />
      ) : (
        <ConceptSimVerification moduleId={meta.moduleId} />
      )}

      {showWalkthrough && meta.walkthroughSteps.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <div className="text-xs font-semibold text-slate-900">
            What to Observe in This Simulation
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
            {meta.walkthroughSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono font-semibold text-sky-700 tabular-nums">
                  {i + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
