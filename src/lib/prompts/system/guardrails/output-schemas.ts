import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.prompts.syst' });

export const CFOAlertSchema = z.object({
  level: z.enum(['critical', 'warning', 'info']),
  category: z.enum(['cash', 'ar', 'ap', 'profit', 'compliance']),
  title: z.string().max(100),
  message: z.string().max(500),
  affectedAmount: z.number().optional(),
  recommendation: z.string().max(300),
  actions: z.array(z.object({
    label: z.string(),
    route: z.string(),
  })).max(3),
});

export const CFOResponseSchema = z.object({
  summary: z.string().max(1000),
  alerts: z.array(CFOAlertSchema),
  metrics: z.record(z.string(), z.number()),
  generatedAt: z.string().datetime(),
});
