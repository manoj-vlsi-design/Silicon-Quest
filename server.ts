import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { CHECKPOINTS, CURRICULUM_MODULES } from './src/data/curriculum';
import { QUESTION_BANK } from './src/data/questionBank';
import { createInitialSeedState } from './src/data/seedState';
import { analyzeHdlCode } from './src/utils/hdlAnalyzer';
import {
  aggregateRubricScores,
  buildAdaptivePlanFromRecords,
  classifyDay90Readiness,
  selectInterviewQuestions,
} from './src/utils/scoring';
import {
  ActiveInterviewSession,
  CheckpointDay,
  InterviewMode,
  InterviewReport,
  LearnerProfileState,
  QuestionAnswerRecord,
} from './src/types/interview';

const execFileAsync = promisify(execFile);

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'silicon-quest-state.json');

let simulatorAvailable = false;

async function probeSimulator(): Promise<void> {
  try {
    await execFileAsync('which', ['iverilog']);
    simulatorAvailable = true;
  } catch {
    simulatorAvailable = false;
  }
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in the environment. Add it in Settings > Secrets to run live AI interview evaluations.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      return `AI service temporarily busy: ${parsed.error.message}`;
    }
  } catch {
    // not JSON
  }
  if (raw.includes('503') || raw.includes('UNAVAILABLE')) {
    return 'AI interviewer service is temporarily experiencing high demand. Please retry in a moment.';
  }
  return raw;
}

async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: string;
    responseSchema: Record<string, unknown>;
  }
) {
  const modelsToTry = ['gemini-4-hydrogen', 'gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;
  let lastError: unknown;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const config =
        model === 'gemini-4-hydrogen'
          ? {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: params.responseSchema,
            }
          : {
              responseMimeType: 'application/json',
              responseSchema: params.responseSchema,
            };

      return await ai.models.generateContent({
        model,
        contents: params.contents,
        config,
      });
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
      if (!isTransient) break;
      await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }

  throw new Error(formatGeminiError(lastError));
}

function loadState(): LearnerProfileState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STATE_FILE)) {
      const seed = createInitialSeedState();
      fs.writeFileSync(STATE_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw) as LearnerProfileState;
  } catch {
    return createInitialSeedState();
  }
}

function saveState(state: LearnerProfileState): LearnerProfileState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  return state;
}

async function runRealIcarusCheck(code: string, language: 'verilog' | 'systemverilog'): Promise<{
  compiled: boolean;
  output: string;
}> {
  const tmpDir = path.join(DATA_DIR, 'tmp_hdl');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const ext = language === 'systemverilog' ? 'sv' : 'v';
  const filePath = path.join(tmpDir, `submission_${Date.now()}.${ext}`);
  const outPath = path.join(tmpDir, `sim_${Date.now()}.vvp`);
  fs.writeFileSync(filePath, code, 'utf-8');
  try {
    const args = language === 'systemverilog' ? ['-g2012', '-o', outPath, filePath] : ['-o', outPath, filePath];
    const { stdout, stderr } = await execFileAsync('iverilog', args, { timeout: 5000 });
    return {
      compiled: true,
      output: [stdout, stderr].filter(Boolean).join('\n') || 'Compiled cleanly with Icarus Verilog.',
    };
  } catch (err: unknown) {
    const e = err as { stderr?: string; message?: string };
    return {
      compiled: false,
      output: e.stderr || e.message || 'Compilation failed.',
    };
  } finally {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  }
}

async function startServer() {
  await probeSimulator();

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, simulatorAvailable });
  });

  app.get('/api/hdl/capabilities', (_req, res) => {
    res.json({
      simulatorAvailable,
      engine: simulatorAvailable ? 'Icarus Verilog (iverilog)' : 'Static HDL Lint + AI Semantic Review',
    });
  });

  app.post('/api/hdl/check', async (req, res) => {
    try {
      const { code, language } = req.body as {
        code: string;
        language: 'verilog' | 'systemverilog';
      };
      const analysis = analyzeHdlCode(code || '', language || 'verilog', simulatorAvailable);
      if (simulatorAvailable && (code || '').trim().length > 0) {
        const sim = await runRealIcarusCheck(code, language || 'verilog');
        analysis.simulatorOutput = sim.output;
        if (!sim.compiled) {
          analysis.syntaxValid = false;
          analysis.issues.unshift({
            severity: 'error',
            line: 1,
            rule: 'iverilog-compile',
            message: sim.output.trim(),
          });
        }
      }
      res.json(analysis);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze HDL code.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/state', (_req, res) => {
    res.json(loadState());
  });

  app.post('/api/state', (req, res) => {
    try {
      const nextState = req.body as LearnerProfileState;
      const saved = saveState(nextState);
      res.json(saved);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save state.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/state/reset', (_req, res) => {
    const seed = saveState(createInitialSeedState());
    res.json(seed);
  });

  // Start a new mock interview session
  app.post('/api/interview/start', async (req, res) => {
    try {
      const { checkpointDay, mode, isRetest } = req.body as {
        checkpointDay: CheckpointDay;
        mode: InterviewMode;
        isRetest: boolean;
      };

      const state = loadState();
      const cp = CHECKPOINTS.find((c) => c.day === checkpointDay);
      if (!cp) {
        res.status(400).json({ error: 'Invalid checkpoint day.' });
        return;
      }

      const questions = selectInterviewQuestions(
        checkpointDay,
        mode,
        state.askedQuestionIds,
        QUESTION_BANK
      );

      if (questions.length === 0) {
        res.status(400).json({ error: 'No questions available for this checkpoint.' });
        return;
      }

      const completedProjects = CURRICULUM_MODULES.filter(
        (m) => m.projectTitle && state.completedModuleIds.includes(m.id)
      ).map((m) => m.projectTitle);

      const firstQ = questions[0];
      const session: ActiveInterviewSession = {
        sessionId: `sess_${Date.now()}`,
        checkpointNumber: cp.checkpointNumber,
        checkpointDay,
        mode,
        isRetest: Boolean(isRetest),
        startedAt: new Date().toISOString(),
        durationLimitSeconds: cp.durationMinutes * 60,
        elapsedSeconds: 0,
        questions,
        currentQuestionIndex: 0,
        awaitingFollowUp: false,
        records: [],
        dialogue: [
          {
            id: `dlg_intro_${Date.now()}`,
            speaker: 'interviewer',
            text: `Welcome to Checkpoint ${cp.checkpointNumber} (Day ${cp.day}) — ${cp.title} in ${mode} mode. We will progress through 5 structured rounds covering ${cp.topicsCovered}${completedProjects.length > 0 ? `, including your completed project work (${completedProjects.slice(-1)[0]})` : ''}. Take your time to reason clearly—I will evaluate each response before moving forward. Let’s begin Round 1: Technical Fundamentals.`,
            timestamp: new Date().toISOString(),
            round: 1,
          },
          {
            id: `dlg_q0_${Date.now() + 1}`,
            speaker: 'interviewer',
            text: firstQ.prompt,
            timestamp: new Date().toISOString(),
            round: firstQ.round,
          },
        ],
      };

      state.activeSession = session;
      saveState(state);
      res.json({ session, state });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to start interview.';
      res.status(500).json({ error: message });
    }
  });

  // Evaluate candidate response using Gemini + static HDL check
  app.post('/api/interview/evaluate-answer', async (req, res) => {
    try {
      const {
        answerText,
        submittedCode,
        skipped,
        timeSpentSeconds,
        elapsedSeconds,
      } = req.body as {
        answerText: string;
        submittedCode?: string;
        skipped?: boolean;
        timeSpentSeconds: number;
        elapsedSeconds: number;
      };

      const state = loadState();
      const session = state.activeSession;
      if (!session) {
        res.status(400).json({ error: 'No active interview session found.' });
        return;
      }

      const currentQ = session.questions[session.currentQuestionIndex];
      if (!currentQ) {
        res.status(400).json({ error: 'Current question index is out of bounds.' });
        return;
      }

      session.elapsedSeconds = elapsedSeconds;

      // Handle explicit skip
      if (skipped) {
        const skippedRecord: QuestionAnswerRecord = {
          questionId: currentQ.id,
          round: currentQ.round,
          domain: currentQ.domain,
          subtopic: currentQ.subtopic,
          format: currentQ.format,
          prompt: currentQ.prompt,
          answerText: session.awaitingFollowUp
            ? `${session.currentPrimaryAnswer?.answerText || ''}\n[Follow-up skipped]`
            : '[Question skipped by candidate]',
          submittedCode: submittedCode || session.currentPrimaryAnswer?.submittedCode,
          language: currentQ.language,
          followUpQuestion: session.currentFollowUpPrompt,
          skipped: true,
          status: 'skipped',
          scoreOutOf10: 0,
          rubricBreakdown: {
            conceptualUnderstanding: 0,
            technicalAccuracy: 0,
            practicalProblemSolving: 0,
            codingAndDebugging: 0,
            communicationAndExplanation: 0,
          },
          aiFeedback:
            'Question skipped. Zero marks awarded across rubric criteria; added to Weak Topics for targeted review.',
          misconceptionsDetected: [`Skipped ${currentQ.subtopic}`],
          idealExplanation: currentQ.idealExplanation,
          curriculumModuleId: currentQ.curriculumModuleId,
          timeSpentSeconds: timeSpentSeconds || 0,
        };

        session.records.push(skippedRecord);
        session.awaitingFollowUp = false;
        session.currentFollowUpPrompt = undefined;
        session.currentPrimaryAnswer = undefined;

        if (!state.askedQuestionIds.includes(currentQ.id)) {
          state.askedQuestionIds.push(currentQ.id);
        }

        session.dialogue.push({
          id: `dlg_skip_${Date.now()}`,
          speaker: 'candidate',
          text: 'Skipped this question.',
          timestamp: new Date().toISOString(),
          round: currentQ.round,
          evaluationBadge: 'Skipped',
        });

        session.currentQuestionIndex += 1;
        const nextQ = session.questions[session.currentQuestionIndex];
        if (nextQ) {
          const roundChanged = nextQ.round !== currentQ.round;
          const roundNames: Record<number, string> = {
            1: 'Round 1: Technical Fundamentals',
            2: 'Round 2: Technical Deep Dive',
            3: 'Round 3: Practical Coding',
            4: 'Round 4: Real-World Problem Solving',
            5: 'Round 5: Project Discussion',
          };
          session.dialogue.push({
            id: `dlg_next_${Date.now() + 1}`,
            speaker: 'interviewer',
            text: `${roundChanged ? `Moving into ${roundNames[nextQ.round]}. ` : 'Noted—we will mark this for follow-up review. Next question: '}${nextQ.prompt}`,
            timestamp: new Date().toISOString(),
            round: nextQ.round,
          });
        } else {
          session.dialogue.push({
            id: `dlg_done_${Date.now() + 1}`,
            speaker: 'interviewer',
            text: 'That concludes all five rounds. Click "Generate Final Report" to review your complete rubric score and personalized improvement plan.',
            timestamp: new Date().toISOString(),
            round: 5,
          });
        }

        saveState(state);
        res.json({ session, state, completed: !nextQ });
        return;
      }

      // Run HDL static/simulator check if this is a coding/debugging question or code was supplied
      let hdlCheck = undefined;
      const effectiveCode =
        submittedCode ?? session.currentPrimaryAnswer?.submittedCode ?? '';
      if (currentQ.language || effectiveCode.trim().length > 0) {
        const lang = currentQ.language || 'verilog';
        hdlCheck = analyzeHdlCode(effectiveCode, lang, simulatorAvailable);
        if (simulatorAvailable && effectiveCode.trim().length > 0) {
          const sim = await runRealIcarusCheck(effectiveCode, lang);
          hdlCheck.simulatorOutput = sim.output;
          if (!sim.compiled) {
            hdlCheck.syntaxValid = false;
            hdlCheck.issues.unshift({
              severity: 'error',
              line: 1,
              rule: 'iverilog-compile',
              message: sim.output.trim(),
            });
          }
        }
      }

      const ai = getGeminiClient();

      // Determine running accuracy to adapt difficulty / probe depth
      const avgPrior =
        session.records.length > 0
          ? session.records.reduce((s, r) => s + r.scoreOutOf10, 0) / session.records.length
          : 7;

      const isFollowUpTurn = session.awaitingFollowUp;

      const evalPrompt = `You are a Principal Semiconductor RTL Design & Design Verification Technical Interviewer conducting a realistic ${session.mode} mode mock interview at Day ${session.checkpointDay}.

STRICT RULES:
1. Evaluate ONLY based on technical correctness, completeness, engineering reasoning, and real understanding—do NOT award full marks for memorized buzzwords without mechanism/reasoning.
2. Never give generic AI praise ("Great job!"). Give crisp, realistic senior engineering feedback.
3. For HDL code: evaluate real logic, sensitivity lists, blocking vs non-blocking semantics, edge cases, race conditions, reset behavior, and synthesis safety—do NOT grade by keyword matching.
4. ${isFollowUpTurn ? 'This is the candidate’s answer to your follow-up probe. Do NOT ask another follow-up; produce the final numeric evaluation for this question.' : 'If the candidate’s answer is incomplete, ambiguous, or reveals a conceptual gap (or if they are strong in Industry/Technical mode and you want to test edge-case depth), set needsFollowUp=true and ask ONE sharp, focused follow-up question WITHOUT giving away the answer.'}
5. Stay strictly within Day ${session.checkpointDay} syllabus scope (do NOT introduce UVM/SystemVerilog topics before their scheduled checkpoints).

INTERVIEW CONTEXT:
- Checkpoint: Day ${session.checkpointDay} (${CHECKPOINTS.find((c) => c.day === session.checkpointDay)?.topicsCovered})
- Round ${currentQ.round} (${currentQ.format}), Domain: ${currentQ.domain}, Subtopic: ${currentQ.subtopic}
- Candidate running average score: ${avgPrior.toFixed(1)}/10
- Question Asked: ${currentQ.prompt}
- Expected Technical Concepts: ${currentQ.expectedConcepts.join(' | ')}
- Reference Notes: ${currentQ.contextNotes}
${isFollowUpTurn ? `- Primary Answer: ${session.currentPrimaryAnswer?.answerText || ''}\n- Follow-Up Question Asked: ${session.currentFollowUpPrompt}\n- Candidate Follow-Up Answer: ${answerText}` : `- Candidate Answer: ${answerText}`}
${effectiveCode ? `- Candidate HDL Code (${currentQ.language || 'verilog'}):\n\`\`\`\n${effectiveCode}\n\`\`\`` : ''}
${hdlCheck ? `- Static HDL Analyzer Summary: syntaxValid=${hdlCheck.syntaxValid}, issues=${JSON.stringify(hdlCheck.issues)}` : ''}

Score strictly on these exact ranges:
- conceptualUnderstanding: integer 0..25
- technicalAccuracy: integer 0..20
- practicalProblemSolving: integer 0..20
- codingAndDebugging: integer 0..20 (if non-coding question, score based on technical/circuit debugging rigor proportional to answer quality)
- communicationAndExplanation: integer 0..15
- scoreOutOf10: integer 0..10 (overall question score)
- status: "correct" (7-10), "partial" (5-6), or "incorrect" (0-4)`;

      const response = await generateContentWithRetry(ai, {
        contents: evalPrompt,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            needsFollowUp: { type: Type.BOOLEAN },
            followUpQuestion: { type: Type.STRING },
            interviewerReply: { type: Type.STRING },
            status: { type: Type.STRING },
            scoreOutOf10: { type: Type.INTEGER },
            conceptualUnderstanding: { type: Type.INTEGER },
            technicalAccuracy: { type: Type.INTEGER },
            practicalProblemSolving: { type: Type.INTEGER },
            codingAndDebugging: { type: Type.INTEGER },
            communicationAndExplanation: { type: Type.INTEGER },
            misconceptionsDetected: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            detailedFeedback: { type: Type.STRING },
          },
          required: [
            'needsFollowUp',
            'interviewerReply',
            'status',
            'scoreOutOf10',
            'conceptualUnderstanding',
            'technicalAccuracy',
            'practicalProblemSolving',
            'codingAndDebugging',
            'communicationAndExplanation',
            'misconceptionsDetected',
            'detailedFeedback',
          ],
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        needsFollowUp: boolean;
        followUpQuestion?: string;
        interviewerReply: string;
        status: 'correct' | 'partial' | 'incorrect';
        scoreOutOf10: number;
        conceptualUnderstanding: number;
        technicalAccuracy: number;
        practicalProblemSolving: number;
        codingAndDebugging: number;
        communicationAndExplanation: number;
        misconceptionsDetected: string[];
        detailedFeedback: string;
      };

      // Add candidate message to dialogue
      session.dialogue.push({
        id: `dlg_cand_${Date.now()}`,
        speaker: 'candidate',
        text: answerText.trim() || '(Submitted HDL code)',
        codeSnippet:
          !isFollowUpTurn && effectiveCode.trim() && effectiveCode.trim() !== (currentQ.starterCode || '').trim()
            ? effectiveCode
            : undefined,
        timestamp: new Date().toISOString(),
        round: currentQ.round,
      });

      if (!isFollowUpTurn && parsed.needsFollowUp && parsed.followUpQuestion?.trim()) {
        session.awaitingFollowUp = true;
        session.currentFollowUpPrompt = parsed.followUpQuestion.trim();
        session.currentPrimaryAnswer = {
          answerText,
          submittedCode: effectiveCode,
          timeSpentSeconds,
          preliminaryEvaluation: parsed.detailedFeedback,
        };

        session.dialogue.push({
          id: `dlg_fu_${Date.now() + 1}`,
          speaker: 'interviewer',
          text: `${parsed.interviewerReply}\n\nFollow-up: ${parsed.followUpQuestion.trim()}`,
          timestamp: new Date().toISOString(),
          round: currentQ.round,
          evaluationBadge: parsed.status === 'correct' ? 'Strong' : parsed.status === 'partial' ? 'Partial' : 'Gap Detected',
        });

        saveState(state);
        res.json({ session, state, completed: false, awaitingFollowUp: true });
        return;
      }

      // Finalize this question record
      const clampedStatus: 'correct' | 'partial' | 'incorrect' =
        parsed.status === 'correct' || parsed.status === 'partial' || parsed.status === 'incorrect'
          ? parsed.status
          : parsed.scoreOutOf10 >= 7
            ? 'correct'
            : parsed.scoreOutOf10 >= 5
              ? 'partial'
              : 'incorrect';

      const record: QuestionAnswerRecord = {
        questionId: currentQ.id,
        round: currentQ.round,
        domain: currentQ.domain,
        subtopic: currentQ.subtopic,
        format: currentQ.format,
        prompt: currentQ.prompt,
        answerText: isFollowUpTurn
          ? `${session.currentPrimaryAnswer?.answerText || ''}\n\n[Follow-up response]: ${answerText}`
          : answerText,
        submittedCode: effectiveCode || undefined,
        language: currentQ.language,
        followUpQuestion: session.currentFollowUpPrompt,
        followUpAnswer: isFollowUpTurn ? answerText : undefined,
        skipped: false,
        status: clampedStatus,
        scoreOutOf10: Math.max(0, Math.min(10, Math.round(parsed.scoreOutOf10))),
        rubricBreakdown: {
          conceptualUnderstanding: Math.max(0, Math.min(25, Math.round(parsed.conceptualUnderstanding))),
          technicalAccuracy: Math.max(0, Math.min(20, Math.round(parsed.technicalAccuracy))),
          practicalProblemSolving: Math.max(0, Math.min(20, Math.round(parsed.practicalProblemSolving))),
          codingAndDebugging: Math.max(0, Math.min(20, Math.round(parsed.codingAndDebugging))),
          communicationAndExplanation: Math.max(0, Math.min(15, Math.round(parsed.communicationAndExplanation))),
        },
        aiFeedback: parsed.detailedFeedback,
        misconceptionsDetected: parsed.misconceptionsDetected || [],
        idealExplanation: currentQ.idealExplanation,
        curriculumModuleId: currentQ.curriculumModuleId,
        hdlLintSummary: hdlCheck,
        timeSpentSeconds:
          (session.currentPrimaryAnswer?.timeSpentSeconds || 0) + (timeSpentSeconds || 0),
      };

      session.records.push(record);
      session.awaitingFollowUp = false;
      session.currentFollowUpPrompt = undefined;
      session.currentPrimaryAnswer = undefined;

      if (!state.askedQuestionIds.includes(currentQ.id)) {
        state.askedQuestionIds.push(currentQ.id);
      }

      session.currentQuestionIndex += 1;
      const nextQ = session.questions[session.currentQuestionIndex];
      const badge =
        clampedStatus === 'correct' ? 'Strong' : clampedStatus === 'partial' ? 'Partial' : 'Gap Detected';

      if (nextQ) {
        const roundChanged = nextQ.round !== currentQ.round;
        const roundNames: Record<number, string> = {
          1: 'Round 1: Technical Fundamentals',
          2: 'Round 2: Technical Deep Dive',
          3: 'Round 3: Practical Coding',
          4: 'Round 4: Real-World Problem Solving',
          5: 'Round 5: Project Discussion',
        };
        const transitionPrefix = roundChanged
          ? `Let’s transition to ${roundNames[nextQ.round]}. `
          : 'Next question: ';
        session.dialogue.push({
          id: `dlg_eval_next_${Date.now() + 1}`,
          speaker: 'interviewer',
          text: `${parsed.interviewerReply}\n\n${transitionPrefix}${nextQ.prompt}`,
          timestamp: new Date().toISOString(),
          round: nextQ.round,
          evaluationBadge: badge,
        });
      } else {
        session.dialogue.push({
          id: `dlg_eval_end_${Date.now() + 1}`,
          speaker: 'interviewer',
          text: `${parsed.interviewerReply}\n\nWe have completed all five rounds of your Day ${session.checkpointDay} mock interview. Generate your Feedback Report now to review your detailed rubric breakdown and remediation plan.`,
          timestamp: new Date().toISOString(),
          round: 5,
          evaluationBadge: badge,
        });
      }

      saveState(state);
      res.json({ session, state, completed: !nextQ, awaitingFollowUp: false });
    } catch (err: unknown) {
      const message = formatGeminiError(err);
      res.status(502).json({ error: message });
    }
  });

  // Finalize interview and generate detailed performance report
  app.post('/api/interview/finalize', async (req, res) => {
    try {
      const { elapsedSeconds, endedEarly } = req.body as {
        elapsedSeconds: number;
        endedEarly?: boolean;
      };

      const state = loadState();
      const session = state.activeSession;
      if (!session) {
        res.status(400).json({ error: 'No active interview session to finalize.' });
        return;
      }

      // If ended early, mark remaining unanswered questions as skipped so scoring reflects skipped items honestly
      if (endedEarly && session.currentQuestionIndex < session.questions.length) {
        for (let i = session.currentQuestionIndex; i < session.questions.length; i++) {
          const q = session.questions[i];
          if (session.records.some((r) => r.questionId === q.id)) continue;
          session.records.push({
            questionId: q.id,
            round: q.round,
            domain: q.domain,
            subtopic: q.subtopic,
            format: q.format,
            prompt: q.prompt,
            answerText: '[Interview ended before reaching this question]',
            skipped: true,
            status: 'skipped',
            scoreOutOf10: 0,
            rubricBreakdown: {
              conceptualUnderstanding: 0,
              technicalAccuracy: 0,
              practicalProblemSolving: 0,
              codingAndDebugging: 0,
              communicationAndExplanation: 0,
            },
            aiFeedback: 'Unanswered due to early interview termination.',
            misconceptionsDetected: [`Unanswered: ${q.subtopic}`],
            idealExplanation: q.idealExplanation,
            curriculumModuleId: q.curriculumModuleId,
            timeSpentSeconds: 0,
          });
        }
      }

      const agg = aggregateRubricScores(session.records);
      const correctCount = session.records.filter((r) => r.status === 'correct').length;
      const partialCount = session.records.filter((r) => r.status === 'partial').length;
      const incorrectCount = session.records.filter((r) => r.status === 'incorrect').length;
      const skippedCount = session.records.filter((r) => r.status === 'skipped').length;

      const sortedByScore = [...session.records].sort((a, b) => b.scoreOutOf10 - a.scoreOutOf10);
      const strongestTopics = Array.from(
        new Set(sortedByScore.filter((r) => r.scoreOutOf10 >= 7).map((r) => r.subtopic))
      ).slice(0, 4);
      const weakestTopics = Array.from(
        new Set(
          sortedByScore
            .filter((r) => r.scoreOutOf10 < 7)
            .sort((a, b) => a.scoreOutOf10 - b.scoreOutOf10)
            .map((r) => r.subtopic)
        )
      ).slice(0, 4);

      const adaptivePlan = buildAdaptivePlanFromRecords(session.records);

      // Generate holistic synthesis summary via Gemini
      let codingPerformance = 'Evaluated across practical RTL/SV exercises.';
      let debuggingPerformance = 'Evaluated across defect diagnosis and root-cause triage.';
      let communicationAssessment = 'Evaluated across structured technical explanations.';
      let areasRequiringImprovement = adaptivePlan.map((p) => `${p.topic}: ${p.description}`);
      let readinessSummary: string | undefined = undefined;

      const hasAttemptedAnswers = session.records.some((r) => !r.skipped);
      if (hasAttemptedAnswers) {
        try {
          const ai = getGeminiClient();
          const summaryResp = await generateContentWithRetry(ai, {
            contents: `Synthesize an objective, realistic VLSI engineering feedback report for a Day ${session.checkpointDay} (${session.mode} mode) mock interview scoring ${agg.totalScore}/100 (${agg.performanceCategory}).
Records:
${session.records.map((r) => `- [${r.subtopic}] (${r.format}): ${r.scoreOutOf10}/10 (${r.status}). Feedback: ${r.aiFeedback}`).join('\n')}
Keep tone strictly professional, technical, and constructive. For Day 90, explicitly note readiness without guaranteeing employment.`,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                codingPerformance: { type: Type.STRING },
                debuggingPerformance: { type: Type.STRING },
                communicationAssessment: { type: Type.STRING },
                areasRequiringImprovement: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                readinessSummary: { type: Type.STRING },
              },
              required: [
                'codingPerformance',
                'debuggingPerformance',
                'communicationAssessment',
                'areasRequiringImprovement',
              ],
            },
          });
          const synth = JSON.parse((summaryResp.text ?? '{}').trim());
          if (synth.codingPerformance) codingPerformance = synth.codingPerformance;
          if (synth.debuggingPerformance) debuggingPerformance = synth.debuggingPerformance;
          if (synth.communicationAssessment) communicationAssessment = synth.communicationAssessment;
          if (Array.isArray(synth.areasRequiringImprovement) && synth.areasRequiringImprovement.length > 0) {
            areasRequiringImprovement = synth.areasRequiringImprovement;
          }
          if (synth.readinessSummary) readinessSummary = synth.readinessSummary;
        } catch {
          // Deterministic summary fallback if final synthesis call fails after scoring
        }
      }

      // Merge new adaptive gaps into learner's weakTopics (avoid duplicates by id)
      const mergedWeak = [...state.weakTopics];
      for (const gap of adaptivePlan) {
        const idx = mergedWeak.findIndex((w) => w.id === gap.id);
        if (idx >= 0) {
          mergedWeak[idx] = { ...gap, resolved: false };
        } else {
          mergedWeak.push(gap);
        }
      }
      // Also mark any topics answered >= 8/10 as resolved!
      for (const rec of session.records) {
        if (rec.scoreOutOf10 >= 8) {
          const idx = mergedWeak.findIndex((w) => w.relatedQuestionId === rec.questionId);
          if (idx >= 0) {
            mergedWeak[idx] = { ...mergedWeak[idx], resolved: true, retryScore: rec.scoreOutOf10 * 10 };
          }
        }
      }

      const unresolvedCritical = mergedWeak.filter((w) => !w.resolved && w.severity === 'critical').length;
      const readinessLevel =
        session.checkpointDay === 90
          ? classifyDay90Readiness(agg.totalScore, unresolvedCritical)
          : undefined;

      const report: InterviewReport = {
        id: `rep_${session.checkpointDay}_${Date.now()}`,
        checkpointNumber: session.checkpointNumber,
        checkpointDay: session.checkpointDay,
        mode: session.mode,
        isRetest: session.isRetest,
        completedAt: new Date().toISOString(),
        durationSeconds: elapsedSeconds || session.elapsedSeconds,
        totalScore: agg.totalScore,
        percentage: agg.percentage,
        performanceCategory: agg.performanceCategory,
        rubricTotals: agg.rubricTotals,
        correctCount,
        partialCount,
        incorrectCount,
        skippedCount,
        strongestTopics,
        weakestTopics,
        codingPerformance,
        debuggingPerformance,
        communicationAssessment,
        areasRequiringImprovement,
        adaptivePlan,
        questionRecords: session.records,
        readinessLevel,
        readinessSummary:
          session.checkpointDay === 90
            ? `${readinessSummary || `Assessment classification: ${readinessLevel}.`} Note: Mock interview performance reflects technical readiness only and does not guarantee employment.`
            : undefined,
      };

      state.reports.push(report);
      state.weakTopics = mergedWeak;
      state.activeSession = null;
      saveState(state);

      res.json({ report, state });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to finalize interview.';
      res.status(500).json({ error: message });
    }
  });

  // Evaluate retried question or targeted practice quiz in Weak Topics
  app.post('/api/remediation/evaluate', async (req, res) => {
    try {
      const { gapId, type, answerText, code, quizSelectedIndex } = req.body as {
        gapId: string;
        type: 'retry_question' | 'practice_quiz';
        answerText?: string;
        code?: string;
        quizSelectedIndex?: number;
      };

      const state = loadState();
      const gapIdx = state.weakTopics.findIndex((w) => w.id === gapId);
      if (gapIdx < 0) {
        res.status(404).json({ error: 'Weak topic item not found.' });
        return;
      }

      const gap = state.weakTopics[gapIdx];
      const question = QUESTION_BANK.find((q) => q.id === gap.relatedQuestionId);
      if (!question) {
        res.status(404).json({ error: 'Related question not found.' });
        return;
      }

      if (type === 'practice_quiz') {
        const isCorrect = quizSelectedIndex === question.practiceQuiz.correctIndex;
        const quizScore = isCorrect ? 100 : 0;
        state.weakTopics[gapIdx] = {
          ...gap,
          practiceQuizScore: quizScore,
          resolved: isCorrect && (gap.retryScore === undefined || gap.retryScore >= 70),
        };
        saveState(state);
        res.json({
          passed: isCorrect,
          score: quizScore,
          explanation: question.practiceQuiz.explanation,
          state,
        });
        return;
      }

      // AI evaluation of retried failed question
      const ai = getGeminiClient();
      const hdlCheck =
        question.language || (code && code.trim().length > 0)
          ? analyzeHdlCode(code || '', question.language || 'verilog', simulatorAvailable)
          : undefined;

      const resp = await generateContentWithRetry(ai, {
        contents: `Evaluate a learner retrying a previously failed VLSI interview question.
Question: ${question.prompt}
Expected Concepts: ${question.expectedConcepts.join(' | ')}
Candidate Retry Answer: ${answerText || ''}
${code ? `Candidate Code:\n${code}` : ''}
${hdlCheck ? `Static HDL Check: syntaxValid=${hdlCheck.syntaxValid}, issues=${JSON.stringify(hdlCheck.issues)}` : ''}
Score 0..100 and determine if the learner has closed the conceptual gap (passed >= 70).`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            passed: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING },
          },
          required: ['score', 'passed', 'feedback'],
        },
      });

      const parsed = JSON.parse((resp.text ?? '{}').trim()) as {
        score: number;
        passed: boolean;
        feedback: string;
      };

      const clampedScore = Math.max(0, Math.min(100, Math.round(parsed.score)));
      const passed = clampedScore >= 70;
      state.weakTopics[gapIdx] = {
        ...gap,
        retryScore: clampedScore,
        resolved: passed,
      };
      saveState(state);

      res.json({
        passed,
        score: clampedScore,
        feedback: parsed.feedback,
        idealExplanation: question.idealExplanation,
        state,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to evaluate remediation attempt.';
      res.status(502).json({ error: message });
    }
  });

  // Vite dev middleware or production static assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Silicon Quest server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Silicon Quest server:', err);
  process.exit(1);
});
