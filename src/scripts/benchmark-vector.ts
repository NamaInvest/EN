// src/scripts/benchmark-vector.ts
// Vector search benchmark: measures p50/p95/p99 latency for HNSW queries.
// Run: npx tsx src/scripts/benchmark-vector.ts

import { getPrisma } from '../lib/prisma';
import { PgvectorStore } from '../lib/vector/store/pgvector.adapter';

const QUERIES = 200;
const TOP_K = 10;
const EMBEDDING_DIM = 768;

function randomEmbedding(): number[] {
  const emb = Array.from({ length: EMBEDDING_DIM }, () => Math.random() * 2 - 1);
  const norm = Math.sqrt(emb.reduce((s, v) => s + v * v, 0));
  return emb.map((v) => v / norm);
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function main() {
  // Pass a mock headers object matching getPrisma(req?: { headers?: unknown }) signature
  const prisma = getPrisma({ headers: {} });
  const store = new PgvectorStore(prisma);


  // Find a tenant with chunks
  type TenantRow = [{ tenant_id: string }];
  const rows = await prisma.$queryRaw<TenantRow>`
    SELECT DISTINCT tenant_id FROM knowledge_chunks
    WHERE is_active = true LIMIT 1
  `;
  const tenantId = rows[0]?.tenant_id;

  if (!tenantId) {
    console.error('No knowledge chunks found. Insert some first.');
    process.exit(1);
  }

  const chunkCount = await store.count(tenantId);
  console.log(`\nBenchmarking: ${QUERIES} queries | topK=${TOP_K} | chunks=${chunkCount}`);
  console.log('─────────────────────────────────────────────────');

  const latencies: number[] = [];
  for (let i = 0; i < QUERIES; i++) {
    const start = performance.now();
    await store.search({
      embedding: randomEmbedding(),
      topK: TOP_K,
      tenantId,
      minScore: 0,
      efSearch: 40,
    });
    latencies.push(performance.now() - start);
    if (i % 50 === 49) process.stdout.write(`  ${i + 1}/${QUERIES} queries done\n`);
  }

  latencies.sort((a, b) => a - b);

  console.log('\n════════════════════════════════════');
  console.log('Vector Search Benchmark Results');
  console.log('════════════════════════════════════');
  console.log(`p50:  ${percentile(latencies, 50).toFixed(1)} ms`);
  console.log(`p95:  ${percentile(latencies, 95).toFixed(1)} ms`);
  console.log(`p99:  ${percentile(latencies, 99).toFixed(1)} ms`);
  console.log(`avg:  ${(latencies.reduce((a, b) => a + b) / latencies.length).toFixed(1)} ms`);
  console.log(`min:  ${latencies[0].toFixed(1)} ms`);
  console.log(`max:  ${latencies[latencies.length - 1].toFixed(1)} ms`);
  console.log('════════════════════════════════════');
  console.log('\nTarget: p95 < 100ms');

  if (percentile(latencies, 95) > 100) {
    console.warn('⚠️  p95 exceeds 100ms — consider increasing ef_construction or upgrading to Qdrant');
  } else {
    console.log('✅ p95 within target');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
