# 1️⃣2️⃣ RAG | Retrieval-Augmented Generation

## 🔍 الحالة الحالية

### ✅ الموجود
- **RAG endpoint:** [src/app/api/ai/rag/route.ts](../src/app/api/ai/rag/route.ts)
- **Vector store:** [src/lib/vector-store.ts](../src/lib/vector-store.ts)
- **Top-K + threshold:** K=top-K, score > 0.5
- **LangChain integration**

### 🔴 الفجوات
| الفجوة | الخطورة |
|--------|--------|
| لا Document Ingestion Pipeline تلقائي | 🔴 |
| لا Chunking strategy واضحة | 🔴 |
| لا Citation/Source Tracking | 🟠 |
| لا Evaluation (RAGAS) | 🟠 |
| Metadata filtering بسيط (tenantId فقط) | 🟠 |
| لا Query Expansion / HyDE | 🟡 |
| لا Multi-query retrieval | 🟡 |
| Knowledge sources محدودة (knowledge_document فقط) | 🔴 |

---

## 🎯 الخطة التفصيلية

### البنية المقترحة
```
src/lib/rag/
  ├── pipeline.ts                  [Orchestrator]
  ├── retrievers/
  │   ├── base.retriever.ts
  │   ├── vector.retriever.ts
  │   ├── hybrid.retriever.ts
  │   ├── multi-query.retriever.ts
  │   ├── parent-document.retriever.ts
  │   └── self-query.retriever.ts
  ├── query-transformers/
  │   ├── hyde.transformer.ts      [Hypothetical Document Embeddings]
  │   ├── expansion.transformer.ts [قراءات متعددة للسؤال]
  │   └── decomposer.transformer.ts [يُقسّم سؤال معقد]
  ├── augmentation/
  │   ├── context-builder.ts
  │   ├── prompt-builder.ts
  │   └── citation-injector.ts
  ├── evaluation/
  │   ├── ragas-runner.ts
  │   ├── golden-set/
  │   │   ├── accounting.golden.json
  │   │   ├── hr.golden.json
  │   │   └── general.golden.json
  │   └── metrics/
  │       ├── faithfulness.ts
  │       ├── answer-relevance.ts
  │       ├── context-precision.ts
  │       └── context-recall.ts
  └── citations/
      ├── tracker.ts
      └── formatter.ts
```

---

### المرحلة 12.1 — RAG Pipeline (3 أيام)

```typescript
// src/lib/rag/pipeline.ts
export interface RAGRequest {
  query: string;
  filters?: {
    sourceType?: 'policy' | 'invoice' | 'contract' | 'manual' | 'zatca';
    dateRange?: { from: Date; to: Date };
    tags?: string[];
  };
  options?: {
    topK?: number;
    minScore?: number;
    enableHyDE?: boolean;
    enableMultiQuery?: boolean;
    enableReranking?: boolean;
    enableCitations?: boolean;
  };
}

export interface RAGResponse {
  answer: string;
  citations: Citation[];
  retrievedChunks: RetrievedChunk[];
  metadata: {
    queryTime: number;
    retrievalTime: number;
    generationTime: number;
    totalCost: number;
    chunksRetrieved: number;
    chunksUsed: number;
  };
}

export class RAGPipeline {
  constructor(
    private retriever: HybridRetriever,
    private llm: ChatGoogleGenerativeAI,
    private hydeTransformer: HyDETransformer,
    private multiQuery: MultiQueryTransformer,
    private reranker: CrossEncoderReranker
  ) {}

  async run(request: RAGRequest, ctx: BusinessContext): Promise<RAGResponse> {
    const start = performance.now();
    const opts = { topK: 10, minScore: 0.5, ...request.options };

    // Step 1: Query Transformation
    let queries = [request.query];

    if (opts.enableHyDE) {
      const hypothetical = await this.hydeTransformer.transform(request.query, ctx);
      queries.push(hypothetical);
    }

    if (opts.enableMultiQuery) {
      const variations = await this.multiQuery.generate(request.query, ctx);
      queries.push(...variations);
    }

    // Step 2: Retrieve from all queries
    const retrievalStart = performance.now();
    const allChunks: RetrievedChunk[] = [];
    for (const q of queries) {
      const results = await this.retriever.retrieve(q, {
        tenantId: ctx.tenant.id,
        ...request.filters,
      }, opts.topK * 2); // retrieve more, then dedupe + rerank
      allChunks.push(...results);
    }

    // Deduplicate
    const uniqueChunks = this.dedupe(allChunks);

    // Step 3: Re-rank
    let topChunks = uniqueChunks;
    if (opts.enableReranking) {
      topChunks = await this.reranker.rerank(request.query, uniqueChunks, opts.topK);
    } else {
      topChunks = uniqueChunks.slice(0, opts.topK);
    }
    const retrievalTime = performance.now() - retrievalStart;

    // Step 4: Build context with citations
    const context = this.buildContext(topChunks);

    // Step 5: Generate answer
    const generationStart = performance.now();
    const prompt = await getPrompt('rag.answer', {
      variables: {
        query: request.query,
        context,
        ...ctx,
      },
    });

    const llmResponse = await this.llm.invoke(prompt);
    const generationTime = performance.now() - generationStart;

    // Step 6: Extract citations
    const citations = opts.enableCitations
      ? this.extractCitations(llmResponse.content, topChunks)
      : [];

    return {
      answer: llmResponse.content,
      citations,
      retrievedChunks: topChunks,
      metadata: {
        queryTime: performance.now() - start,
        retrievalTime,
        generationTime,
        totalCost: this.calculateCost(llmResponse),
        chunksRetrieved: uniqueChunks.length,
        chunksUsed: topChunks.length,
      },
    };
  }

  private buildContext(chunks: RetrievedChunk[]): string {
    return chunks
      .map((chunk, i) =>
        `[المصدر ${i + 1}]\n` +
        `العنوان: ${chunk.metadata.title}\n` +
        `النوع: ${chunk.metadata.sourceType}\n` +
        `التاريخ: ${chunk.metadata.date || 'غير محدد'}\n` +
        `المحتوى:\n${chunk.content}\n`
      )
      .join('\n---\n\n');
  }

  private extractCitations(answer: string, chunks: RetrievedChunk[]): Citation[] {
    // Match patterns like [المصدر 1] or [Source 3]
    const citationRegex = /\[(?:المصدر|Source)\s+(\d+)\]/g;
    const matches = Array.from(answer.matchAll(citationRegex));

    const cited = new Set<number>();
    matches.forEach(m => cited.add(parseInt(m[1]) - 1));

    return Array.from(cited)
      .filter(idx => idx < chunks.length)
      .map(idx => ({
        sourceNumber: idx + 1,
        documentId: chunks[idx].metadata.sourceDocId,
        title: chunks[idx].metadata.title,
        url: chunks[idx].metadata.url,
        page: chunks[idx].metadata.page,
        score: chunks[idx].score,
      }));
  }
}
```

---

### المرحلة 12.2 — HyDE (Hypothetical Document Embeddings) (2 أيام)

```typescript
// src/lib/rag/query-transformers/hyde.transformer.ts
export class HyDETransformer {
  constructor(private llm: ChatGoogleGenerativeAI) {}

  async transform(query: string, ctx: BusinessContext): Promise<string> {
    // الفكرة: نطلب من LLM يكتب إجابة افتراضية، ثم نبحث بها بدلاً من السؤال
    // الإجابة الافتراضية تشبه الـ documents في الـ corpus أكثر من السؤال نفسه
    const prompt = `
أنت خبير في نظام Namasoft ERP السعودي.
اكتب فقرة قصيرة (3-4 جمل) كأنها مقتطف من دليل مستخدم
يجيب على السؤال التالي. لا تذكر أنك تخمّن.

السؤال: ${query}

الإجابة المحتملة:
`;

    const response = await this.llm.invoke(prompt);
    return response.content as string;
  }
}
```

---

### المرحلة 12.3 — Multi-Query Retrieval (2 أيام)

```typescript
// src/lib/rag/query-transformers/multi-query.transformer.ts
export class MultiQueryTransformer {
  constructor(private llm: ChatGoogleGenerativeAI) {}

  async generate(query: string, ctx: BusinessContext, count: number = 3): Promise<string[]> {
    const prompt = `
أعد صياغة السؤال التالي بـ ${count} طرق مختلفة لزيادة احتمال إيجاد الإجابة.
كل صياغة تركز على جانب مختلف.

السؤال الأصلي: ${query}

الصياغات (واحدة في كل سطر، بدون ترقيم):
`;

    const response = await this.llm.invoke(prompt);
    const variations = (response.content as string)
      .split('\n')
      .filter(l => l.trim().length > 10)
      .slice(0, count);

    return variations;
  }
}
```

---

### المرحلة 12.4 — Citations Tracking (2 أيام)

```typescript
// src/lib/rag/citations/tracker.ts
export interface Citation {
  sourceNumber: number;        // 1, 2, 3...
  documentId: string;
  title: string;
  url?: string;
  page?: number;
  score: number;
  excerpt?: string;
}

export class CitationTracker {
  format(citations: Citation[]): string {
    if (citations.length === 0) return '';

    return '\n\n## المراجع:\n' + citations
      .map(c =>
        `${c.sourceNumber}. **${c.title}**` +
        (c.page ? ` (صفحة ${c.page})` : '') +
        (c.url ? ` — [رابط](${c.url})` : '') +
        ` (تطابق: ${(c.score * 100).toFixed(0)}%)`
      )
      .join('\n');
  }

  async log(citations: Citation[], queryId: string, ctx: BusinessContext): Promise<void> {
    await prisma.ragCitation.createMany({
      data: citations.map(c => ({
        tenantId: ctx.tenant.id,
        queryId,
        documentId: c.documentId,
        score: c.score,
        excerpt: c.excerpt?.slice(0, 500),
      })),
    });
  }
}
```

---

### المرحلة 12.5 — RAGAS Evaluation (4 أيام)

```typescript
// src/lib/rag/evaluation/ragas-runner.ts
export class RAGASEvaluator {
  constructor(private judge: ChatGoogleGenerativeAI) {}

  async evaluate(testCase: GoldenTestCase, response: RAGResponse): Promise<EvaluationResult> {
    const [faithfulness, answerRelevance, contextPrecision, contextRecall] = await Promise.all([
      this.faithfulness(testCase.query, response.answer, response.retrievedChunks),
      this.answerRelevance(testCase.query, response.answer),
      this.contextPrecision(testCase.query, response.retrievedChunks),
      this.contextRecall(testCase.query, response.retrievedChunks, testCase.expectedContext),
    ]);

    return {
      query: testCase.query,
      scores: { faithfulness, answerRelevance, contextPrecision, contextRecall },
      overall: (faithfulness + answerRelevance + contextPrecision + contextRecall) / 4,
    };
  }

  // Faithfulness: هل الإجابة تنبع من السياق؟ (لا hallucination)
  private async faithfulness(query: string, answer: string, chunks: RetrievedChunk[]): Promise<number> {
    const prompt = `
استخرج كل ادعاءات (claims) الواقعية من الإجابة.
لكل ادعاء: حدد إن كان مدعوماً بالسياق التالي أم لا.

السؤال: ${query}
الإجابة: ${answer}
السياق:
${chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n')}

أجب بـ JSON:
{ "claims": [{ "claim": "...", "supported": true|false, "evidence": "..." }] }
`;
    const result = await this.judge.invoke(prompt);
    const parsed = JSON.parse(result.content as string);
    const supported = parsed.claims.filter((c: any) => c.supported).length;
    return supported / parsed.claims.length;
  }

  // Answer Relevance: هل الإجابة تعالج السؤال؟
  private async answerRelevance(query: string, answer: string): Promise<number> {
    // Generate questions from answer, then compare similarity to original query
    const generated = await this.judge.invoke(`
استخرج 3 أسئلة يمكن أن تكون الإجابة التالية إجابتها:
الإجابة: ${answer}
أجب بـ JSON: { "questions": ["q1", "q2", "q3"] }
`);
    const parsed = JSON.parse(generated.content as string);
    const queryEmbedding = await embedder.embed(query);
    const sims = await Promise.all(
      parsed.questions.map(async (q: string) => {
        const embedding = await embedder.embed(q);
        return cosineSimilarity(queryEmbedding, embedding);
      })
    );
    return sims.reduce((a, b) => a + b) / sims.length;
  }

  // Context Precision: هل القطع المسترجعة ذات صلة؟
  private async contextPrecision(query: string, chunks: RetrievedChunk[]): Promise<number> {
    const relevances = await Promise.all(
      chunks.map(async (chunk) => {
        const result = await this.judge.invoke(
          `هل هذا المحتوى ذو صلة بالسؤال؟ أجب بـ "نعم" أو "لا" فقط.\nالسؤال: ${query}\nالمحتوى: ${chunk.content}`
        );
        return (result.content as string).includes('نعم') ? 1 : 0;
      })
    );
    return relevances.reduce((a, b) => a + b) / relevances.length;
  }

  // Context Recall: هل القطع تغطي كل المعلومات المتوقعة؟
  private async contextRecall(query: string, chunks: RetrievedChunk[], expected: string): Promise<number> {
    const result = await this.judge.invoke(`
هل المعلومات في "السياق المتوقع" مغطاة في "السياق المسترجع"؟
أجب بنسبة من 0 إلى 1.

السياق المتوقع: ${expected}
السياق المسترجع: ${chunks.map(c => c.content).join('\n')}
`);
    return parseFloat(result.content as string) || 0;
  }
}
```

```typescript
// scripts/run-ragas-eval.ts
async function runEvaluation() {
  const goldenSet = loadGoldenSet('all');
  const pipeline = createRAGPipeline();
  const evaluator = new RAGASEvaluator(judgeLLM);

  const results = [];
  for (const testCase of goldenSet) {
    const response = await pipeline.run({ query: testCase.query }, testCase.ctx);
    const evaluation = await evaluator.evaluate(testCase, response);
    results.push(evaluation);
  }

  const avg = {
    faithfulness: avgOf(results, 'faithfulness'),
    answerRelevance: avgOf(results, 'answerRelevance'),
    contextPrecision: avgOf(results, 'contextPrecision'),
    contextRecall: avgOf(results, 'contextRecall'),
  };

  console.log('RAGAS Scores:', avg);

  // Fail CI if below threshold
  if (avg.faithfulness < 0.85) {
    process.exit(1);
  }
}
```

---

### المرحلة 12.6 — Knowledge Sources Expansion (5 أيام محتوى)

```typescript
// مصادر المعرفة المقترحة
const KNOWLEDGE_SOURCES = [
  // 1. توثيق ZATCA الرسمي
  {
    type: 'zatca-docs',
    sources: [
      'https://zatca.gov.sa/ar/E-Invoicing/Pages/default.aspx',
      'XML Specification PDFs',
      'API Reference',
    ],
  },
  // 2. SOCPA Standards
  { type: 'socpa', sources: ['SOCPA Accounting Standards', 'Saudi GAAP'] },
  // 3. IFRS
  { type: 'ifrs', sources: ['IFRS 9, 15, 16 Arabic'] },
  // 4. Saudi Labor Law
  { type: 'labor-law', sources: ['Saudi Labor Law 2005 + amendments'] },
  // 5. GOSI Regulations
  { type: 'gosi', sources: ['GOSI Contribution Rules'] },
  // 6. Internal Policies
  { type: 'internal-policies', sources: ['Tenant-specific policies'] },
  // 7. Past Invoices (للسياق)
  { type: 'invoices', sources: ['Past invoices summary embeddings'] },
  // 8. Product Catalog
  { type: 'products', sources: ['Product descriptions + SKUs'] },
];
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| RAG quality (Faithfulness) | ~60% | > 85% |
| Citations | لا | في كل إجابة |
| HyDE | لا | متاح |
| Multi-query | لا | متاح |
| RAGAS evaluation | لا | تشغّل في CI |
| Knowledge sources | 1 | 8+ |
| Latency (full pipeline) | ~3s | < 1.5s |

---

## ⏱️ الجدول الزمني
- **المدة:** 18 يوم عمل + 5 أيام محتوى
- **الفريق:** 1 senior + 1 محتوى/CPA
- **الأولوية:** 🟠 عالية (لجودة الـ AI)

---

## ✅ معايير القبول
- [ ] Pipeline يدعم HyDE + Multi-query + Reranking
- [ ] Citations في كل إجابة مع scores
- [ ] RAGAS scores > 0.85 على golden set
- [ ] 8 knowledge sources مفهرسة
- [ ] CI يفشل لو RAGAS < threshold
- [ ] Latency p95 < 1.5s
- [ ] Cost per query < $0.001
