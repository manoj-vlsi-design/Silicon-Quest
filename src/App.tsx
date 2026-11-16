import { useEffect, useState } from 'react';
import { CHECKPOINTS } from './data/curriculum';
import {
  CheckpointDay,
  InterviewMode,
  InterviewReport,
  LearnerProfileState,
} from './types/interview';
import { evaluateProgressionGate } from './utils/scoring';
import { TopNav, AppView } from './components/TopNav';
import { DashboardView } from './components/DashboardView';
import { ConceptLabView } from './components/ConceptLabView';
import { InterviewSetupModal } from './components/InterviewSetupModal';
import { InterviewSessionView } from './components/InterviewSessionView';
import { FeedbackReportView } from './components/FeedbackReportView';
import { WeakTopicsView } from './components/WeakTopicsView';
import { AnalyticsView } from './components/AnalyticsView';

export default function App() {
  const [state, setState] = useState<LearnerProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<AppView>('arena');
  const [selectedConceptModuleId, setSelectedConceptModuleId] = useState<string>('m1_number_gates');
  const [selectedReport, setSelectedReport] = useState<InterviewReport | null>(null);

  const [setupOpen, setSetupOpen] = useState(false);
  const [setupDay, setSetupDay] = useState<CheckpointDay | undefined>(undefined);
  const [startingSession, setStartingSession] = useState(false);
  const [gateWarning, setGateWarning] = useState<string | null>(null);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const resp = await fetch('/api/state');
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Failed to load profile.');
        setState(data as LearnerProfileState);
        if (data.activeSession) {
          setActiveView('session');
        }
      } catch (err: unknown) {
        setLoadError(err instanceof Error ? err.message : 'Unable to connect to server.');
      } finally {
        setLoading(false);
      }
    };
    fetchState();
  }, []);

  const persistState = async (next: LearnerProfileState) => {
    setState(next);
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
  };

  const handleUpdateDay = async (nextDay: number) => {
    if (!state) return;
    setGateWarning(null);

    if (nextDay > state.currentDay) {
      const gate = evaluateProgressionGate(state);
      // Block advancing beyond current checkpoint window if unresolved critical gaps or skipped mandatory checkpoint exist
      if (gate.blocked && nextDay > (gate.blockingCheckpointDay || state.currentDay)) {
        setGateWarning(
          gate.reason ||
            'Resolve critical weak topics or complete your current checkpoint interview before advancing.'
        );
        return;
      }

      // Check if skipping past an uncompleted checkpoint's window
      const missedCheckpoint = CHECKPOINTS.find(
        (cp) =>
          cp.day <= state.currentDay &&
          nextDay > cp.windowEndDay &&
          !state.reports.some((r) => r.checkpointDay === cp.day)
      );
      if (missedCheckpoint) {
        setGateWarning(
          `Complete mandatory Checkpoint ${missedCheckpoint.checkpointNumber} (Day ${missedCheckpoint.day}) before advancing past Day ${missedCheckpoint.windowEndDay}.`
        );
        return;
      }
    }

    await persistState({ ...state, currentDay: nextDay });
  };

  const handleToggleModule = async (moduleId: string) => {
    if (!state) return;
    const exists = state.completedModuleIds.includes(moduleId);
    const nextCompleted = exists
      ? state.completedModuleIds.filter((id) => id !== moduleId)
      : [...state.completedModuleIds, moduleId];
    await persistState({ ...state, completedModuleIds: nextCompleted });
  };

  const handleScheduleDate = async (day: CheckpointDay, dateStr: string) => {
    if (!state) return;
    await persistState({
      ...state,
      scheduledInterviews: {
        ...state.scheduledInterviews,
        [day]: dateStr,
      },
    });
  };

  const handleOpenSetup = (day?: CheckpointDay) => {
    setSetupDay(day);
    setSetupOpen(true);
  };

  const handleOpenConceptLab = (moduleId?: string) => {
    if (moduleId) {
      setSelectedConceptModuleId(moduleId);
    }
    setActiveView('concept_lab');
  };

  const handleStartInterview = async (
    checkpointDay: CheckpointDay,
    mode: InterviewMode,
    isRetest: boolean
  ) => {
    setStartingSession(true);
    try {
      const resp = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpointDay, mode, isRetest }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not start session.');
      setState(data.state);
      setSetupOpen(false);
      setActiveView('session');
    } catch (err: unknown) {
      setGateWarning(err instanceof Error ? err.message : 'Unable to start interview.');
    } finally {
      setStartingSession(false);
    }
  };

  const handleReportReady = async (reportId: string) => {
    const resp = await fetch('/api/state');
    const latest = (await resp.json()) as LearnerProfileState;
    setState(latest);
    const found = latest.reports.find((r) => r.id === reportId) || latest.reports[latest.reports.length - 1];
    if (found) {
      setSelectedReport(found);
      setActiveView('report');
    } else {
      setActiveView('arena');
    }
  };

  const handleResetDemo = async () => {
    setGateWarning(null);
    const resp = await fetch('/api/state/reset', { method: 'POST' });
    const seed = (await resp.json()) as LearnerProfileState;
    setState(seed);
    setActiveView('arena');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading Silicon Quest workspace...
      </div>
    );
  }

  if (loadError || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-rose-200 bg-white p-6 text-center">
          <h1 className="font-display text-lg font-bold text-slate-900">Connection Error</h1>
          <p className="mt-2 text-sm text-slate-600">{loadError || 'Unable to load workspace.'}</p>
        </div>
      </div>
    );
  }

  const completedDays = Array.from(
    new Set(state.reports.map((r) => r.checkpointDay))
  ) as CheckpointDay[];
  const unresolvedGapCount = state.weakTopics.filter((w) => !w.resolved).length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <TopNav
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
        }}
        hasActiveSession={Boolean(state.activeSession)}
        onPrimaryAction={() => {
          if (state.activeSession) {
            setActiveView('session');
          } else {
            handleOpenSetup();
          }
        }}
        unresolvedGapCount={unresolvedGapCount}
      />

      <div className="flex-1">
        {(activeView === 'arena' || activeView === 'curriculum') && (
          <DashboardView
            mode={activeView}
            state={state}
            onUpdateDay={handleUpdateDay}
            onToggleModule={handleToggleModule}
            onScheduleDate={handleScheduleDate}
            onOpenSetup={handleOpenSetup}
            onViewReport={(rep) => {
              setSelectedReport(rep);
              setActiveView('report');
            }}
            onNavigate={setActiveView}
            onOpenConceptLab={handleOpenConceptLab}
            onResetDemo={handleResetDemo}
            gateWarning={gateWarning}
          />
        )}

        {activeView === 'concept_lab' && (
          <ConceptLabView
            selectedModuleId={selectedConceptModuleId}
            onSelectModule={setSelectedConceptModuleId}
            completedModuleIds={state.completedModuleIds}
            onBackToCurriculum={() => setActiveView('curriculum')}
            onLaunchInterviewForDay={(day) => handleOpenSetup(day)}
          />
        )}

        {activeView === 'session' && state.activeSession && (
          <InterviewSessionView
            session={state.activeSession}
            onUpdateSessionState={(nextSession) =>
              setState((prev) => (prev ? { ...prev, activeSession: nextSession } : prev))
            }
            onReportReady={handleReportReady}
          />
        )}

        {activeView === 'report' && selectedReport && (
          <FeedbackReportView
            report={selectedReport}
            onBackToArena={() => setActiveView('arena')}
            onLaunchRetest={(day) => handleOpenSetup(day)}
            onNavigate={setActiveView}
            onOpenConceptLab={handleOpenConceptLab}
          />
        )}

        {activeView === 'weak_topics' && (
          <WeakTopicsView
            state={state}
            onStateUpdated={setState}
            onNavigateToCurriculum={() => setActiveView('curriculum')}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView
            state={state}
            onViewReport={(rep) => {
              setSelectedReport(rep);
              setActiveView('report');
            }}
          />
        )}
      </div>

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        Silicon Quest · 90-Day VLSI RTL Design &amp; Design Verification Preparation Platform
      </footer>

      <InterviewSetupModal
        isOpen={setupOpen}
        onClose={() => setSetupOpen(false)}
        currentDay={state.currentDay}
        initialCheckpointDay={setupDay}
        completedDays={completedDays}
        onStartInterview={handleStartInterview}
        starting={startingSession}
      />
    </div>
  );
}
