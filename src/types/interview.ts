export type CheckpointDay = 15 | 30 | 45 | 60 | 75 | 90;

export type InterviewMode = 'Beginner' | 'Technical' | 'Industry';

export type InterviewRoundNumber = 1 | 2 | 3 | 4 | 5;

export type QuestionFormat =
  | 'conceptual'
  | 'deep_dive'
  | 'coding'
  | 'output_prediction'
  | 'debugging'
  | 'scenario'
  | 'project_discussion';

export type TopicDomain =
  | 'Digital Electronics'
  | 'Sequential Circuits'
  | 'Verilog & RTL'
  | 'Synthesis & Timing'
  | 'SystemVerilog & OOP'
  | 'Constrained Random & Coverage'
  | 'Functional Verification & SVA'
  | 'UVM Architecture'
  | 'Protocols & FIFO Verification';

export type PerformanceCategory =
  | 'Excellent'
  | 'Strong'
  | 'Good'
  | 'Needs Improvement'
  | 'Relearning Required';

export type ReadinessLevel =
  | 'Beginner'
  | 'Developing'
  | 'Intermediate'
  | 'Ready to Apply for Entry-Level Positions';

export interface CurriculumModule {
  id: string;
  phaseDay: CheckpointDay;
  dayRange: string;
  title: string;
  domain: TopicDomain;
  summary: string;
  lessons: string[];
  projectTitle?: string;
  projectDescription?: string;
}

export interface CheckpointDefinition {
  checkpointNumber: 1 | 2 | 3 | 4 | 5 | 6;
  day: CheckpointDay;
  title: string;
  topicsCovered: string;
  domains: TopicDomain[];
  windowStartDay: number;
  windowEndDay: number;
  durationMinutes: number;
}

export interface InterviewQuestion {
  id: string;
  checkpointDay: CheckpointDay;
  minDay: CheckpointDay;
  domain: TopicDomain;
  subtopic: string;
  round: InterviewRoundNumber;
  format: QuestionFormat;
  modes: InterviewMode[];
  difficulty: 1 | 2 | 3;
  prompt: string;
  contextNotes: string;
  starterCode?: string;
  language?: 'verilog' | 'systemverilog';
  expectedConcepts: string[];
  idealExplanation: string;
  curriculumModuleId: string;
  practiceQuiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface RubricScores {
  conceptualUnderstanding: number; // max 25
  technicalAccuracy: number; // max 20
  practicalProblemSolving: number; // max 20
  codingAndDebugging: number; // max 20
  communicationAndExplanation: number; // max 15
}

export interface QuestionAnswerRecord {
  questionId: string;
  round: InterviewRoundNumber;
  domain: TopicDomain;
  subtopic: string;
  format: QuestionFormat;
  prompt: string;
  answerText: string;
  submittedCode?: string;
  language?: 'verilog' | 'systemverilog';
  followUpQuestion?: string;
  followUpAnswer?: string;
  skipped: boolean;
  status: 'correct' | 'partial' | 'incorrect' | 'skipped';
  scoreOutOf10: number;
  rubricBreakdown: RubricScores;
  aiFeedback: string;
  misconceptionsDetected: string[];
  idealExplanation: string;
  curriculumModuleId: string;
  hdlLintSummary?: HdlAnalysisResult;
  timeSpentSeconds: number;
}

export interface AdaptivePlanItem {
  id: string;
  topic: string;
  domain: TopicDomain;
  severity: 'critical' | 'moderate';
  actionType: 'lesson' | 'coding_challenge' | 'randomization_drill' | 'uvm_exercise';
  title: string;
  description: string;
  curriculumModuleId: string;
  relatedQuestionId: string;
  resolved: boolean;
  practiceQuizScore?: number;
  retryScore?: number;
}

export interface InterviewReport {
  id: string;
  checkpointNumber: 1 | 2 | 3 | 4 | 5 | 6;
  checkpointDay: CheckpointDay;
  mode: InterviewMode;
  isRetest: boolean;
  completedAt: string;
  durationSeconds: number;
  totalScore: number; // 0..100
  percentage: number; // 0..100
  performanceCategory: PerformanceCategory;
  rubricTotals: RubricScores;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  skippedCount: number;
  strongestTopics: string[];
  weakestTopics: string[];
  codingPerformance: string;
  debuggingPerformance: string;
  communicationAssessment: string;
  areasRequiringImprovement: string[];
  adaptivePlan: AdaptivePlanItem[];
  questionRecords: QuestionAnswerRecord[];
  readinessLevel?: ReadinessLevel; // populated on Day 90
  readinessSummary?: string;
}

export interface HdlLintIssue {
  severity: 'error' | 'warning' | 'info';
  line: number;
  rule: string;
  message: string;
}

export interface HdlAnalysisResult {
  language: 'verilog' | 'systemverilog';
  simulatorAvailable: boolean;
  executionMode: 'simulator' | 'static_analysis_plus_ai';
  syntaxValid: boolean;
  lineCount: number;
  detectedConstructs: string[];
  issues: HdlLintIssue[];
  simulatorOutput?: string;
}

export interface DialogueTurn {
  id: string;
  speaker: 'interviewer' | 'candidate' | 'system';
  text: string;
  codeSnippet?: string;
  timestamp: string;
  round?: InterviewRoundNumber;
  evaluationBadge?: 'Strong' | 'Partial' | 'Gap Detected' | 'Skipped';
}

export interface ActiveInterviewSession {
  sessionId: string;
  checkpointNumber: 1 | 2 | 3 | 4 | 5 | 6;
  checkpointDay: CheckpointDay;
  mode: InterviewMode;
  isRetest: boolean;
  startedAt: string;
  durationLimitSeconds: number;
  elapsedSeconds: number;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  awaitingFollowUp: boolean;
  currentFollowUpPrompt?: string;
  currentPrimaryAnswer?: {
    answerText: string;
    submittedCode?: string;
    timeSpentSeconds: number;
    preliminaryEvaluation: string;
  };
  records: QuestionAnswerRecord[];
  dialogue: DialogueTurn[];
}

export interface LearnerProfileState {
  learnerName: string;
  currentDay: number; // 1..90
  completedModuleIds: string[];
  completedProjectIds: string[];
  scheduledInterviews: Partial<Record<CheckpointDay, string>>;
  reports: InterviewReport[];
  weakTopics: AdaptivePlanItem[];
  askedQuestionIds: string[];
  activeSession: ActiveInterviewSession | null;
}
