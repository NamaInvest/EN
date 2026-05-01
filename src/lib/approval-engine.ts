import { prisma } from './prisma';

export class ApprovalEngine {
    
    /**
     * Creates an approval request for a given document
     */
    static async requestApproval(
        docType: string,
        docId: number,
        requesterId: string,
        amount?: number,
        branchId?: number
    ) {
        // 1. Find matching rules
        const rules = await prisma.approvalRule.findMany({
            where: {
                documentType: docType,
                isActive: true,
                ...(branchId ? { branchId } : {}),
            },
            orderBy: {
                sequence: 'asc'
            }
        });

        // Filter by amount thresholds if applicable
        const applicableRules = rules.filter(r => {
            if (amount !== undefined && amount !== null) {
                const min = r.minAmount ? Number(r.minAmount) : 0;
                const max = r.maxAmount ? Number(r.maxAmount) : Number.MAX_SAFE_INTEGER;
                return amount >= min && amount <= max;
            }
            return true; // No amount filter
        });

        if (applicableRules.length === 0) {
            // Auto-approve or ignore if no rules apply
            return { status: 'NO_RULES_APPLIED' };
        }

        // 2. Create Request
        const request = await prisma.approvalRequest.create({
            data: {
                documentType: docType,
                documentId: docId,
                requesterId,
                amount: amount || null,
                status: 'PENDING',
                currentStepSeq: applicableRules[0].sequence,
                steps: {
                    create: applicableRules.map(rule => ({
                        sequence: rule.sequence,
                        approverUserId: rule.approverUserId,
                        status: rule.sequence === applicableRules[0].sequence ? 'PENDING' : 'WAITING'
                    }))
                }
            },
            include: { steps: true }
        });

        return request;
    }

    /**
     * Approve or reject a step
     */
    static async processStep(
        stepId: number,
        userId: string,
        action: 'APPROVED' | 'REJECTED',
        comment?: string
    ) {
        const step = await prisma.approvalStep.findUnique({
            where: { id: stepId },
            include: { request: { include: { steps: true } } }
        });

        if (!step) throw new Error("Step not found");
        if (step.status !== 'PENDING') throw new Error("Step is not pending");
        
        // Verify userId matches approverUserId or delegatedTo
        if (step.approverUserId !== userId && step.delegatedTo !== userId) {
            throw new Error("Unauthorized to approve this step");
        }

        // 1. Update step
        await prisma.approvalStep.update({
            where: { id: stepId },
            data: {
                status: action,
                comment,
                actionAt: new Date()
            }
        });

        // 2. If rejected, fail the whole request
        if (action === 'REJECTED') {
            await prisma.approvalRequest.update({
                where: { id: step.requestId },
                data: { status: 'REJECTED' }
            });
            return { status: 'REJECTED' };
        }

        // 3. If approved, check if there's a next step
        const nextSteps = step.request.steps.filter(s => s.sequence > step.sequence).sort((a, b) => a.sequence - b.sequence);
        
        if (nextSteps.length > 0) {
            const nextStep = nextSteps[0];
            await prisma.approvalStep.update({
                where: { id: nextStep.id },
                data: { status: 'PENDING' }
            });
            await prisma.approvalRequest.update({
                where: { id: step.requestId },
                data: { currentStepSeq: nextStep.sequence }
            });
            return { status: 'PARTIALLY_APPROVED' };
        } else {
            // All steps approved
            await prisma.approvalRequest.update({
                where: { id: step.requestId },
                data: { status: 'APPROVED' }
            });
            return { status: 'FULLY_APPROVED' };
        }
    }

    /**
     * Delegate approval step to another user
     */
    static async delegate(stepId: number, fromUserId: string, toUserId: string) {
        const step = await prisma.approvalStep.findUnique({ where: { id: stepId } });
        if (!step || step.approverUserId !== fromUserId) {
            throw new Error("Unauthorized to delegate");
        }
        
        return prisma.approvalStep.update({
            where: { id: stepId },
            data: { delegatedTo: toUserId }
        });
    }
}
