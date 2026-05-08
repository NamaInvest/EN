import { RAGPipeline } from '../src/lib/rag/pipeline';
import { RAGASEvaluator } from '../src/lib/rag/evaluation/ragas-runner';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PgvectorStore } from '../src/lib/vector/store/pgvector.adapter';
import { GeminiEmbedder } from '../src/lib/vector/embedding/gemini.embedder';
import { HyDETransformer } from '../src/lib/rag/query-transformers/hyde.transformer';
import { MultiQueryTransformer } from '../src/lib/rag/query-transformers/multi-query.transformer';
import { CitationTracker } from '../src/lib/rag/citations/tracker';
import { EmbeddingCache } from '../src/lib/vector/embedding/cache';

async function runEvaluation() {
  const judgeLLM = new ChatGoogleGenerativeAI({ modelName: 'gemini-1.5-flash' });
  const evaluator = new RAGASEvaluator(judgeLLM);
  const cache = new EmbeddingCache();
  const embedder = new GeminiEmbedder(cache);
  const pipeline = new RAGPipeline(
    new PgvectorStore(),
    embedder,
    judgeLLM,
    new HyDETransformer(judgeLLM),
    new MultiQueryTransformer(judgeLLM),
    new CitationTracker()
  );

  const goldenSet = [
    { query: 'Test query 1', expectedContext: 'Expected context 1' },
  ];

  const results = [];
  for (const testCase of goldenSet) {
    const response = await pipeline.run({ query: testCase.query, tenantId: 'default' });
    const evaluation = await evaluator.evaluate(testCase, response);
    results.push(evaluation);
  }

  const avg = {
    faithfulness: results.reduce((s, r) => s + r.scores.faithfulness, 0) / results.length,
    answerRelevance: results.reduce((s, r) => s + r.scores.answerRelevance, 0) / results.length,
    contextPrecision: results.reduce((s, r) => s + r.scores.contextPrecision, 0) / results.length,
    contextRecall: results.reduce((s, r) => s + r.scores.contextRecall, 0) / results.length,
  };

  console.log('RAGAS Scores:', avg);

  if (avg.faithfulness < 0.85) {
    process.exit(1);
  }
}

runEvaluation().catch(console.error);
