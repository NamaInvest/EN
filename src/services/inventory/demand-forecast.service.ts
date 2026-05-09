/**
 * Demand Forecasting Service
 * Uses historical SalesInvoiceDetail for statistical forecasting
 */
import { PrismaClient } from '@prisma/client';

export type ForecastMethod = 'MOVING_AVERAGE' | 'WEIGHTED_MOVING_AVERAGE' | 'EXPONENTIAL_SMOOTHING';

export interface DemandForecast {
  productId: number;
  productName: string;
  method: ForecastMethod;
  periods: { period: string; actual: number | null; forecast: number; error: number | null }[];
  mae: number; // Mean Absolute Error
  accuracy: number;
}

export class DemandForecastService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Forecast demand for a product using moving average
   */
  async forecast(tenantId: string, productId: number, months: number = 3, method: ForecastMethod = 'MOVING_AVERAGE'): Promise<DemandForecast> {
    const product = await this.prisma.product.findFirstOrThrow({
      where: { id: productId, tenantId },
      select: { id: true, name: true },
    });

    // Get last 12 months of sales data
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 12);

    const salesData = await this.prisma.salesInvoiceDetail.findMany({
      where: {
        tenantId,
        productId,
        invoice: { deletedAt: null, date: { gte: fromDate } },
      },
      include: { invoice: { select: { date: true } } },
    });

    // Aggregate by month
    const monthlyMap = new Map<string, number>();
    for (const item of salesData) {
      const d = item.invoice.date;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(item.quantity));
    }

    // Sort and pad months
    const sortedMonths = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const actuals = sortedMonths.map(([, qty]) => qty);

    const forecasts: number[] = [];
    const alpha = 0.3; // ETS smoothing factor

    for (let i = 0; i < actuals.length; i++) {
      if (i < months) {
        forecasts.push(actuals[i]); // No forecast until we have enough history
        continue;
      }

      const window = actuals.slice(i - months, i);
      let f: number;
      if (method === 'MOVING_AVERAGE') {
        f = window.reduce((s, v) => s + v, 0) / window.length;
      } else if (method === 'WEIGHTED_MOVING_AVERAGE') {
        const weights = window.map((_, idx) => idx + 1);
        const totalWeight = weights.reduce((s, w) => s + w, 0);
        f = window.reduce((s, v, idx) => s + v * weights[idx], 0) / totalWeight;
      } else {
        // Exponential smoothing
        f = actuals[i - 1] !== undefined ? alpha * actuals[i - 1] + (1 - alpha) * (forecasts[i - 1] ?? actuals[i - 1]) : actuals[i];
      }
      forecasts.push(Math.max(0, Math.round(f)));
    }

    // Add future period forecasts
    const today = new Date();
    const futurePeriods: { period: string; actual: null; forecast: number; error: null }[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const lastForecast = forecasts[forecasts.length - 1] ?? 0;
      futurePeriods.push({ period: key, actual: null, forecast: lastForecast, error: null });
    }

    // Calculate MAE
    const errors = actuals.slice(months).map((a, i) => Math.abs(a - (forecasts[i + months] ?? 0)));
    const mae = errors.length > 0 ? errors.reduce((s, e) => s + e, 0) / errors.length : 0;
    const avgActual = actuals.length > 0 ? actuals.reduce((s, v) => s + v, 0) / actuals.length : 1;
    const accuracy = Math.max(0, Math.round((1 - mae / Math.max(avgActual, 1)) * 10000) / 100);

    const historicPeriods = sortedMonths.map(([period], i) => ({
      period,
      actual: actuals[i],
      forecast: forecasts[i] ?? actuals[i],
      error: i >= months ? Math.abs(actuals[i] - (forecasts[i] ?? actuals[i])) : null,
    }));

    return {
      productId,
      productName: product.name,
      method,
      periods: [...historicPeriods, ...futurePeriods],
      mae: Math.round(mae * 100) / 100,
      accuracy,
    };
  }

  /**
   * Get reorder recommendations
   */
  async getReorderRecommendations(tenantId: string): Promise<{
    productId: number;
    productName: string;
    currentStock: number;
    forecastedDemand: number;
    reorderPoint: number;
    suggestedOrderQty: number;
  }[]> {
    const products = await this.prisma.product.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true, currentStock: true, minQuantity: true },
      take: 100,
    });

    const recommendations = [];
    for (const p of products) {
      const currentStock = Number(p.currentStock ?? 0);
      const reorderPoint = Number(p.minQuantity ?? 0);

      if (currentStock <= reorderPoint) {
        try {
          const forecast = await this.forecast(tenantId, p.id, 3);
          const nextMonthForecast = forecast.periods.find((f) => f.actual === null)?.forecast ?? 0;

          recommendations.push({
            productId: p.id,
            productName: p.name,
            currentStock,
            forecastedDemand: nextMonthForecast,
            reorderPoint,
            suggestedOrderQty: Math.max(nextMonthForecast * 2, reorderPoint * 2),
          });
        } catch { /* skip products with no history */ }
      }
    }

    return recommendations;
  }
}
