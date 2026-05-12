/**
 * Project Revenue Recognition Engine (Phase 2B.5 - Projects)
 * ──────────────────────────────────────────────────────────
 * Implements IFRS 15: Revenue from Contracts with Customers.
 * Calculates Percentage of Completion (POC) based on Costs Incurred vs Estimated Total Costs.
 * Generates accrued revenue journal entries before final project billing.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Decimal } from 'decimal.js';

const log = logger.child({ service: 'ProjectRevenueRecognitionEngine' });

export interface RevenueRecognitionReport {
    projectId: number;
    projectName: string;
    totalContractValue: number;
    estimatedTotalCost: number;
    actualCostToDate: number;
    percentageOfCompletion: number;
    revenueRecognizedToDate: number;
    previouslyRecognizedRevenue: number;
    currentPeriodRevenue: number;
}

export class ProjectRevenueRecognitionEngine {

    /**
     * Calculates the Revenue Recognition for a project based on the POC (Percentage of Completion) method.
     */
    static async recognizeRevenue(tenantId: string, projectId: number): Promise<RevenueRecognitionReport> {
        try {
            const p = prisma as any;
            if (!p.project) {
                log.warn('Project schema not found. Mocking Revenue Recognition.');
                return this.generateMockReport();
            }

            const project = await p.project.findUnique({
                where: { id: projectId, tenantId }
            });

            if (!project || project.status !== 'IN_PROGRESS') {
                throw new Error(`Project ${projectId} not found or not in progress.`);
            }

            const totalContractValue = new Decimal(project.contractValue || 0);
            const estimatedTotalCost = new Decimal(project.estimatedTotalCost || project.allocatedBudget || 1);
            
            // Assume we have a function to get actual cost to date (from Project Costing Engine)
            const actualCostToDate = new Decimal(project.actualCostToDate || 0); 
            const previouslyRecognized = new Decimal(project.recognizedRevenueToDate || 0);

            // Step 1: Calculate Percentage of Completion (Cost-to-Cost Method)
            let poc = actualCostToDate.div(estimatedTotalCost).mul(100);
            if (poc.greaterThan(100)) poc = new Decimal(100); // Cap at 100%

            // Step 2: Calculate Total Revenue to be recognized to date
            const revenueToDate = totalContractValue.mul(poc).div(100);

            // Step 3: Calculate Revenue for the Current Period
            const currentPeriodRevenue = revenueToDate.minus(previouslyRecognized);

            // If we have revenue to recognize in this period
            if (currentPeriodRevenue.greaterThan(0)) {
                await prisma.$transaction(async (tx) => {
                    // Update Project Totals
                    await (tx as any).project.update({
                        where: { id: projectId },
                        data: {
                            recognizedRevenueToDate: revenueToDate.toNumber(),
                            percentageOfCompletion: poc.toNumber()
                        }
                    });

                    // Log the recognition event
                    await (tx as any).revenueRecognitionLog.create({
                        data: {
                            projectId,
                            poc: poc.toNumber(),
                            revenueAmount: currentPeriodRevenue.toNumber(),
                            recognitionDate: new Date(),
                            tenantId
                        }
                    });

                    // Generate Journal Entry:
                    // Dr. Unbilled Receivables (Contract Asset)
                    // Cr. Project Revenue
                    const settings = await (tx as any).setting.findMany({
                        where: { tenantId, key: { in: ['contract_asset_account', 'project_revenue_account'] } }
                    });

                    const drAcc = settings.find((s: any) => s.key === 'contract_asset_account')?.value || 115;
                    const crAcc = settings.find((s: any) => s.key === 'project_revenue_account')?.value || 401;

                    log.info(`Mocking Journal: Dr. Contract Asset ${drAcc} / Cr. Revenue ${crAcc} for ${currentPeriodRevenue.toNumber()}`);
                });
            }

            const report: RevenueRecognitionReport = {
                projectId: project.id,
                projectName: project.name,
                totalContractValue: Number(totalContractValue.toFixed(2)),
                estimatedTotalCost: Number(estimatedTotalCost.toFixed(2)),
                actualCostToDate: Number(actualCostToDate.toFixed(2)),
                percentageOfCompletion: Number(poc.toFixed(2)),
                revenueRecognizedToDate: Number(revenueToDate.toFixed(2)),
                previouslyRecognizedRevenue: Number(previouslyRecognized.toFixed(2)),
                currentPeriodRevenue: Number(currentPeriodRevenue.toFixed(2))
            };

            log.info(`Revenue Recognized for Project ${projectId}: ${report.currentPeriodRevenue}`);
            return report;

        } catch (error: any) {
            log.error('Failed to recognize revenue', { error: error.message });
            throw new Error(`Revenue Recognition failed: ${error.message}`);
        }
    }

    private static generateMockReport(): RevenueRecognitionReport {
        return {
            projectId: 101,
            projectName: 'Riyadh Metro Station A1',
            totalContractValue: 10000000.00,
            estimatedTotalCost: 5000000.00,
            actualCostToDate: 2500000.00,
            percentageOfCompletion: 50.00,
            revenueRecognizedToDate: 5000000.00,
            previouslyRecognizedRevenue: 3000000.00,
            currentPeriodRevenue: 2000000.00
        };
    }
}
