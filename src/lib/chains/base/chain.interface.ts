import { z } from 'zod';
import { BusinessContext } from '../../context/business-context';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'chains.base.chain.interface' });

export interface Chain<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  execute(input: TInput, ctx: BusinessContext): Promise<TOutput>;
  estimatedCost?: number;
  estimatedLatencyMs?: number;
}

export class ChainRunner {
  async run<I, O>(chain: Chain<I, O>, input: I, ctx: BusinessContext): Promise<O> {
    const validated = chain.inputSchema.parse(input);
    const start = Date.now();

    try {
      const output = await chain.execute(validated, ctx);
      const validatedOutput = chain.outputSchema.parse(output);

      // log execution stub
      log.info(`[ChainRunner] Successfully ran ${chain.name} in ${Date.now() - start}ms`);

      return validatedOutput;
    } catch (error: any) {
      log.error(`[ChainRunner] Failed to run ${chain.name}`, error.message);
      throw error;
    }
  }
}
