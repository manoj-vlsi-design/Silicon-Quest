import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateRubricScores,
  buildAdaptivePlanFromRecords,
  classifyDay90Readiness,
  classifyPerformance,
  computeConsecutiveTrend,
  evaluateProgressionGate,
  getCheckpointScoreSummary,
  selectInterviewQuestions,
} from './scoring';
import { InterviewReport, LearnerProfileState, QuestionAnswerRecord } from '../types/interview';

test('performance categories match required thresholds', () => {
  assert.equal(classifyPerformance(95), 'Excellent');
  assert.equal(classifyPerformance(90), 'Excellent');
  assert.equal(classifyPerformance(85), 'Strong');
  assert.equal(classifyPerformance(75), 'Good');
  assert.equal(classifyPerformance(65), 'Needs Improvement');
  assert.equal(classifyPerformance(59), 'Relearning Required');
});

test('Day 90 readiness classification distinguishes all 4 levels', () => {
  assert.equal(classifyDay90Readiness(88, 0), 'Ready to Apply for Entry-Level Positions');
  assert.equal(classifyDay90Readiness(88, 1), 'Intermediate');
  assert.equal(classifyDay90Readiness(74, 0), 'Intermediate');
  assert.equal(classifyDay90Readiness(60, 0), 'Developing');
  assert.equal(classifyDay90Readiness(45, 2), 'Beginner');
});

test('syllabus scoping strictly excludes UVM from Day 15 and Day 30 interviews', () => {
  const day15Qs = selectInterviewQuestions(15, 'Technical', []);
  assert.ok(day15Qs.length >= 5);
  assert.ok(day15Qs.every((q) => q.minDay <= 15 && q.domain === 'Digital Electronics'));

  const day30Qs = selectInterviewQuestions(30, 'Industry', day15Qs.map((q) => q.id));
  assert.ok(day30Qs.every((q) => q.minDay <= 30));
  assert.ok(!day30Qs.some((q) => q.domain === 'UVM Architecture'));
  // Avoids repetition with day15Qs
  assert.ok(day30Qs.every((q) => !day15Qs.some((d15) => d15.id === q.id)));
});

test('rubric aggregation sums exact 25/20/20/20/15 weights to 100', () => {
  const perfectRecord: QuestionAnswerRecord = {
    questionId: 'q1',
    round: 1,
    domain: 'Digital Electronics',
    subtopic: 'Two’s Complement',
    format: 'conceptual',
    prompt: 'Prompt',
    answerText: 'Answer',
    skipped: false,
    status: 'correct',
    scoreOutOf10: 10,
    rubricBreakdown: {
      conceptualUnderstanding: 25,
      technicalAccuracy: 20,
      practicalProblemSolving: 20,
      codingAndDebugging: 20,
      communicationAndExplanation: 15,
    },
    aiFeedback: 'Strong',
    misconceptionsDetected: [],
    idealExplanation: 'Ideal',
    curriculumModuleId: 'm1_number_gates',
    timeSpentSeconds: 60,
  };
  const agg = aggregateRubricScores([perfectRecord]);
  assert.equal(agg.totalScore, 100);
  assert.equal(agg.performanceCategory, 'Excellent');
});

test('adaptive plan builds targeted remediation and progression gate blocks unresolved critical gaps', () => {
  const failedRec: QuestionAnswerRecord = {
    questionId: 'q30_r2_blocking_nonblocking',
    round: 2,
    domain: 'Verilog & RTL',
    subtopic: 'Blocking (=) vs Non-Blocking (<=) Assignments',
    format: 'deep_dive',
    prompt: 'Prompt',
    answerText: 'Wrong',
    skipped: false,
    status: 'incorrect',
    scoreOutOf10: 3,
    rubricBreakdown: {
      conceptualUnderstanding: 7,
      technicalAccuracy: 6,
      practicalProblemSolving: 6,
      codingAndDebugging: 6,
      communicationAndExplanation: 5,
    },
    aiFeedback: 'Confused blocking and non-blocking.',
    misconceptionsDetected: ['Thought <= executes immediately in Active region'],
    idealExplanation: 'NBA region updates.',
    curriculumModuleId: 'm6_blocking_nonblocking',
    timeSpentSeconds: 90,
  };

  const plan = buildAdaptivePlanFromRecords([failedRec]);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].severity, 'critical');

  const state: LearnerProfileState = {
    learnerName: 'Test',
    currentDay: 30,
    completedModuleIds: [],
    completedProjectIds: [],
    scheduledInterviews: {},
    reports: [
      {
        id: 'r0',
        checkpointNumber: 1,
        checkpointDay: 15,
        mode: 'Technical',
        isRetest: false,
        completedAt: '2026-10-15T10:00:00Z',
        durationSeconds: 900,
        totalScore: 84,
        percentage: 84,
        performanceCategory: 'Strong',
        rubricTotals: {
          conceptualUnderstanding: 21,
          technicalAccuracy: 17,
          practicalProblemSolving: 17,
          codingAndDebugging: 17,
          communicationAndExplanation: 12,
        },
        correctCount: 8,
        partialCount: 2,
        incorrectCount: 0,
        skippedCount: 0,
        strongestTopics: ['Number Systems'],
        weakestTopics: [],
        codingPerformance: 'Strong',
        debuggingPerformance: 'Strong',
        communicationAssessment: 'Clear',
        areasRequiringImprovement: [],
        adaptivePlan: [],
        questionRecords: [],
      },
      {
        id: 'r1',
        checkpointNumber: 2,
        checkpointDay: 30,
        mode: 'Technical',
        isRetest: false,
        completedAt: '2026-11-01T10:00:00Z',
        durationSeconds: 900,
        totalScore: 52,
        percentage: 52,
        performanceCategory: 'Relearning Required',
        rubricTotals: failedRec.rubricBreakdown,
        correctCount: 2,
        partialCount: 2,
        incorrectCount: 5,
        skippedCount: 1,
        strongestTopics: [],
        weakestTopics: ['Blocking (=) vs Non-Blocking (<=) Assignments'],
        codingPerformance: 'Needs work',
        debuggingPerformance: 'Needs work',
        communicationAssessment: 'Fair',
        areasRequiringImprovement: ['Blocking vs non-blocking'],
        adaptivePlan: plan,
        questionRecords: [failedRec],
      },
    ],
    weakTopics: plan,
    askedQuestionIds: [],
    activeSession: null,
  };

  const gate = evaluateProgressionGate(state);
  assert.equal(gate.blocked, true);
  assert.equal(gate.blockingCheckpointDay, 30);
});

test('original score is preserved separately from retest score and consecutive trend computes delta', () => {
  const makeReport = (id: string, day: 15 | 30, score: number, isRetest: boolean, date: string): InterviewReport => ({
    id,
    checkpointNumber: day === 15 ? 1 : 2,
    checkpointDay: day,
    mode: 'Technical',
    isRetest,
    completedAt: date,
    durationSeconds: 1200,
    totalScore: score,
    percentage: score,
    performanceCategory: classifyPerformance(score),
    rubricTotals: {
      conceptualUnderstanding: 20,
      technicalAccuracy: 16,
      practicalProblemSolving: 16,
      codingAndDebugging: 16,
      communicationAndExplanation: 12,
    },
    correctCount: 7,
    partialCount: 2,
    incorrectCount: 1,
    skippedCount: 0,
    strongestTopics: ['Gates'],
    weakestTopics: [],
    codingPerformance: 'Good',
    debuggingPerformance: 'Good',
    communicationAssessment: 'Clear',
    areasRequiringImprovement: [],
    adaptivePlan: [],
    questionRecords: [],
  });

  const reports = [
    makeReport('r1', 15, 64, false, '2026-10-15T10:00:00Z'),
    makeReport('r1_re', 15, 86, true, '2026-10-16T10:00:00Z'),
    makeReport('r2', 30, 81, false, '2026-10-30T10:00:00Z'),
  ];

  const summary = getCheckpointScoreSummary(reports, 15);
  assert.equal(summary.originalReport?.totalScore, 64);
  assert.equal(summary.latestRetestReport?.totalScore, 86);
  assert.equal(summary.bestScore, 86);

  const trend = computeConsecutiveTrend(reports);
  assert.equal(trend.direction, 'improving');
  assert.equal(trend.delta, 17); // Day 15 original (64) -> Day 30 original (81)
});
