/**
 * Document State Machine Engine
 * 
 * يدير انتقالات حالات المستندات (DRAFT→SUBMITTED→APPROVED→POSTED→CLOSED).
 * يتحقق من الصلاحيات ويطلق auto-actions عند الانتقال.
 */

import type { PrismaClient } from '@prisma/client';

// Helper: Prisma generated types may lag in IDE — cast for new models
const db = (p: PrismaClient) => p as any;

export interface TransitionResult {
    success: boolean;
    fromState: string;
    toState: string;
    autoActions?: any[];
    error?: string;
}

export async function transition(
    prisma: PrismaClient,
    docType: string,
    currentState: string,
    action: string,
    userRole?: string
): Promise<TransitionResult> {
    // Find valid transition
    const rule = await db(prisma).documentStateMachine.findFirst({
        where: {
            docType,
            fromState: currentState,
            action,
            isActive: true,
        },
    });

    if (!rule) {
        return {
            success: false,
            fromState: currentState,
            toState: currentState,
            error: `لا يوجد انتقال من '${currentState}' بالإجراء '${action}' لنوع '${docType}'`,
        };
    }

    // Check role
    if (rule.requiredRole && userRole !== rule.requiredRole && userRole !== 'admin') {
        return {
            success: false,
            fromState: currentState,
            toState: currentState,
            error: `الصلاحية المطلوبة: ${rule.requiredRole}`,
        };
    }

    return {
        success: true,
        fromState: currentState,
        toState: rule.toState,
        autoActions: rule.autoActions as any[] || [],
    };
}

export async function getAvailableActions(
    prisma: PrismaClient,
    docType: string,
    currentState: string
): Promise<{ action: string; toState: string; requiredRole: string | null }[]> {
    const rules = await db(prisma).documentStateMachine.findMany({
        where: { docType, fromState: currentState, isActive: true },
        select: { action: true, toState: true, requiredRole: true },
    });
    return rules;
}

export async function seedDefaultTransitions(prisma: PrismaClient): Promise<number> {
    const transitions = [
        // Sales Invoice
        { docType: 'SALES_INVOICE', fromState: 'DRAFT', toState: 'SUBMITTED', action: 'submit' },
        { docType: 'SALES_INVOICE', fromState: 'SUBMITTED', toState: 'POSTED', action: 'approve', requiredRole: 'accountant' },
        { docType: 'SALES_INVOICE', fromState: 'SUBMITTED', toState: 'DRAFT', action: 'return' },
        { docType: 'SALES_INVOICE', fromState: 'POSTED', toState: 'CANCELLED', action: 'cancel', requiredRole: 'admin' },
        // Purchase Order
        { docType: 'PURCHASE_ORDER', fromState: 'DRAFT', toState: 'SUBMITTED', action: 'submit' },
        { docType: 'PURCHASE_ORDER', fromState: 'SUBMITTED', toState: 'APPROVED', action: 'approve', requiredRole: 'manager' },
        { docType: 'PURCHASE_ORDER', fromState: 'SUBMITTED', toState: 'REJECTED', action: 'reject', requiredRole: 'manager' },
        { docType: 'PURCHASE_ORDER', fromState: 'APPROVED', toState: 'CLOSED', action: 'close' },
        // Journal Entry
        { docType: 'JOURNAL_ENTRY', fromState: 'DRAFT', toState: 'SUBMITTED', action: 'submit' },
        { docType: 'JOURNAL_ENTRY', fromState: 'SUBMITTED', toState: 'POSTED', action: 'approve', requiredRole: 'accountant' },
        { docType: 'JOURNAL_ENTRY', fromState: 'POSTED', toState: 'REVERSED', action: 'reverse', requiredRole: 'admin' },
        // Payment
        { docType: 'PAYMENT', fromState: 'DRAFT', toState: 'SUBMITTED', action: 'submit' },
        { docType: 'PAYMENT', fromState: 'SUBMITTED', toState: 'APPROVED', action: 'approve', requiredRole: 'manager' },
        { docType: 'PAYMENT', fromState: 'APPROVED', toState: 'PAID', action: 'execute' },
    ];

    let created = 0;
    for (const t of transitions) {
        try {
            await db(prisma).documentStateMachine.upsert({
                where: { docType_fromState_toState: { docType: t.docType, fromState: t.fromState, toState: t.toState } },
                update: {},
                create: { ...t, requiredRole: t.requiredRole || null, isActive: true },
            });
            created++;
        } catch { /* skip */ }
    }
    return created;
}
