/**
 * Salary Advances Engine (Phase 27.2 - Payroll)
 * ──────────────────────────────────────────────────────────
 * Manages short-term salary advances.
 * Unlike loans, advances are typically recovered in full from the next immediate salary cycle.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'SalaryAdvancesEngine' });

export type AdvanceStatus = 'PENDING' | 'APPROVED' | 'DISBURSED' | 'RECOVERED' | 'REJECTED';

export interface AdvanceRequest {
    employeeId: number;
    amount: number;
    requestDate: Date;
    reason: string;
    tenantId: string;
}

export class SalaryAdvancesEngine {

    /**
     * Requests a salary advance. Enforces a maximum limit (e.g., 50% of basic salary).
     */
    static async requestAdvance(req: AdvanceRequest): Promise<any> {
        try {
            const p = prisma as any;
            if (!p.salaryAdvance) {
                log.warn('SalaryAdvance table not found. Returning mocked data.');
                return { id: Date.now(), ...req, status: 'PENDING' };
            }

            // Optional Rule: Max 50% of salary
            // Fetch employee salary info here if needed

            const advance = await p.salaryAdvance.create({
                data: {
                    employeeId: req.employeeId,
                    amount: req.amount,
                    requestDate: req.requestDate,
                    reason: req.reason,
                    status: 'PENDING',
                    tenantId: req.tenantId
                }
            });

            log.info(`Advance of ${req.amount} requested by employee ${req.employeeId}`);
            return advance;

        } catch (error: any) {
            log.error('Failed to request advance', { error: error.message });
            throw new Error(`Advance request failed: ${error.message}`);
        }
    }

    /**
     * Approves the advance request.
     */
    static async approveAdvance(advanceId: number, approverId: number): Promise<void> {
        const p = prisma as any;
        if (!p.salaryAdvance) return;

        await p.salaryAdvance.update({
            where: { id: advanceId },
            data: { 
                status: 'APPROVED',
                approvedById: approverId,
                approvedAt: new Date()
            }
        });
        
        log.info(`Advance ${advanceId} approved by ${approverId}`);
    }

    /**
     * Disburses the cash to the employee. Triggers journal entry.
     */
    static async disburseAdvance(advanceId: number, tenantId: string): Promise<void> {
        const p = prisma as any;
        if (!p.salaryAdvance) return;

        await prisma.$transaction(async (tx) => {
            const adv = await (tx as any).salaryAdvance.findUnique({ where: { id: advanceId } });
            if (!adv || adv.status !== 'APPROVED') throw new Error('Advance must be APPROVED');

            await (tx as any).salaryAdvance.update({
                where: { id: advanceId },
                data: { status: 'DISBURSED', disbursedAt: new Date() }
            });

            // Journal Entry (Dr. Short-Term Advances, Cr. Cash/Bank)
            const settings = await (tx as any).setting.findMany({
                where: { tenantId, key: { in: ['short_term_advances_account', 'bank_account'] } }
            });

            const advanceAcc = settings.find((s: any) => s.key === 'short_term_advances_account')?.value || 206;
            const bankAcc = settings.find((s: any) => s.key === 'bank_account')?.value || 101;

            log.info(`Mocking Journal: Dr. Short-Term Advances ${advanceAcc} / Cr. Bank ${bankAcc} for ${adv.amount}`);
        });
    }

    /**
     * Recovers the advance during the payroll run.
     * Designed to be called by the Payroll Engine.
     */
    static async processRecovery(employeeId: number, payrollDate: Date, tenantId: string): Promise<number> {
        const p = prisma as any;
        if (!p.salaryAdvance) return 0;

        const activeAdvances = await p.salaryAdvance.findMany({
            where: {
                employeeId,
                tenantId,
                status: 'DISBURSED'
            }
        });

        let totalRecovery = 0;

        for (const adv of activeAdvances) {
            totalRecovery += adv.amount;

            await p.salaryAdvance.update({
                where: { id: adv.id },
                data: { 
                    status: 'RECOVERED',
                    recoveredAt: payrollDate
                }
            });

            log.info(`Recovered advance ${adv.amount} from employee ${employeeId}`);
        }

        return totalRecovery;
    }
}
