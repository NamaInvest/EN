import { Chain } from '../base/chain.interface';
import { BusinessContext } from '../../context/business-context';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'chains.reflexion.self-corrector' });

export async function selfCorrect<T>(
  chain: Chain<any, T>,
  input: any,
  ctx: BusinessContext,
  options: { maxAttempts?: number; criticPrompt?: string } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  let attempt = 0;
  let lastResult: T | null = null;
  let lastCritique: string | null = null;

  while (attempt < maxAttempts) {
    const enrichedInput = lastCritique
      ? { ...input, previousAttempt: lastResult, critique: lastCritique }
      : input;

    lastResult = await chain.execute(enrichedInput, ctx);

    // Dummy critique evaluation
    const critique = { acceptable: true, feedback: '' };

    if (critique.acceptable) return lastResult!;
    
    lastCritique = critique.feedback;
    attempt++;
  }

  return lastResult!;
}
