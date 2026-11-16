import { CHECKPOINTS, CURRICULUM_MODULES } from '../data/curriculum';
import { QUESTION_BANK } from '../data/questionBank';
import {
  AdaptivePlanItem,
  CheckpointDay,
  InterviewMode,
  InterviewQuestion,
  InterviewReport,
  InterviewRoundNumber,
  LearnerProfileState,
  PerformanceCategory,
  QuestionAnswerRecord,
  ReadinessLevel,
  RubricScores,
} from '../types/interview';

export const RUBRIC_MAX: RubricScores = {
  conceptualUnderstanding: 25,
  technicalAccuracy: 20,
  practicalProblemSolving: 20,
  codingAndDebugging: 20,
  communicationAndExplanation: 15,
};

export function classifyPerformance(score: number): PerformanceCategory {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Strong';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Needs Improvement';
  return 'Relearning Required';
}

export function classifyDay90Readiness(
  day90Score: number,
  unresolvedCriticalGaps: number
): ReadinessLevel {
  if (day90Score >= 82 && unresolvedCriticalGaps === 0) {
    return 'Ready to Apply for Entry-Level Positions';
  }
  if (day90Score >= 70) {
    return 'Intermediate';
  }
  if (day90Score >= 55) {
    return 'Developing';
  }
  return 'Beginner';
}

/**
 * Aggregates question-level rubric records into the 100-mark weighted evaluation rubric:
 * Conceptual Understanding (25), Technical Accuracy (20), Practical Problem Solving (20),
 * Coding & Debugging (20), Communication & Explanation (15).
 */
export function aggregateRubricScores(records: QuestionAnswerRecord[]): {
  rubricTotals: RubricScores;
  totalScore: number;
  percentage: number;
  performanceCategory: PerformanceCategory;
} {
  if (records.length === 0) {
    return {
      rubricTotals: {
        conceptualUnderstanding: 0,
        technicalAccuracy: 0,
        practicalProblemSolving: 0,
        codingAndDebugging: 0,
        communicationAndExplanation: 0,
      },
      totalScore: 0,
      percentage: 0,
      performanceCategory: 'Relearning Required',
    };
  }

  const sums = records.reduce<RubricScores>(
    (acc, rec) => {
      acc.conceptualUnderstanding += rec.rubricBreakdown.conceptualUnderstanding;
      acc.technicalAccuracy += rec.rubricBreakdown.technicalAccuracy;
      acc.practicalProblemSolving += rec.rubricBreakdown.practicalProblemSolving;
      acc.codingAndDebugging += rec.rubricBreakdown.codingAndDebugging;
      acc.communicationAndExplanation += rec.rubricBreakdown.communicationAndExplanation;
      return acc;
    },
    {
      conceptualUnderstanding: 0,
      technicalAccuracy: 0,
      practicalProblemSolving: 0,
      codingAndDebugging: 0,
      communicationAndExplanation: 0,
    }
  );

  const count = records.length;
  const rubricTotals: RubricScores = {
    conceptualUnderstanding: Math.min(25, Math.round((sums.conceptualUnderstanding / count) * 10) / 10),
    technicalAccuracy: Math.min(20, Math.round((sums.technicalAccuracy / count) * 10) / 10),
    practicalProblemSolving: Math.min(20, Math.round((sums.practicalProblemSolving / count) * 10) / 10),
    codingAndDebugging: Math.min(20, Math.round((sums.codingAndDebugging / count) * 10) / 10),
    communicationAndExplanation: Math.min(15, Math.round((sums.communicationAndExplanation / count) * 10) / 10),
  };

  const rawTotal =
    rubricTotals.conceptualUnderstanding +
    rubricTotals.technicalAccuracy +
    rubricTotals.practicalProblemSolving +
    rubricTotals.codingAndDebugging +
    rubricTotals.communicationAndExplanation;

  const totalScore = Math.max(0, Math.min(100, Math.round(rawTotal)));
  return {
    rubricTotals,
    totalScore,
    percentage: totalScore,
    performanceCategory: classifyPerformance(totalScore),
  };
}

/**
 * Selects non-repetitive, syllabus-scoped questions across Rounds 1-5 for a checkpoint.
 */
export function selectInterviewQuestions(
  checkpointDay: CheckpointDay,
  mode: InterviewMode,
  previouslyAskedIds: string[],
  bank: InterviewQuestion[] = QUESTION_BANK
): InterviewQuestion[] {
  const checkpoint = CHECKPOINTS.find((c) => c.day === checkpointDay);
  if (!checkpoint) return [];

  // Strict syllabus boundary: only questions whose minDay <= checkpointDay and domain is in checkpoint domains
  const syllabusScoped = bank.filter(
    (q) => q.minDay <= checkpointDay && checkpoint.domains.includes(q.domain)
  );

  const selected: InterviewQuestion[] = [];
  const rounds: InterviewRoundNumber[] = [1, 2, 3, 4, 5];

  for (const round of rounds) {
    const roundCandidates = syllabusScoped.filter((q) => q.round === round);

    // Prioritize: (1) not previously asked, (2) exact checkpointDay match, (3) mode match
    const scored = [...roundCandidates].sort((a, b) => {
      const aFresh = previouslyAskedIds.includes(a.id) ? 0 : 1;
      const bFresh = previouslyAskedIds.includes(b.id) ? 0 : 1;
      if (aFresh !== bFresh) return bFresh - aFresh;

      const aExact = a.checkpointDay === checkpointDay ? 1 : 0;
      const bExact = b.checkpointDay === checkpointDay ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      const aMode = a.modes.includes(mode) ? 1 : 0;
      const bMode = b.modes.includes(mode) ? 1 : 0;
      if (aMode !== bMode) return bMode - aMode;

      return a.difficulty - b.difficulty;
    });

    // Pick up to 2 questions per round (total 10 questions across 5 rounds -> ~35-45 min)
    for (const candidate of scored) {
      if (selected.filter((q) => q.round === round).length >= 2) break;
      if (!selected.some((q) => q.id === candidate.id)) {
        selected.push(candidate);
      }
    }
  }

  return selected;
}

export function buildAdaptivePlanFromRecords(
  records: QuestionAnswerRecord[]
): AdaptivePlanItem[] {
  const items: AdaptivePlanItem[] = [];

  for (const rec of records) {
    if (rec.status === 'correct' && rec.scoreOutOf10 >= 7) continue;

    const severity: 'critical' | 'moderate' =
      rec.skipped || rec.status === 'incorrect' || rec.scoreOutOf10 < 5
        ? 'critical'
        : 'moderate';

    const mod = CURRICULUM_MODULES.find((m) => m.id === rec.curriculumModuleId);

    let actionType: AdaptivePlanItem['actionType'] = 'lesson';
    let title = `Review ${rec.subtopic}`;

    if (rec.domain === 'Constrained Random & Coverage') {
      actionType = 'randomization_drill';
      title = `Randomization & Coverage Drill: ${rec.subtopic}`;
    } else if (rec.domain === 'UVM Architecture') {
      actionType = 'uvm_exercise';
      title = `UVM Component Exercise: ${rec.subtopic}`;
    } else if (rec.format === 'coding' || rec.format === 'debugging') {
      actionType = 'coding_challenge';
      title = `RTL/SV Coding Challenge: ${rec.subtopic}`;
    } else if (mod) {
      title = `Revisit Lesson: ${mod.title}`;
    }

    items.push({
      id: `gap_${rec.questionId}`,
      topic: rec.subtopic,
      domain: rec.domain,
      severity,
      actionType,
      title,
      description:
        rec.misconceptionsDetected.length > 0
          ? rec.misconceptionsDetected[0]
          : `Score ${rec.scoreOutOf10}/10 on ${rec.subtopic}. Review core concepts and complete the targeted drill.`,
      curriculumModuleId: rec.curriculumModuleId,
      relatedQuestionId: rec.questionId,
      resolved: false,
    });
  }

  return items;
}

/**
 * Checks whether the learner has unresolved major knowledge gaps blocking progression
 * beyond a completed/active checkpoint.
 */
export function evaluateProgressionGate(state: LearnerProfileState): {
  blocked: boolean;
  blockingCheckpointDay?: CheckpointDay;
  reason?: string;
  unresolvedCriticalCount: number;
} {
  const unresolvedCritical = state.weakTopics.filter(
    (w) => !w.resolved && w.severity === 'critical'
  );

  // Check if any checkpoint <= currentDay had a failing original+retest score (< 65) or >= 2 unresolved critical gaps
  for (const cp of CHECKPOINTS) {
    if (cp.day > state.currentDay) continue;
    const cpReports = state.reports.filter((r) => r.checkpointDay === cp.day);
    if (cpReports.length === 0) {
      // Mandatory checkpoint reached without completion if trying to move past its window end
      if (state.currentDay > cp.windowEndDay) {
        return {
          blocked: true,
          blockingCheckpointDay: cp.day,
          reason: `Mandatory Checkpoint ${cp.checkpointNumber} (Day ${cp.day}) must be completed before advancing past Day ${cp.windowEndDay}.`,
          unresolvedCriticalCount: unresolvedCritical.length,
        };
      }
      continue;
    }

    const bestScore = Math.max(...cpReports.map((r) => r.totalScore));
    if (bestScore < 65 && unresolvedCritical.length > 0) {
      return {
        blocked: true,
        blockingCheckpointDay: cp.day,
        reason: `Score on Day ${cp.day} (${bestScore}/100) is below the 65-mark threshold with ${unresolvedCritical.length} unresolved critical gap(s). Resolve weak topics or pass a re-interview to advance.`,
        unresolvedCriticalCount: unresolvedCritical.length,
      };
    }
  }

  if (unresolvedCritical.length >= 3) {
    return {
      blocked: true,
      reason: `${unresolvedCritical.length} unresolved critical weak topics detected. Complete targeted drills in Weak Topics before moving to the next phase.`,
      unresolvedCriticalCount: unresolvedCritical.length,
    };
  }

  return {
    blocked: false,
    unresolvedCriticalCount: unresolvedCritical.length,
  };
}

export function isCheckpointUnlocked(
  checkpointDay: CheckpointDay,
  currentDay: number
): boolean {
  const cp = CHECKPOINTS.find((c) => c.day === checkpointDay);
  if (!cp) return false;
  return currentDay >= cp.windowStartDay;
}

export function getCheckpointScoreSummary(
  reports: InterviewReport[],
  checkpointDay: CheckpointDay
): {
  originalReport?: InterviewReport;
  latestRetestReport?: InterviewReport;
  bestScore?: number;
} {
  const cpReports = reports
    .filter((r) => r.checkpointDay === checkpointDay)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

  const originalReport = cpReports.find((r) => !r.isRetest) ?? cpReports[0];
  const retests = cpReports.filter((r) => r.isRetest);
  const latestRetestReport = retests.length > 0 ? retests[retests.length - 1] : undefined;
  const bestScore = cpReports.length > 0 ? Math.max(...cpReports.map((r) => r.totalScore)) : undefined;

  return { originalReport, latestRetestReport, bestScore };
}

export function computeConsecutiveTrend(reports: InterviewReport[]): {
  delta: number | null;
  direction: 'improving' | 'declining' | 'steady' | 'insufficient';
  summaryText: string;
} {
  // Compare original scores across checkpoints ordered by checkpointDay
  const checkpointOriginals = CHECKPOINTS.map((cp) => {
    const { originalReport } = getCheckpointScoreSummary(reports, cp.day);
    return originalReport ? { day: cp.day, score: originalReport.totalScore } : null;
  }).filter((item): item is { day: CheckpointDay; score: number } => item !== null);

  if (checkpointOriginals.length < 2) {
    return {
      delta: null,
      direction: 'insufficient',
      summaryText: 'Complete at least two checkpoints to track consecutive interview progression.',
    };
  }

  const prev = checkpointOriginals[checkpointOriginals.length - 2];
  const curr = checkpointOriginals[checkpointOriginals.length - 1];
  const delta = curr.score - prev.score;

  if (delta > 2) {
    return {
      delta,
      direction: 'improving',
      summaryText: `+${delta} pts improvement from Day ${prev.day} (${prev.score}) to Day ${curr.day} (${curr.score}).`,
    };
  }
  if (delta < -2) {
    return {
      delta,
      direction: 'declining',
      summaryText: `${delta} pts change from Day ${prev.day} (${prev.score}) to Day ${curr.day} (${curr.score}) — focus on weak topic remediation.`,
    };
  }
  return {
    delta,
    direction: 'steady',
    summaryText: `Consistent performance (${curr.score} vs ${prev.score}) between Day ${prev.day} and Day ${curr.day}.`,
  };
}
