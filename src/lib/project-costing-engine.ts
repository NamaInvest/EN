/**
 * Project Costing Engine (Phase 2B.4 - Projects)
 * ──────────────────────────────────────────────────────────
 * Aggregates Direct Labor, Material Costs, and Equipment Costs per project.
 * Compares Actual Cost vs Allocated Budget.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Decimal } from 'decimal.js';

const log = logger.child({ service: 'ProjectCostingEngine' });

export interface ProjectCostReport {
    projectId: number;
    projectName: string;
    totalBudget: number;
    actualLaborCost: number;
    actualMaterialCost: number;
    actualEquipmentCost: number;
    totalActualCost: number;
    variance: number;
    isOverBudget: boolean;
}

export interface EVMReport {
    projectId: number;
    asOfDate: Date;
    BCWS: number; // Budgeted Cost of Work Scheduled (Planned Value)
    BCWP: number; // Budgeted Cost of Work Performed (Earned Value)
    ACWP: number; // Actual Cost of Work Performed (Actual Cost)
    CV: number;   // Cost Variance (BCWP - ACWP)
    SV: number;   // Schedule Variance (BCWP - BCWS)
    CPI: number;  // Cost Performance Index (BCWP / ACWP)
    SPI: number;  // Schedule Performance Index (BCWP / BCWS)
    BAC: number;  // Budget at Completion
    EAC: number;  // Estimate at Completion (BAC / CPI)
    ETC: number;  // Estimate to Complete (EAC - ACWP)
    healthStatus: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';
}

export class ProjectCostingEngine {

    /**
     * Calculates Earned Value Management (EVM) metrics per PMI standards.
     * 🛡️ Business Logic Hardening: Prevents division by zero for CPI/SPI.
     */
    static async compute_EVM(tenantId: string, projectId: number, asOfDate: Date = new Date()): Promise<EVMReport> {
        try {
            const p = prisma as any;
            if (!p.project) {
                log.warn('Project schema not found. Mocking EVM Report.');
                return this.generateMockEVMReport();
            }

            // 1. Fetch Project, Tasks, and actuals
            const project = await p.project.findUnique({
                where: { id: projectId, tenantId },
                include: {
                    tasks: true, // Requires tasks to have plannedCost, actualCost, completionPercentage, startDate, endDate
                }
            });

            if (!project) throw new Error(`Project ${projectId} not found.`);

            let BCWS = new Decimal(0); // Planned Value
            let BCWP = new Decimal(0); // Earned Value
            let ACWP = new Decimal(0); // Actual Cost
            let BAC = new Decimal(project.allocatedBudget || 0);

            if (project.tasks && project.tasks.length > 0) {
                for (const task of project.tasks) {
                    const taskBudget = new Decimal(task.plannedCost || 0);
                    const taskActual = new Decimal(task.actualCost || 0);
                    const percentComplete = new Decimal(task.completionPercentage || 0).div(100);

                    // BCWP = Budget * % Complete
                    BCWP = BCWP.plus(taskBudget.mul(percentComplete));
                    
                    // ACWP = Sum of actual costs
                    ACWP = ACWP.plus(taskActual);

                    // BCWS = Budget * % Scheduled (Simplified time-based pro-rata)
                    if (task.startDate && task.endDate) {
                        const totalDuration = task.endDate.getTime() - task.startDate.getTime();
                        const elapsed = asOfDate.getTime() - task.startDate.getTime();
                        let percentScheduled = totalDuration > 0 ? elapsed / totalDuration : 0;
                        percentScheduled = Math.max(0, Math.min(1, percentScheduled)); // Clamp between 0 and 1
                        BCWS = BCWS.plus(taskBudget.mul(percentScheduled));
                    }
                }
            } else {
                // Fallback to project-level metrics if no tasks exist
                const percentComplete = new Decimal(project.completionPercentage || 0).div(100);
                BCWP = BAC.mul(percentComplete);
                
                // For ACWP, we would ideally reuse calculateProjectCost
                const costReport = await this.calculateProjectCost(tenantId, projectId);
                ACWP = new Decimal(costReport.totalActualCost);

                if (project.startDate && project.endDate) {
                    const totalDuration = project.endDate.getTime() - project.startDate.getTime();
                    const elapsed = asOfDate.getTime() - project.startDate.getTime();
                    let percentScheduled = totalDuration > 0 ? elapsed / totalDuration : 0;
                    percentScheduled = Math.max(0, Math.min(1, percentScheduled));
                    BCWS = BAC.mul(percentScheduled);
                }
            }

            // EVM Calculations
            const CV = BCWP.minus(ACWP);
            const SV = BCWP.minus(BCWS);
            
            // Prevent Division by Zero
            const CPI = ACWP.isZero() ? new Decimal(1) : BCWP.div(ACWP);
            const SPI = BCWS.isZero() ? new Decimal(1) : BCWP.div(BCWS);
            
            const EAC = CPI.isZero() ? BAC : BAC.div(CPI);
            const ETC = EAC.minus(ACWP);

            let healthStatus: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL' = 'ON_TRACK';
            if (CPI.lt(0.85) || SPI.lt(0.85)) healthStatus = 'CRITICAL';
            else if (CPI.lt(0.95) || SPI.lt(0.95)) healthStatus = 'AT_RISK';

            return {
                projectId,
                asOfDate,
                BCWS: Number(BCWS.toFixed(2)),
                BCWP: Number(BCWP.toFixed(2)),
                ACWP: Number(ACWP.toFixed(2)),
                CV: Number(CV.toFixed(2)),
                SV: Number(SV.toFixed(2)),
                CPI: Number(CPI.toFixed(2)),
                SPI: Number(SPI.toFixed(2)),
                BAC: Number(BAC.toFixed(2)),
                EAC: Number(EAC.toFixed(2)),
                ETC: Number(ETC.toFixed(2)),
                healthStatus
            };

        } catch (error: any) {
            log.error('Failed to compute EVM', { error: error.message });
            throw new Error(`EVM Computation failed: ${error.message}`);
        }
    }

    private static generateMockEVMReport(): EVMReport {
        return {
            projectId: 101,
            asOfDate: new Date(),
            BCWS: 2000000.00,
            BCWP: 1800000.00,
            ACWP: 2100000.00,
            CV: -300000.00,
            SV: -200000.00,
            CPI: 0.86,
            SPI: 0.90,
            BAC: 5000000.00,
            EAC: 5813953.49,
            ETC: 3713953.49,
            healthStatus: 'AT_RISK'
        };
    }

    /**
     * Calculates the real-time financial health and costing of a project.
     */
    static async calculateProjectCost(tenantId: string, projectId: number): Promise<ProjectCostReport> {
        try {
            const p = prisma as any;
            if (!p.project) {
                log.warn('Project schema not found. Mocking Project Costing.');
                return this.generateMockReport();
            }

            const project = await p.project.findUnique({
                where: { id: projectId, tenantId },
                include: {
                    timesheets: { where: { status: 'APPROVED' }, include: { employee: true } },
                    materialIssues: { include: { item: true } },
                    equipmentLogs: { include: { equipment: true } }
                }
            });

            if (!project) throw new Error(`Project ${projectId} not found.`);

            let laborCost = new Decimal(0);
            let materialCost = new Decimal(0);
            let equipmentCost = new Decimal(0);

            // 1. Calculate Labor Costs (Hours * Hourly Rate)
            if (project.timesheets) {
                for (const sheet of project.timesheets) {
                    const hours = new Decimal(sheet.hoursWorked || 0);
                    const rate = new Decimal(sheet.employee?.hourlyRate || 0);
                    laborCost = laborCost.plus(hours.mul(rate));
                }
            }

            // 2. Calculate Material Costs (from Inventory Issues linked to Project)
            if (project.materialIssues) {
                for (const issue of project.materialIssues) {
                    const qty = new Decimal(issue.quantity || 0);
                    const unitCost = new Decimal(issue.item?.averageCost || 0);
                    materialCost = materialCost.plus(qty.mul(unitCost));
                }
            }

            // 3. Calculate Equipment Costs (Usage Hours * Hourly Depreciation/Rental Rate)
            if (project.equipmentLogs) {
                for (const equip of project.equipmentLogs) {
                    const hours = new Decimal(equip.hoursUsed || 0);
                    const rate = new Decimal(equip.equipment?.hourlyRate || 0);
                    equipmentCost = equipmentCost.plus(hours.mul(rate));
                }
            }

            const totalActual = laborCost.plus(materialCost).plus(equipmentCost);
            const totalBudget = new Decimal(project.allocatedBudget || 0);
            const variance = totalBudget.minus(totalActual);

            const report: ProjectCostReport = {
                projectId: project.id,
                projectName: project.name,
                totalBudget: Number(totalBudget.toFixed(2)),
                actualLaborCost: Number(laborCost.toFixed(2)),
                actualMaterialCost: Number(materialCost.toFixed(2)),
                actualEquipmentCost: Number(equipmentCost.toFixed(2)),
                totalActualCost: Number(totalActual.toFixed(2)),
                variance: Number(variance.toFixed(2)),
                isOverBudget: variance.isNegative()
            };

            log.info(`Project ${projectId} Costing Calculated. Over Budget: ${report.isOverBudget}`);
            return report;

        } catch (error: any) {
            log.error('Failed to calculate project cost', { error: error.message });
            throw new Error(`Project Costing failed: ${error.message}`);
        }
    }

    private static generateMockReport(): ProjectCostReport {
        return {
            projectId: 101,
            projectName: 'Riyadh Metro Station A1',
            totalBudget: 5000000.00,
            actualLaborCost: 1200000.00,
            actualMaterialCost: 2500000.00,
            actualEquipmentCost: 400000.00,
            totalActualCost: 4100000.00,
            variance: 900000.00,
            isOverBudget: false
        };
    }
}
