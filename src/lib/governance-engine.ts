import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.governance-e' });

// Note: TS Server may need a restart to see new Prisma types

export class GovernanceEngine {
    
    /**
     * Checks Segregation of Duties (SoD) to ensure one user cannot perform conflicting actions
     * e.g., A user cannot CREATE_PO and APPROVE_PO for the same document.
     */
    static async checkSegregationOfDuties(userId: string, requestedAction: string, documentId?: number) {
        // 1. Find all rules involving the requested action
        const rules = await prisma.segregationOfDutiesRule.findMany({
            take: 100,
            where: {
                OR: [
                    { actionA: requestedAction },
                    { actionB: requestedAction }
                ]
            }
        });

        if (rules.length === 0) return { allowed: true };

        // 2. Fetch user's historical actions from AuditLog or FieldAuditLog
        // We look for the opposing action from the rule
        const opposingActions = rules.map((r: any) => r.actionA === requestedAction ? r.actionB : r.actionA);
        
        const userAuditLogs = await prisma.auditLog.findMany({
            take: 100,
            where: {
                userId: parseInt(userId), // Assuming userId is numerical in DB
                action: { in: opposingActions },
                ...(documentId ? { recordId: String(documentId) } : {})
            }
        });

        if (userAuditLogs.length > 0) {
            const conflictAction = userAuditLogs[0].action;
            throw new Error(`Segregation of Duties Violation: User has previously performed '${conflictAction}' and therefore cannot perform '${requestedAction}'.`);
        }

        return { allowed: true };
    }

    /**
     * Filters a data object based on Field-Level Permissions for a given role before sending to client
     */
    static async applyFieldPermissions(roleName: string, modelName: string, data: any) {
        const permissions = await prisma.roleFieldPermission.findMany({
            take: 100,
            where: { roleName, modelName }
        });

        if (permissions.length === 0) return data; // Default to allow if no specific rules defined

        const filteredData = { ...data };

        for (const perm of permissions) {
            if (perm.permission === 'HIDDEN') {
                delete filteredData[perm.fieldName];
            }
            // READ permission allows viewing but not updating.
            // WRITE permission allows both.
            // Actual update blocking would happen in the API layer checking incoming payloads.
        }

        return filteredData;
    }

    /**
     * Resolves the actual user responsible for an action, considering active delegations
     */
    static async resolveDelegatedUser(userId: string, module: string) {
        const currentDate = new Date();
        
        const delegation = await prisma.userDelegation.findFirst({
            where: {
                delegatorUserId: userId,
                isActive: true,
                startDate: { lte: currentDate },
                endDate: { gte: currentDate },
                OR: [
                    { module: 'ALL' },
                    { module }
                ]
            }
        });

        if (delegation) {
            return {
                originalUserId: userId,
                actingUserId: delegation.delegateeUserId,
                isDelegated: true
            };
        }

        return {
            originalUserId: userId,
            actingUserId: userId,
            isDelegated: false
        };
    }
}
