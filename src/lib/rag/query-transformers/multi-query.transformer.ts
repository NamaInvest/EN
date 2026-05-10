import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'rag.query-transformers.multi-query.trans' });

export class MultiQueryTransformer {
  constructor(private llm: ChatGoogleGenerativeAI) {}

  async generate(query: string, count: number = 3): Promise<string[]> {
    const prompt = `
أعد صياغة السؤال التالي بـ ${count} طرق مختلفة لزيادة احتمال إيجاد الإجابة.
كل صياغة تركز على جانب مختلف.

السؤال الأصلي: ${query}

الصياغات (واحدة في كل سطر، بدون ترقيم):
`;

    // Stub generation
    log.info(`[MultiQuery] Generating ${count} variations for: ${query}`);
    return [`Variation 1 of ${query}`, `Variation 2 of ${query}`];
  }
}
