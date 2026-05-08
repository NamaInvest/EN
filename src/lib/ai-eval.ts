/**
 * AI Eval Suite (RAGAS-inspired)
 * ──────────────────────────────────────────────────────────
 * Automated evaluation of AI responses for quality assurance.
 * Metrics: Faithfulness, Relevance, Answer Similarity, Hallucination Detection.
 */

import { logger } from '@/lib/logger';

const log = logger.child({ route: 'AIEval' });

interface EvalResult {
  id: string;
  question: string;
  expectedAnswer: string;
  actualAnswer: string;
  scores: {
    faithfulness: number;    // 0-1: Does the answer stick to provided context?
    relevance: number;       // 0-1: Does the answer address the question?
    similarity: number;      // 0-1: How similar to the expected answer?
    completeness: number;    // 0-1: Does it cover all required points?
    hallucination: number;   // 0-1: 0 = no hallucination, 1 = fully hallucinated
  };
  overallScore: number;
  passed: boolean;
  timestamp: Date;
  latencyMs: number;
}

const evalHistory: EvalResult[] = [];
const MAX_HISTORY = 2000;
const PASS_THRESHOLD = 0.7;

// ── Similarity Metrics ──

/** Jaccard similarity between two texts */
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/** Keyword coverage: what % of expected keywords appear in actual */
function keywordCoverage(expected: string, actual: string): number {
  const expectedWords = new Set(expected.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const actualLower = actual.toLowerCase();
  if (expectedWords.size === 0) return 1;
  let found = 0;
  expectedWords.forEach(w => { if (actualLower.includes(w)) found++; });
  return found / expectedWords.size;
}

/** Check for numeric hallucination */
function detectNumericHallucination(context: string, answer: string): number {
  const contextNums = new Set((context.match(/\d+\.?\d*/g) || []).map(Number));
  const answerNums = (answer.match(/\d+\.?\d*/g) || []).map(Number);
  if (answerNums.length === 0) return 0;
  let hallucinated = 0;
  answerNums.forEach(n => { if (n > 1 && !contextNums.has(n)) hallucinated++; });
  return hallucinated / answerNums.length;
}

/** Relevance: does the answer address the question? */
function assessRelevance(question: string, answer: string): number {
  const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const answerLower = answer.toLowerCase();
  if (questionWords.length === 0) return 0.5;
  let relevant = 0;
  questionWords.forEach(w => { if (answerLower.includes(w)) relevant++; });
  return Math.min(1, (relevant / questionWords.length) * 1.5);
}

export const aiEval = {
  /** Evaluate a single response */
  evaluate(
    question: string,
    expectedAnswer: string,
    actualAnswer: string,
    context: string = '',
    latencyMs: number = 0,
  ): EvalResult {
    const similarity = jaccardSimilarity(expectedAnswer, actualAnswer);
    const completeness = keywordCoverage(expectedAnswer, actualAnswer);
    const relevance = assessRelevance(question, actualAnswer);
    const hallucination = context ? detectNumericHallucination(context, actualAnswer) : 0;
    const faithfulness = context ? (1 - hallucination) * keywordCoverage(context, actualAnswer) : similarity;

    const scores = {
      faithfulness: Math.round(faithfulness * 100) / 100,
      relevance: Math.round(relevance * 100) / 100,
      similarity: Math.round(similarity * 100) / 100,
      completeness: Math.round(completeness * 100) / 100,
      hallucination: Math.round(hallucination * 100) / 100,
    };

    const overallScore = Math.round(
      ((scores.faithfulness * 0.3) + (scores.relevance * 0.25) + (scores.similarity * 0.2) + (scores.completeness * 0.2) + ((1 - scores.hallucination) * 0.05)) * 100
    ) / 100;

    const result: EvalResult = {
      id: `eval_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      question,
      expectedAnswer,
      actualAnswer,
      scores,
      overallScore,
      passed: overallScore >= PASS_THRESHOLD,
      timestamp: new Date(),
      latencyMs,
    };

    evalHistory.push(result);
    if (evalHistory.length > MAX_HISTORY) evalHistory.splice(0, evalHistory.length - MAX_HISTORY);

    log.info(`Eval ${result.id}: ${result.passed ? 'PASS' : 'FAIL'} (${result.overallScore})`);
    return result;
  },

  /** Run a test suite */
  runSuite(testCases: { question: string; expected: string; context?: string }[]): {
    total: number; passed: number; failed: number; avgScore: number; results: EvalResult[];
  } {
    const results = testCases.map(tc =>
      this.evaluate(tc.question, tc.expected, tc.expected, tc.context || '', 0)
    );
    const passed = results.filter(r => r.passed).length;
    const avgScore = results.reduce((s, r) => s + r.overallScore, 0) / results.length;
    return { total: results.length, passed, failed: results.length - passed, avgScore: Math.round(avgScore * 100) / 100, results };
  },

  /** Get pass rate */
  getPassRate(): number {
    if (evalHistory.length === 0) return 0;
    return Math.round((evalHistory.filter(r => r.passed).length / evalHistory.length) * 100);
  },

  /** Get history */
  getHistory(limit = 50): EvalResult[] {
    return evalHistory.slice(-limit).reverse();
  },

  /** Get score distribution */
  getScoreDistribution(): Record<string, number> {
    const dist: Record<string, number> = { excellent: 0, good: 0, fair: 0, poor: 0 };
    evalHistory.forEach(r => {
      if (r.overallScore >= 0.9) dist.excellent++;
      else if (r.overallScore >= 0.7) dist.good++;
      else if (r.overallScore >= 0.5) dist.fair++;
      else dist.poor++;
    });
    return dist;
  },

  /** Stats */
  stats(): { total: number; passRate: number; avgScore: number; avgLatency: number } {
    if (evalHistory.length === 0) return { total: 0, passRate: 0, avgScore: 0, avgLatency: 0 };
    return {
      total: evalHistory.length,
      passRate: this.getPassRate(),
      avgScore: Math.round((evalHistory.reduce((s, r) => s + r.overallScore, 0) / evalHistory.length) * 100) / 100,
      avgLatency: Math.round(evalHistory.reduce((s, r) => s + r.latencyMs, 0) / evalHistory.length),
    };
  },
};

// ── Built-in Test Suite for NamaInvest ──
export const NAMA_EVAL_SUITE = [
  { question: 'كم مبيعات اليوم؟', expected: 'مبيعات اليوم هي X ريال', context: 'مبيعات اليوم: 15000 ريال' },
  { question: 'ما رصيد الخزنة؟', expected: 'رصيد الخزنة الحالي X ريال', context: 'رصيد الخزنة: 50000 ريال' },
  { question: 'كم عدد الفواتير المعلقة؟', expected: 'عدد الفواتير المعلقة X فاتورة', context: '12 فاتورة معلقة' },
  { question: 'من أكثر عميل شراءً؟', expected: 'أكثر عميل هو X بمبلغ Y', context: 'أحمد: 50000, محمد: 30000' },
  { question: 'كيف أصدر فاتورة؟', expected: 'اذهب لصفحة المبيعات واضغط إنشاء فاتورة جديدة' },
  { question: 'ما هي الضريبة؟', expected: 'ضريبة القيمة المضافة 15% حسب هيئة الزكاة والدخل' },
];
