/**
 * Employee Onboarding Engine (Phase 26.1 - HR)
 * ──────────────────────────────────────────────────────────
 * Manages the onboarding workflow for new hires.
 * Automates IT setup requests (emails/accounts), document collection, 
 * and mandatory training assignments.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'EmployeeOnboardingEngine' });

export type OnboardingTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface OnboardingPlan {
    employeeId: number;
    departmentId: number;
    tasks: { title: string; assignedTo: 'HR' | 'IT' | 'EMPLOYEE' | 'MANAGER'; daysToComplete: number }[];
}

export class EmployeeOnboardingEngine {

    // Default template for a standard corporate hire
    private static DEFAULT_TEMPLATE = [
        { title: 'Upload ID and Passport', assignedTo: 'EMPLOYEE', daysToComplete: 2 },
        { title: 'Create Corporate Email and AD Account', assignedTo: 'IT', daysToComplete: 1 },
        { title: 'Allocate Laptop and Hardware', assignedTo: 'IT', daysToComplete: 3 },
        { title: 'Sign Non-Disclosure Agreement (NDA)', assignedTo: 'EMPLOYEE', daysToComplete: 2 },
        { title: 'Orientation and Office Tour', assignedTo: 'HR', daysToComplete: 5 },
        { title: 'First Week Review Meeting', assignedTo: 'MANAGER', daysToComplete: 7 }
    ];

    /**
     * Initializes the onboarding process for a newly hired employee
     */
    static async initiateOnboarding(tenantId: string, employeeId: number, departmentId: number): Promise<void> {
        try {
            const p = prisma as any;
            if (!p.onboardingTask) {
                log.warn('Onboarding schema not found. Simulating initialization.');
                return;
            }

            const hireDate = new Date(); // Assume today is day 0

            await prisma.$transaction(async (tx) => {
                for (const templateTask of this.DEFAULT_TEMPLATE) {
                    const dueDate = new Date();
                    dueDate.setDate(hireDate.getDate() + templateTask.daysToComplete);

                    await (tx as any).onboardingTask.create({
                        data: {
                            tenantId,
                            employeeId,
                            title: templateTask.title,
                            assignedToRole: templateTask.assignedTo,
                            status: 'PENDING',
                            dueDate
                        }
                    });
                }

                // Update employee status to ONBOARDING
                await (tx as any).employee.update({
                    where: { id: employeeId },
                    data: { status: 'ONBOARDING' }
                });
            });

            log.info(`Initiated ${this.DEFAULT_TEMPLATE.length} onboarding tasks for employee ${employeeId}`);

            // TODO: Dispatch emails to IT, HR, and Manager regarding their tasks.

        } catch (error: any) {
            log.error('Failed to initiate onboarding', { error: error.message });
            throw new Error(`Onboarding initiation failed: ${error.message}`);
        }
    }

    /**
     * Completes a specific onboarding task
     */
    static async completeTask(taskId: number, completedById: number): Promise<void> {
        const p = prisma as any;
        if (!p.onboardingTask) return;

        const task = await p.onboardingTask.findUnique({ where: { id: taskId } });
        if (!task) throw new Error('Task not found');

        await p.onboardingTask.update({
            where: { id: taskId },
            data: { 
                status: 'COMPLETED', 
                completedAt: new Date(),
                completedById 
            }
        });

        log.info(`Onboarding task ${taskId} completed by user ${completedById}`);

        // Check if all tasks are complete to transition employee to ACTIVE
        const remainingTasks = await p.onboardingTask.count({
            where: { employeeId: task.employeeId, status: { not: 'COMPLETED' } }
        });

        if (remainingTasks === 0) {
            await p.employee.update({
                where: { id: task.employeeId },
                data: { status: 'ACTIVE' }
            });
            log.info(`Employee ${task.employeeId} onboarding fully complete. Status set to ACTIVE.`);
        }
    }
}
