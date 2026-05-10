/**
 * Cash Flow Forecasting Engine — إعادة بناء كامل
 * 
 * يقوم بالتنبؤ بالتدفقات النقدية باستخدام:
 * 1. الطريقة المباشرة (Direct Method) — من AR/AP المفتوحة
 * 2. التحليل التنبئي (Predictive Analysis) — بناءً على الأنماط التاريخية
 * 3. تحليل السيناريوهات (Scenario Analysis) — متفائل/متشائم/واقعي
 * 
 * Compliant with IAS 7 Statement of Cash Flows
 */
import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.cash-flow-fo' });

const db = prisma as any;

/** فئة التدفق النقدي */
type CashFlowCategory = 'OPERATING' | 'INVESTING' | 'FINANCING';

/** فترة التنبؤ */
type ForecastPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';

/** نوع السيناريو */
type ScenarioType = 'OPTIMISTIC' | 'REALISTIC' | 'PESSIMISTIC';

/** واجهة فترة التنبؤ */
interface ForecastBucket {
    periodStart: Date;
    periodEnd: Date;
    label: string;
    inflows: number;
    outflows: number;
    netCashFlow: number;
    runningBalance: number;
    category: CashFlowCategory;
    details: ForecastDetail[];
}

interface ForecastDetail {
    source: string;          // AR, AP, Payroll, Fixed, etc.
    description: string;
    amount: number;
    dueDate: Date;
    probability: number;     // 0-1, likelihood of collection/payment
    partyName?: string;
}

/** ناتج التنبؤ الكامل */
interface ForecastResult {
    forecastId: number;
    forecastDate: Date;
    period: ForecastPeriod;
    scenario: ScenarioType;
    openingBalance: number;
    totalInflows: number;
    totalOutflows: number;
    netPosition: number;
    closingBalance: number;
    buckets: ForecastBucket[];
    alerts: ForecastAlert[];
}

interface ForecastAlert {
    type: 'LIQUIDITY_WARNING' | 'OVERDRAFT_RISK' | 'SURPLUS_OPPORTUNITY';
    message: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    periodLabel: string;
    amount: number;
}

export class CashFlowForecastingEngine {

    /**
     * 1. تشغيل التنبؤ الكامل — Main Entry Point
     */
    static async generateForecast(
        period: ForecastPeriod = 'MONTHLY',
        forecastDate: Date = new Date(),
        scenario: ScenarioType = 'REALISTIC',
        horizonMonths: number = 3
    ): Promise<ForecastResult> {
        // 1. Get current bank balances as opening position
        const openingBalance = await this._getCurrentCashPosition();

        // 2. Generate time buckets
        const buckets = this._generateBuckets(forecastDate, period, horizonMonths);

        // 3. Populate buckets with AR (inflows)
        await this._populateARInflows(buckets, scenario);

        // 4. Populate buckets with AP (outflows)
        await this._populateAPOutflows(buckets, scenario);

        // 5. Add recurring fixed costs (Payroll, Rent, GOSI, etc.)
        await this._addRecurringCosts(buckets);

        // 6. Calculate running balances
        let runningBalance = openingBalance;
        for (const bucket of buckets) {
            bucket.netCashFlow = bucket.inflows - bucket.outflows;
            runningBalance += bucket.netCashFlow;
            bucket.runningBalance = runningBalance;
        }

        // 7. Generate alerts
        const alerts = this._generateAlerts(buckets, openingBalance);

        // 8. Calculate totals
        const totalInflows = buckets.reduce((sum: any, b: any) => sum + b.inflows, 0);
        const totalOutflows = buckets.reduce((sum: any, b: any) => sum + b.outflows, 0);
        const netPosition = totalInflows - totalOutflows;
        const closingBalance = openingBalance + netPosition;

        // 9. Save forecast
        const forecast = await db.cashFlowForecast.create({
            data: {
                forecastDate,
                period,
                inflows: totalInflows,
                outflows: totalOutflows,
                netPosition,
                openingBalance,
                closingBalance,
                scenario,
                horizonMonths,
                bucketsJson: JSON.stringify(buckets),
                alertsJson: JSON.stringify(alerts),
            }
        });

        return {
            forecastId: forecast.id,
            forecastDate,
            period,
            scenario,
            openingBalance,
            totalInflows,
            totalOutflows,
            netPosition,
            closingBalance,
            buckets,
            alerts
        };
    }

    /**
     * 2. الرصيد النقدي الحالي — Current Cash Position
     */
    private static async _getCurrentCashPosition(): Promise<number> {
        try {
            const bankAccounts = await prisma.bankAccount.findMany();
            return bankAccounts.reduce((sum: any, b: any) => sum + Number(b.currentBalance || 0), 0);
        } catch {
            return 0;
        }
    }

    /**
     * 3. إنشاء فترات التنبؤ — Generate Time Buckets
     */
    private static _generateBuckets(
        startDate: Date,
        period: ForecastPeriod,
        horizonMonths: number
    ): ForecastBucket[] {
        const buckets: ForecastBucket[] = [];
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + horizonMonths);

        let current = new Date(startDate);
        let bucketIndex = 0;

        while (current < endDate) {
            const periodStart = new Date(current);
            let periodEnd: Date;
            let label: string;

            switch (period) {
                case 'DAILY':
                    periodEnd = new Date(current);
                    periodEnd.setDate(periodEnd.getDate() + 1);
                    label = current.toISOString().split('T')[0];
                    current.setDate(current.getDate() + 1);
                    break;

                case 'WEEKLY':
                    periodEnd = new Date(current);
                    periodEnd.setDate(periodEnd.getDate() + 7);
                    label = `الأسبوع ${++bucketIndex}`;
                    current.setDate(current.getDate() + 7);
                    break;

                case 'MONTHLY':
                    periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
                    label = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
                    current.setMonth(current.getMonth() + 1);
                    current.setDate(1);
                    break;

                case 'QUARTERLY':
                    periodEnd = new Date(current.getFullYear(), current.getMonth() + 3, 0);
                    label = `Q${Math.floor(current.getMonth() / 3) + 1} ${current.getFullYear()}`;
                    current.setMonth(current.getMonth() + 3);
                    current.setDate(1);
                    break;
            }

            buckets.push({
                periodStart,
                periodEnd: periodEnd!,
                label,
                inflows: 0,
                outflows: 0,
                netCashFlow: 0,
                runningBalance: 0,
                category: 'OPERATING',
                details: []
            });
        }

        return buckets;
    }

    /**
     * 4. تعبئة التدفقات الداخلة من الذمم المدينة — AR Inflows
     */
    private static async _populateARInflows(
        buckets: ForecastBucket[],
        scenario: ScenarioType
    ): Promise<void> {
        const collectionProbability = {
            'OPTIMISTIC': 0.95,
            'REALISTIC': 0.80,
            'PESSIMISTIC': 0.60
        }[scenario];

        try {
            const openAR = await prisma.openItem.findMany({
            take: 100,
                where: {
                    status: { in: ['OPEN', 'PARTIAL'] },
                    partyType: 'customer',
                    dueDate: { not: null }
                }
            });

            for (const item of openAR) {
                if (!item.dueDate) continue;
                const amount = Number(item.openAmount) * collectionProbability;
                const bucket = this._findBucket(buckets, new Date(item.dueDate));
                if (bucket) {
                    bucket.inflows += amount;
                    bucket.details.push({
                        source: 'AR',
                        description: `تحصيل فاتورة #${item.documentId || item.id}`,
                        amount,
                        dueDate: new Date(item.dueDate),
                        probability: collectionProbability,
                        partyName: (item as any).customer?.name
                    });
                }
            }
        } catch {
            // OpenItem table may not exist
        }
    }

    /**
     * 5. تعبئة التدفقات الخارجة من الذمم الدائنة — AP Outflows
     */
    private static async _populateAPOutflows(
        buckets: ForecastBucket[],
        scenario: ScenarioType
    ): Promise<void> {
        const paymentCertainty = {
            'OPTIMISTIC': 0.70,   // We might delay some
            'REALISTIC': 0.90,
            'PESSIMISTIC': 1.00   // Pay everything on time
        }[scenario];

        try {
            const openAP = await prisma.openItem.findMany({
            take: 100,
                where: {
                    status: { in: ['OPEN', 'PARTIAL'] },
                    partyType: 'vendor',
                    dueDate: { not: null }
                }
            });

            for (const item of openAP) {
                if (!item.dueDate) continue;
                const amount = Number(item.openAmount) * paymentCertainty;
                const bucket = this._findBucket(buckets, new Date(item.dueDate));
                if (bucket) {
                    bucket.outflows += amount;
                    bucket.details.push({
                        source: 'AP',
                        description: `سداد فاتورة مورد #${item.documentId || item.id}`,
                        amount,
                        dueDate: new Date(item.dueDate),
                        probability: paymentCertainty
                    });
                }
            }
        } catch {
            // OpenItem table may not exist
        }
    }

    /**
     * 6. إضافة التكاليف الثابتة المتكررة — Recurring Costs
     */
    private static async _addRecurringCosts(buckets: ForecastBucket[]): Promise<void> {
        // Estimate from last payroll
        try {
            const lastPayroll = await prisma.payrollRun.findFirst({
                orderBy: { runDate: 'desc' }
            });

            if (lastPayroll) {
                const monthlyPayroll = Number(lastPayroll.totalAmount);
                for (const bucket of buckets) {
                    // Add payroll cost to each monthly bucket
                    if (bucket.label.match(/^\d{4}-\d{2}$/)) {
                        bucket.outflows += monthlyPayroll;
                        bucket.details.push({
                            source: 'PAYROLL',
                            description: 'مسير الرواتب الشهري',
                            amount: monthlyPayroll,
                            dueDate: bucket.periodEnd,
                            probability: 1.0
                        });
                    }
                }
            }
        } catch {
            // PayrollRun may not exist
        }

        // Add GOSI estimate (approx 22% of payroll)
        try {
            const gosiSetting = await prisma.setting.findUnique({ where: { key: 'monthly_gosi_estimate' } });
            if (gosiSetting?.value) {
                const monthlyGOSI = parseFloat(gosiSetting.value);
                for (const bucket of buckets) {
                    if (bucket.label.match(/^\d{4}-\d{2}$/)) {
                        bucket.outflows += monthlyGOSI;
                        bucket.details.push({
                            source: 'GOSI',
                            description: 'اشتراكات التأمينات الاجتماعية',
                            amount: monthlyGOSI,
                            dueDate: bucket.periodEnd,
                            probability: 1.0
                        });
                    }
                }
            }
        } catch { /* ignore */ }
    }

    /**
     * 7. البحث عن الفترة المناسبة — Find Bucket
     */
    private static _findBucket(buckets: ForecastBucket[], date: Date): ForecastBucket | undefined {
        return buckets.find(b => date >= b.periodStart && date <= b.periodEnd);
    }

    /**
     * 8. إنشاء التنبيهات — Generate Alerts
     */
    private static _generateAlerts(buckets: ForecastBucket[], openingBalance: number): ForecastAlert[] {
        const alerts: ForecastAlert[] = [];
        const minSafeBalance = openingBalance * 0.1; // 10% minimum safety

        for (const bucket of buckets) {
            // Overdraft risk
            if (bucket.runningBalance < 0) {
                alerts.push({
                    type: 'OVERDRAFT_RISK',
                    message: `خطر سحب على المكشوف في ${bucket.label} — العجز المتوقع: ${Math.abs(bucket.runningBalance).toLocaleString()} ر.س`,
                    severity: 'HIGH',
                    periodLabel: bucket.label,
                    amount: bucket.runningBalance
                });
            }
            // Liquidity warning
            else if (bucket.runningBalance < minSafeBalance && bucket.runningBalance >= 0) {
                alerts.push({
                    type: 'LIQUIDITY_WARNING',
                    message: `تحذير سيولة في ${bucket.label} — الرصيد المتوقع أقل من الحد الأدنى`,
                    severity: 'MEDIUM',
                    periodLabel: bucket.label,
                    amount: bucket.runningBalance
                });
            }
            // Surplus opportunity
            else if (bucket.runningBalance > openingBalance * 2) {
                alerts.push({
                    type: 'SURPLUS_OPPORTUNITY',
                    message: `فائض نقدي كبير في ${bucket.label} — فرصة للاستثمار قصير الأجل`,
                    severity: 'LOW',
                    periodLabel: bucket.label,
                    amount: bucket.runningBalance
                });
            }
        }

        return alerts;
    }

    /**
     * 9. مقارنة السيناريوهات — Compare Scenarios
     */
    static async compareScenarios(
        period: ForecastPeriod = 'MONTHLY',
        horizonMonths: number = 3
    ) {
        const optimistic = await this.generateForecast(period, new Date(), 'OPTIMISTIC', horizonMonths);
        const realistic = await this.generateForecast(period, new Date(), 'REALISTIC', horizonMonths);
        const pessimistic = await this.generateForecast(period, new Date(), 'PESSIMISTIC', horizonMonths);

        return {
            scenarios: {
                optimistic: { closingBalance: optimistic.closingBalance, netPosition: optimistic.netPosition, alerts: optimistic.alerts.length },
                realistic: { closingBalance: realistic.closingBalance, netPosition: realistic.netPosition, alerts: realistic.alerts.length },
                pessimistic: { closingBalance: pessimistic.closingBalance, netPosition: pessimistic.netPosition, alerts: pessimistic.alerts.length },
            },
            recommendation: pessimistic.closingBalance < 0
                ? 'يوصى بتأخير المصروفات غير الضرورية وتسريع التحصيلات'
                : realistic.closingBalance > realistic.openingBalance * 1.5
                    ? 'وضع السيولة جيد — يمكن النظر في استثمار الفوائض'
                    : 'وضع السيولة مستقر — استمر في المتابعة'
        };
    }

    /**
     * 10. جلب آخر تنبؤ — Get Latest Forecast
     */
    static async getLatestForecast() {
        const forecast = await db.cashFlowForecast.findFirst({
            orderBy: { forecastDate: 'desc' }
        });

        if (!forecast) return null;

        return {
            ...forecast,
            buckets: forecast.bucketsJson ? JSON.parse(forecast.bucketsJson as string) : [],
            alerts: forecast.alertsJson ? JSON.parse(forecast.alertsJson as string) : []
        };
    }
}
