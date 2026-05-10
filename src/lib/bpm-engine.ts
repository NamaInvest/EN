// @ts-nocheck
import { PrismaClient, BpmInstance } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.bpm-engine.t' });

const prisma = new PrismaClient();

export class BPMEngine {
    
    /**
     * Start a new workflow instance for an entity
     */
    static async startInstance(entityType: string, entityId: number, triggerContext: any): Promise<BpmInstance | null> {
        // Find active workflow for this entity
        const workflow = await prisma.bpmWorkflow.findFirst({
            where: { entityType, isActive: true }
        });

        if (!workflow) return null; // No workflow defined

        const def = workflow.definition as any;
        const startNodeId = def.nodes.find((n: any) => n.type === 'START').id;
        const nextEdge = def.edges.find((e: any) => e.source === startNodeId);
        
        if (!nextEdge) throw new Error("Invalid Workflow Definition: No edge from START");
        
        const firstStepId = nextEdge.target;

        // Create Instance
        const instance = await prisma.bpmInstance.create({
            data: {
                workflowId: workflow.id,
                entityId,
                status: 'RUNNING',
                currentStepId: firstStepId,
                contextData: triggerContext
            }
        });

        // Trigger first step execution
        await this.executeStep(instance.id, firstStepId);

        return instance;
    }

    /**
     * Internal execution of a step (Node)
     */
    private static async executeStep(instanceId: number, stepId: string) {
        const instance = await prisma.bpmInstance.findUnique({
            where: { id: instanceId },
            include: { workflow: true }
        });

        if (!instance) return;

        const def = instance.workflow.definition as any;
        const node = def.nodes.find((n: any) => n.id === stepId);

        if (!node) throw new Error(`Node ${stepId} not found in workflow`);

        switch (node.type) {
            case 'APPROVAL_TASK':
                await this.createApprovalTask(instance, node);
                break;
            case 'CONDITION':
                await this.evaluateCondition(instance, node, def);
                break;
            case 'AUTO_ACTION':
                await this.executeAutoAction(instance, node, def);
                break;
            case 'END':
                await this.completeInstance(instance);
                break;
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    /**
     * Called when a user acts on a task (Approve/Reject)
     */
    static async completeTask(taskId: number, action: 'APPROVE' | 'REJECT', userId: number, comments?: string): Promise<void> {
        const task = await prisma.bpmTask.findUnique({
            where: { id: taskId },
            include: { instance: { include: { workflow: true } } }
        });

        if (!task || task.status !== 'PENDING') throw new Error("Task not available");

        // Mark task complete
        await prisma.bpmTask.update({
            where: { id: taskId },
            data: {
                status: action,
                comments,
                completedAt: new Date(),
                // we technically shouldn't change assignee if it was a role, but we'll record who did it in audit
            }
        });

        const def = task.instance.workflow.definition as any;
        
        if (action === 'REJECT') {
            // Usually rejection terminates or routes back. Simple termination here.
            await prisma.bpmInstance.update({
                where: { id: task.instanceId },
                data: { status: 'CANCELLED', completedAt: new Date() }
            });
            // Need to update the business entity status back to DRAFT or REJECTED
            return;
        }

        // Find next step after Approval
        const edges = def.edges.filter((e: any) => e.source === task.stepId);
        
        if (edges.length === 0) {
            // Implicit END
            await this.completeInstance(task.instance);
            return;
        }

        // Move to next step
        const nextStepId = edges[0].target;
        await prisma.bpmInstance.update({
            where: { id: task.instanceId },
            data: { currentStepId: nextStepId }
        });

        await this.executeStep(task.instanceId, nextStepId);
    }

    private static async createApprovalTask(instance: any, node: any) {
        // SLA Calculation (e.g. 48 hours)
        let slaDueDate = null;
        if (node.config?.slaHours) {
            slaDueDate = new Date();
            slaDueDate.setHours(slaDueDate.getHours() + node.config.slaHours);
        }

        await prisma.bpmTask.create({
            data: {
                instanceId: instance.id,
                stepId: node.id,
                taskName: node.label || 'Approval Required',
                assigneeRole: node.config?.assigneeRole,
                assigneeId: node.config?.assigneeId,
                slaDueDate: slaDueDate
            }
        });
        
        // Push Notification or Email can be triggered here
    }

    private static async evaluateCondition(instance: any, node: any, def: any) {
        const context = instance.contextData as any;
        const field = node.config.field;
        const operator = node.config.operator;
        const value = node.config.value;

        const actualValue = context[field];
        let result = false;

        if (operator === '>') result = actualValue > value;
        else if (operator === '<') result = actualValue < value;
        else if (operator === '==') result = actualValue === value;

        // Find edge matching the result
        const edge = def.edges.find((e: any) => e.source === node.id && e.conditionResult === result);
        
        if (edge) {
            await prisma.bpmInstance.update({
                where: { id: instance.id },
                data: { currentStepId: edge.target }
            });
            await this.executeStep(instance.id, edge.target);
        } else {
            // No route found, trap instance
            await prisma.bpmInstance.update({
                where: { id: instance.id },
                data: { status: 'FAILED' }
            });
        }
    }

    private static async executeAutoAction(instance: any, node: any, def: any) {
        const action = node.config.action;
        
        if (action === 'POST_TO_GL') {
            // Invoke AutoJournal engine
        } else if (action === 'SEND_EMAIL') {
            // Send email
        }

        // Move next
        const nextEdge = def.edges.find((e: any) => e.source === node.id);
        if (nextEdge) {
            await prisma.bpmInstance.update({
                where: { id: instance.id },
                data: { currentStepId: nextEdge.target }
            });
            await this.executeStep(instance.id, nextEdge.target);
        }
    }

    private static async completeInstance(instance: any) {
        await prisma.bpmInstance.update({
            where: { id: instance.id },
            data: { status: 'COMPLETED', completedAt: new Date() }
        });

        // Trigger business logic completion
        // E.g., marking a Purchase Order as "APPROVED"
        const workflow = await prisma.bpmWorkflow.findUnique({ where: { id: instance.workflowId }});
        if (workflow?.entityType === 'PurchaseOrder') {
            await prisma.purchaseOrder.update({
                where: { id: instance.entityId },
                data: { status: 'APPROVED' }
            });
        }
    }
}
