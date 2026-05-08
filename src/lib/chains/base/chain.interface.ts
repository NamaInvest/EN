import { z } from 'zod';
import { BusinessContext } from '../../context/business-context';

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
      console.log(`[ChainRunner] Successfully ran ${chain.name} in ${Date.now() - start}ms`);

      return validatedOutput;
    } catch (error: any) {
      console.error(`[ChainRunner] Failed to run ${chain.name}`, error.message);
      throw error;
    }
  }
}
