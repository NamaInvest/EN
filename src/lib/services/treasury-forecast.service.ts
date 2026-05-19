import { z } from 'zod';
import { FinancialTxClient, runFinancialTx } from '@/lib/db/transaction';
import { assertPeriodWritable } from '@/lib/governance/period-lock';
import { EnterpriseLogger } from '@/lib/observability/logger';

export const CashForecastPayloadSchema = z.object({
  scenarioId: z.string(),
  forecastDate: z.string(),
  weekNumber: z.number().int().min(1).max(52),
  category: z.enum(['AR_INFLOW', 'AP_OUTFLOW', 'PAYROLL', 'CAPEX', 'LOAN', 'TAX']),
  expectedAmount: z.number(),
  notes: z.string().optional()
});

export class TreasuryForecastService {
  /**
   * Add or update a liquidity forecast
   */
  static async upsertForecast(prisma: any, payload: any, tenantId: string, overrideContext: any) {
    const data = CashForecastPayloadSchema.parse(payload);
    
    return await runFinancialTx(prisma, async (tx: FinancialTxClient) => {
      // 1. Governance check - Ensure the period is open for the forecast date
      const forecastDate = new Date(data.forecastDate);
      await assertPeriodWritable({
        tenantId,
        postingDate: forecastDate,
        operationType: 'FORECAST',
        module: 'CashForecast',
        actor: overrideContext?.actorId || '0',
        overrideContext
      });

      // 2. Perform the database operation
      const forecast = await tx.liquidityForecast.create({
        data: {
          tenantId,
          scenarioId: data.scenarioId,
          forecastDate: forecastDate,
          weekNumber: data.weekNumber,
          category: data.category,
          expectedAmount: Math.round(data.expectedAmount * 10000) / 10000,
          notes: data.notes
        }
      });

      // 3. Trace operation
      EnterpriseLogger.traceFinancialTx('CASH_FORECAST_POST', 'FORECAST_CREATED', tenantId, {
        forecastId: forecast.id,
        category: data.category,
        expectedAmount: data.expectedAmount
      });

      return forecast;
    }, `cash-forecast-upsert-${tenantId}`);
  }
}
