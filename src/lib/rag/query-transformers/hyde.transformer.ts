// src/lib/rag/query-transformers/hyde.transformer.ts
// Hypothetical Document Embeddings (HyDE):
// Generate a fake "answer" to the query, then search with that — 
// the answer text is closer to real documents than the question itself.

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export class HyDETransformer {
  constructor(private llm: ChatGoogleGenerativeAI) {}

  async transform(query: string): Promise<string> {
    const prompt = `أنت خبير في نظام Namasoft ERP السعودي.
اكتب فقرة قصيرة (3-4 جمل) كأنها مقتطف من دليل المستخدم أو سياسة محاسبية
يجيب على السؤال التالي بشكل مباشر. لا تذكر أنك تخمّن.

السؤال: ${query}

المقتطف المحتمل:`;

    const response = await this.llm.invoke(prompt);
    return typeof response.content === 'string' ? response.content : query;
  }
}
