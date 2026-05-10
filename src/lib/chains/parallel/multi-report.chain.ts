import { z } from 'zod';
import { Chain } from '../base/chain.interface';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'chains.parallel.multi-report.chain' });

export const multiReportChain: Chain<any, any> = {
  name: 'parallel.multi_report',
  description: 'يولّد تقارير متعددة بالتوازي',
  inputSchema: z.object({ period: z.string() }),
  outputSchema: z.object({ url: z.string() }),

  async execute(input, ctx) {
    // Dummy parallel execution
    const [pl, bs, cf] = await Promise.all([
      Promise.resolve({ name: 'pl' }),
      Promise.resolve({ name: 'bs' }),
      Promise.resolve({ name: 'cf' }),
    ]);

    return { url: 'https://cdn.namasoft.com/reports/consolidated.pdf' };
  },
};
