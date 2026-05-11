/**
 * Employee Performance Management Engine (Phase 26.3 - HR)
 * ──────────────────────────────────────────────────────────
 * Manages Employee Goals (OKRs / SMART), Appraisals, and 360 Feedback.
 * Automates the review cycle and calibration of ratings.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'EmployeePerformanceEngine' });

export type AppraisalStatus = 'DRAFT' | 'SELF_EVALUATION' | 'MANAGER_REVIEW' | 'HR_CALIBRATION' | 'COMPLETED';

export interface PerformanceGoal {
    title: string;
    description: string;
    weight: number; // Percentage (e.g., 25%)
    dueDate: Date;
}

export class EmployeePerformanceEngine {

    /**
     * Initializes a new Appraisal Cycle for an employee
     */
    static async initiateAppraisal(data: {
        employeeId: number;
        managerId: number;
        cycleName: string; // e.g., 'Q3 2026 Performance Review'
        startDate: Date;
        endDate: Date;
        tenantId: string;
        goals: PerformanceGoal[];
    }): Promise<any> {
        try {
            const p = prisma as any;
            if (!p.appraisalCycle) {
                log.warn('Appraisal schema not found. Mocking initiation.');
                return { id: Date.now(), ...data, status: 'DRAFT' };
            }

            // Ensure weights sum up to 100%
            const totalWeight = data.goals.reduce((sum, g) => sum + g.weight, 0);
            if (totalWeight !== 100) {
                throw new Error('Goal weights must sum exactly to 100%');
            }

            const appraisal = await p.appraisalCycle.create({
                data: {
                    employeeId: data.employeeId,
                    managerId: data.managerId,
                    cycleName: data.cycleName,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    status: 'SELF_EVALUATION',
                    tenantId: data.tenantId,
                    goals: {
                        create: data.goals
                    }
                }
            });

            log.info(`Initiated appraisal cycle ${data.cycleName} for employee ${data.employeeId}`);
            // TODO: Trigger Notification to Employee
            return appraisal;

        } catch (error: any) {
            log.error('Failed to initiate appraisal', { error: error.message });
            throw new Error(`Appraisal initiation failed: ${error.message}`);
        }
    }

    /**
     * Submits scores for the goals (either by employee for self-eval, or manager)
     */
    static async submitScores(
        appraisalId: number, 
        evaluatorId: number, 
        scores: { goalId: number, score: number, comments?: string }[]
    ): Promise<void> {
        const p = prisma as any;
        if (!p.appraisalCycle) return;

        const appraisal = await p.appraisalCycle.findUnique({ where: { id: appraisalId } });
        if (!appraisal) throw new Error('Appraisal not found');

        await prisma.$transaction(async (tx) => {
            let nextStatus: AppraisalStatus = appraisal.status;

            if (appraisal.status === 'SELF_EVALUATION') {
                if (evaluatorId !== appraisal.employeeId) throw new Error('Only the employee can self-evaluate');
                nextStatus = 'MANAGER_REVIEW';
            } else if (appraisal.status === 'MANAGER_REVIEW') {
                if (evaluatorId !== appraisal.managerId) throw new Error('Only the manager can review');
                nextStatus = 'HR_CALIBRATION';
            } else {
                throw new Error('Appraisal is not in a scorable state');
            }

            // Save scores
            for (const s of scores) {
                await (tx as any).appraisalScore.create({
                    data: {
                        appraisalId,
                        goalId: s.goalId,
                        evaluatorId,
                        score: s.score,
                        comments: s.comments
                    }
                });
            }

            // Update state
            await (tx as any).appraisalCycle.update({
                where: { id: appraisalId },
                data: { status: nextStatus }
            });

            log.info(`Scores submitted for appraisal ${appraisalId}. State moved to ${nextStatus}`);
        });
    }

    /**
     * Finalizes the appraisal during HR calibration, calculating the final weighted score.
     */
    static async finalizeAppraisal(appraisalId: number, finalRating?: number): Promise<number> {
        const p = prisma as any;
        if (!p.appraisalCycle) return 0;

        const appraisal = await p.appraisalCycle.findUnique({ 
            where: { id: appraisalId },
            include: { goals: true, scores: true }
        });

        if (!appraisal || appraisal.status !== 'HR_CALIBRATION') {
            throw new Error('Appraisal must be in HR_CALIBRATION state to be finalized');
        }

        let calculatedFinalScore = 0;

        // Calculate weighted average from manager scores
        const managerScores = appraisal.scores.filter((s: any) => s.evaluatorId === appraisal.managerId);
        
        for (const goal of appraisal.goals) {
            const mScore = managerScores.find((s: any) => s.goalId === goal.id);
            if (mScore) {
                calculatedFinalScore += (mScore.score * (goal.weight / 100));
            }
        }

        const exactFinalRating = finalRating ?? calculatedFinalScore;

        await p.appraisalCycle.update({
            where: { id: appraisalId },
            data: { 
                status: 'COMPLETED',
                finalScore: exactFinalRating,
                completedAt: new Date()
            }
        });

        log.info(`Appraisal ${appraisalId} finalized with score ${exactFinalRating}`);
        return exactFinalRating;
    }
}
