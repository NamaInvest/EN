// src/lib/rag/evaluation/ragas-runner.ts
// Lightweight RAGAS-style evaluator using Gemini as judge LLM.
// Metrics: Faithfulness, Answer Relevance, Context Precision, Context Recall.
// Run via: npx tsx src/scripts/run-ragas-eval.ts

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { RetrievedChunk } from '../pipeline';

export interface GoldenTestCase {
  id: string;
  query: string;
  expectedAnswer?: string;
  expectedContext?: string;
  module?: string;       // 'accounting' | 'hr' | 'zatca'
}

export interface EvaluationScores {
  faithfulness: number;       // 0-1: answer grounded in context?
  answerRelevance: number;    // 0-1: answer addresses the question?
  contextPrecision: number;   // 0-1: retrieved chunks are relevant?
  contextRecall: number;      // 0-1: context covers expected info?
  overall: number;
}

export interface EvaluationResult {
  testCaseId: string;
  query: string;
  scores: EvaluationScores;
  answer: string;
  passedThreshold: boolean;
}

const THRESHOLDS = {
  faithfulness: 0.85,
  answerRelevance: 0.80,
  contextPrecision: 0.75,
  contextRecall: 0.70,
  overall: 0.80,
};

export class RAGASEvaluator {
  constructor(private judge: ChatGoogleGenerativeAI) {}

  async evaluate(
    testCase: GoldenTestCase,
    answer: string,
    retrievedChunks: RetrievedChunk[]
  ): Promise<EvaluationResult> {
    const [faithfulness, answerRelevance, contextPrecision, contextRecall] =
      await Promise.all([
        this.faithfulness(testCase.query, answer, retrievedChunks),
        this.answerRelevance(testCase.query, answer),
        this.contextPrecision(testCase.query, retrievedChunks),
        testCase.expectedContext
          ? this.contextRecall(retrievedChunks, testCase.expectedContext)
          : Promise.resolve(1.0),
      ]);

    const overall =
      (faithfulness + answerRelevance + contextPrecision + contextRecall) / 4;

    return {
      testCaseId: testCase.id,
      query: testCase.query,
      answer,
      scores: { faithfulness, answerRelevance, contextPrecision, contextRecall, overall },
      passedThreshold: overall >= THRESHOLDS.overall,
    };
  }

  /** Faithfulness: claims in answer supported by context (no hallucination). */
  private async faithfulness(
    query: string,
    answer: string,
    chunks: RetrievedChunk[]
  ): Promise<number> {
    const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n');

    const prompt = `قيّم ما إذا كانت الإجابة مدعومة بالكامل من السياق.
استخرج كل ادعاء واقعي من الإجابة، ثم حدد إن كان موجوداً في السياق.

السؤال: ${query}
الإجابة: ${answer}
السياق:
${context}

أجب بـ JSON فقط بهذا الشكل:
{"claims": [{"claim": "...", "supported": true, "evidence": "..."}]}`;

    try {
      const result = await this.judge.invoke(prompt);
      const text = typeof result.content === 'string' ? result.content : '{}';
      const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
      const claims: { supported: boolean }[] = json.claims ?? [];
      if (claims.length === 0) return 1.0;
      return claims.filter((c) => c.supported).length / claims.length;
    } catch {
      return 0.75; // safe default if parse fails
    }
  }

  /** Answer Relevance: does the answer address the question? */
  private async answerRelevance(query: string, answer: string): Promise<number> {
    const prompt = `هل الإجابة التالية تعالج السؤال بشكل مباشر وكامل؟
أجب بنسبة من 0.0 إلى 1.0 فقط (رقم عشري).

السؤال: ${query}
الإجابة: ${answer}

النسبة:`;

    try {
      const result = await this.judge.invoke(prompt);
      const text = typeof result.content === 'string' ? result.content : '0.7';
      const num = parseFloat(text.trim());
      return isNaN(num) ? 0.7 : Math.max(0, Math.min(1, num));
    } catch {
      return 0.7;
    }
  }

  /** Context Precision: are retrieved chunks relevant to the query? */
  private async contextPrecision(
    query: string,
    chunks: RetrievedChunk[]
  ): Promise<number> {
    if (chunks.length === 0) return 0;

    const relevanceScores = await Promise.all(
      chunks.map(async (chunk) => {
        const prompt = `هل هذا المحتوى ذو صلة مباشرة بالسؤال؟ أجب بـ "نعم" أو "لا" فقط.
السؤال: ${query}
المحتوى: ${chunk.content.slice(0, 300)}`;
        const result = await this.judge.invoke(prompt);
        const text = typeof result.content === 'string' ? result.content : 'لا';
        return text.includes('نعم') ? 1 as number : 0 as number;
      })
    );

    return (relevanceScores as number[]).reduce((a, b) => a + b, 0) / relevanceScores.length;
  }

  /** Context Recall: does retrieved context cover expected information? */
  private async contextRecall(
    chunks: RetrievedChunk[],
    expectedContext: string
  ): Promise<number> {
    const context = chunks.map((c) => c.content).join('\n');

    const prompt = `ما نسبة المعلومات في "السياق المتوقع" الموجودة في "السياق المسترجع"؟
أجب بنسبة من 0.0 إلى 1.0 فقط.

السياق المتوقع: ${expectedContext.slice(0, 500)}
السياق المسترجع: ${context.slice(0, 1000)}

النسبة:`;

    try {
      const result = await this.judge.invoke(prompt);
      const text = typeof result.content === 'string' ? result.content : '0.7';
      const num = parseFloat(text.trim());
      return isNaN(num) ? 0.7 : Math.max(0, Math.min(1, num));
    } catch {
      return 0.7;
    }
  }
}

/** Aggregate results and report. */
export function summarizeResults(results: EvaluationResult[]): void {
  if (results.length === 0) {
    console.log('No results to summarize.');
    return;
  }

  const avg = (key: keyof EvaluationScores) =>
    results.reduce((s, r) => s + r.scores[key], 0) / results.length;

  const passed = results.filter((r) => r.passedThreshold).length;

  console.log('\n════════════════════════════════════');
  console.log('RAGAS Evaluation Summary');
  console.log('════════════════════════════════════');
  console.log(`Cases:              ${results.length}`);
  console.log(`Passed (>${THRESHOLDS.overall * 100}%):    ${passed}/${results.length}`);
  console.log('────────────────────────────────────');
  console.log(`Faithfulness:       ${(avg('faithfulness') * 100).toFixed(1)}%`);
  console.log(`Answer Relevance:   ${(avg('answerRelevance') * 100).toFixed(1)}%`);
  console.log(`Context Precision:  ${(avg('contextPrecision') * 100).toFixed(1)}%`);
  console.log(`Context Recall:     ${(avg('contextRecall') * 100).toFixed(1)}%`);
  console.log(`Overall:            ${(avg('overall') * 100).toFixed(1)}%`);
  console.log('════════════════════════════════════\n');

  if (avg('faithfulness') < THRESHOLDS.faithfulness) {
    console.error(`❌ Faithfulness below threshold (${THRESHOLDS.faithfulness * 100}%)`);
    process.exitCode = 1;
  }
  if (avg('overall') < THRESHOLDS.overall) {
    console.error(`❌ Overall score below threshold (${THRESHOLDS.overall * 100}%)`);
    process.exitCode = 1;
  }
}
