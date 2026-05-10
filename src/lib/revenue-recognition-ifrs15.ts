import { logger } from '@/lib/logger';

const log = logger.child({ service: 'revenue-recognition-ifrs15' });

/**
 * P0-07 — Revenue Recognition Engine (IFRS 15)
 * Five-step model: Identify contract → Identify obligations → Determine price → Allocate → Recognize
 */

export interface RevenueContract {
    contractId: string;
    customerId: string;
    totalPrice: number;
    obligations: PerformanceObligation[];
    startDate: string;
    endDate: string;
}

export interface PerformanceObligation {
    id: string;
    description: string;
    type: 'POINT_IN_TIME' | 'OVER_TIME';
    standalonePrice: number;
    allocatedPrice?: number;
    percentComplete?: number; // For over-time obligations
    recognizedRevenue?: number;
    milestones?: { date: string; percent: number }[];
}

/**
 * Step 3+4: Allocate transaction price to performance obligations
 * based on relative standalone selling prices.
 */
export function allocateTransactionPrice(contract: RevenueContract): RevenueContract {
    const totalStandalone = contract.obligations.reduce((sum: any, o: any) => sum + o.standalonePrice, 0);

    contract.obligations = contract.obligations.map(ob => ({
        ...ob,
        allocatedPrice: totalStandalone > 0
            ? (ob.standalonePrice / totalStandalone) * contract.totalPrice
            : contract.totalPrice / contract.obligations.length,
    }));

    return contract;
}

/**
 * Step 5: Calculate recognized revenue based on obligation type.
 * POINT_IN_TIME: full recognition when delivered.
 * OVER_TIME: recognize based on % completion (input or output method).
 */
export function calculateRecognizedRevenue(
    obligation: PerformanceObligation,
    asOfDate: string
): { recognized: number; deferred: number; method: string } {
    const allocated = obligation.allocatedPrice || 0;

    if (obligation.type === 'POINT_IN_TIME') {
        // Fully recognized or fully deferred
        const delivered = (obligation.percentComplete || 0) >= 100;
        return {
            recognized: delivered ? allocated : 0,
            deferred: delivered ? 0 : allocated,
            method: 'Point-in-time (delivery)',
        };
    }

    // OVER_TIME: Input method (% completion)
    const percent = Math.min(100, obligation.percentComplete || 0);
    const recognized = (percent / 100) * allocated;
    return {
        recognized: Math.round(recognized * 100) / 100,
        deferred: Math.round((allocated - recognized) * 100) / 100,
        method: `Over-time (${percent}% complete)`,
    };
}

/**
 * Generate full revenue schedule for a contract.
 */
export function generateRevenueSchedule(contract: RevenueContract): {
    contractId: string;
    totalPrice: number;
    totalRecognized: number;
    totalDeferred: number;
    obligations: {
        id: string;
        description: string;
        type: string;
        allocated: number;
        recognized: number;
        deferred: number;
        method: string;
    }[];
} {
    const allocated = allocateTransactionPrice({ ...contract });
    let totalRecognized = 0;
    let totalDeferred = 0;

    const schedule = allocated.obligations.map(ob => {
        const calc = calculateRecognizedRevenue(ob, new Date().toISOString());
        totalRecognized += calc.recognized;
        totalDeferred += calc.deferred;

        return {
            id: ob.id,
            description: ob.description,
            type: ob.type,
            allocated: ob.allocatedPrice || 0,
            recognized: calc.recognized,
            deferred: calc.deferred,
            method: calc.method,
        };
    });

    return {
        contractId: contract.contractId,
        totalPrice: contract.totalPrice,
        totalRecognized,
        totalDeferred,
        obligations: schedule,
    };
}

/**
 * Generate journal entries for revenue recognition.
 */
export function generateRevenueJournalEntries(schedule: ReturnType<typeof generateRevenueSchedule>): {
    date: string;
    entries: { account: string; debit: number; credit: number; description: string }[];
}[] {
    const journals: any[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const ob of schedule.obligations) {
        if (ob.recognized > 0) {
            journals.push({
                date: today,
                entries: [
                    { account: 'الإيراد المؤجل (Deferred Revenue)', debit: ob.recognized, credit: 0, description: `اعتراف إيراد: ${ob.description}` },
                    { account: 'إيراد الخدمات (Service Revenue)', debit: 0, credit: ob.recognized, description: `IFRS 15 - ${ob.method}` },
                ],
            });
        }
    }

    return journals;
}
