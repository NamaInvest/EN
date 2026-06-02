import { prisma as globalPrisma } from './prisma';
import { n } from './decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pos-session-engine' });

/**
 * محرك إدارة جلسات وورديات صناديق الكاشير (POS Session Engine)
 * يدعم عزل المستأجرين بصورة صارمة، وتمرير عملاء قاعدة بيانات مخصصين للمعاملات المالية المتداخلة.
 */
export class PosSessionEngine {
    
    /**
     * فتح وردية كاشير جديدة
     * يتحقق من عدم وجود جلسة كاشير نشطة ومفتوحة لنفس المستخدم والفرع والطرفية تحت نفس المستأجر.
     */
    static async openSession(
        userId: number, 
        terminalId: number, 
        branchId: number, 
        openingFloat: number,
        tenantId: string = 'default',
        tx?: any
    ) {
        const db = tx || globalPrisma;
        
        // التحقق من عدم وجود وردية مفتوحة ونشطة لنفس المستخدم والطرفية في حدود المستأجر الحالي
        const existing = await db.posSession.findFirst({
            where: {
                userId,
                terminalId,
                status: 'OPEN',
                tenantId
            }
        });

        if (existing) {
            throw new Error("An open session already exists for this terminal and user under the current tenant.");
        }

        // إنشاء سجل وردية الصندوق الجديد
        const session = await db.posSession.create({
            data: {
                userId,
                terminalId,
                branchId,
                openingFloat,
                status: 'OPEN',
                openedAt: new Date(),
                tenantId
            }
        });

        // تسجيل حركة المقبوضات الافتتاحية للصندوق إذا كانت أكبر من صفر
        if (openingFloat > 0) {
            await db.posSessionMovement.create({
                data: {
                    sessionId: session.id,
                    type: 'CASH_IN',
                    amount: openingFloat,
                    reason: 'Opening Float',
                    tenantId
                }
            });
        }

        return session;
    }

    /**
     * استرجاع الوردية المفتوحة والنشطة الحالية
     */
    static async getCurrentSession(userId: number, terminalId: number, tenantId: string = 'default', tx?: any) {
        const db = tx || globalPrisma;
        return db.posSession.findFirst({
            where: {
                userId,
                terminalId,
                status: 'OPEN',
                tenantId
            },
            include: { movements: true }
        });
    }

    /**
     * إضافة حركة نقدية على الصندوق (إيداع، سحب، drop, lift)
     */
    static async addMovement(
        sessionId: number, 
        type: string, 
        amount: number, 
        reason: string,
        tenantId: string = 'default',
        tx?: any
    ) {
        const db = tx || globalPrisma;
        
        // التحقق الأمني أولاً من تبعية الجلسة للمستأجر الحالي
        const session = await db.posSession.findFirst({
            where: { id: sessionId, tenantId }
        });
        if (!session) {
            throw new Error("Session not found or belongs to a different tenant.");
        }

        return db.posSessionMovement.create({
            data: {
                sessionId,
                type, // CASH_IN, CASH_OUT, DROP, LIFT
                amount,
                reason,
                tenantId
            }
        });
    }

    /**
     * إغلاق وردية الكاشير وحساب الفروقات والقيود المحاسبية المقابلة
     */
    static async closeSession(
        sessionId: number, 
        actualClosingCash: number, 
        userId: string,
        tenantId: string = 'default',
        tx?: any
    ) {
        const db = tx || globalPrisma;

        // استرجاع سجل الجلسة بالـ tenantId لضمان الأمن والعزل
        const session = await db.posSession.findFirst({
            where: { id: sessionId, tenantId },
            include: { movements: true }
        });

        if (!session) throw new Error("Session not found or belongs to a different tenant.");
        if (session.status === 'CLOSED') throw new Error("Session is already closed");

        // حساب صافي حركات المقبوضات والمدفوعات داخل الصندوق
        let movementNet = 0;
        for (const mov of session.movements) {
            if (mov.type === 'CASH_IN' && mov.reason !== 'Opening Float') movementNet += n(mov.amount);
            if (mov.type === 'CASH_OUT' || mov.type === 'DROP' || mov.type === 'LIFT') movementNet -= n(mov.amount);
        }

        // في تطبيق حقيقي سيتم الاستعلام عن مبيعات النقدية الفعلية للفاتورة
        const mockCashSales = 0; 
        
        const expectedClosing = n(session.openingFloat) + movementNet + mockCashSales;
        const variance = actualClosingCash - expectedClosing;

        // إغلاق الجلسة وتحديث الفروقات
        const closedSession = await db.posSession.update({
            where: { id: sessionId },
            data: {
                closingFloat: actualClosingCash,
                expectedClosing,
                variance,
                status: 'CLOSED',
                closedAt: new Date()
            }
        });

        // توليد قيود فروقات عجز وزيادة الصناديق محاسبياً عند وجود فروقات معلنة
        if (Math.abs(variance) > 0) {
            const isOverage = variance > 0;
            const je = await db.journalEntry.create({
                data: {
                    entryNumber: `POS-VAR-${session.id}`,
                    entryDate: new Date().toISOString(),
                    description: `POS Session Variance for Session ${session.id}`,
                    status: 'posted',
                    totalDebit: Math.abs(variance),
                    totalCredit: Math.abs(variance),
                    createdBy: parseInt(userId, 10),
                    tenantId
                }
            });

            await db.journalLine.create({
                data: {
                    entryId: je.id,
                    accountId: 1010, // حساب الصندوق المالي
                    debit: isOverage ? Math.abs(variance) : 0,
                    credit: !isOverage ? Math.abs(variance) : 0,
                    description: 'Cash Drawer Variance',
                    tenantId
                }
            });

            await db.journalLine.create({
                data: {
                    entryId: je.id,
                    accountId: 5010, // حساب عجز وزيادة الصناديق والمصروفات الإدارية
                    debit: !isOverage ? Math.abs(variance) : 0,
                    credit: isOverage ? Math.abs(variance) : 0,
                    description: 'Cash Over/Short Variance',
                    tenantId
                }
            });
        }

        return closedSession;
    }
}
