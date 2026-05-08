// src/lib/rag/query-transformers/multi-query.transformer.ts
// Generates N rephrased versions of the query to maximize recall.
// Different phrasings surface different documents in the corpus.

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export class MultiQueryTransformer {
  constructor(private llm: ChatGoogleGenerativeAI) {}

  async generate(query: string, count = 3): Promise<string[]> {
    const prompt = `أعد صياغة السؤال التالي بـ ${count} طرق مختلفة لزيادة احتمال إيجاد الإجابة.
كل صياغة تركز على جانب مختلف من السؤال.
أجب بالصياغات فقط، واحدة في كل سطر، بدون ترقيم أو مقدمة.

السؤال الأصلي: ${query}`;

    const response = await this.llm.invoke(prompt);
    const text = typeof response.content === 'string' ? response.content : '';

    return text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 10)
      .slice(0, count);
  }
}
