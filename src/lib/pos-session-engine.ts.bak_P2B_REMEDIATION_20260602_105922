import { prisma } from './prisma';
import { n } from './decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pos-session-engine' });

export class PosSessionEngine {
    
    /**
     * Open a new POS Session
     */
    static async openSession(userId: number, terminalId: number, branchId: number, openingFloat: number) {
        // Check if there is an existing open session for this user/terminal
        const existing = await prisma.posSession.findFirst({
            where: {
                userId,
                terminalId,
                status: 'OPEN'
            }
        });

        if (existing) {
            throw new Error("An open session already exists for this terminal and user.");
        }

        const session = await prisma.posSession.create({
            data: {
                userId,
                terminalId,
                branchId,
                openingFloat,
                status: 'OPEN',
                openedAt: new Date()
            }
        });

        if (openingFloat > 0) {
            await prisma.posSessionMovement.create({
                data: {
                    sessionId: session.id,
                    type: 'CASH_IN',
                    amount: openingFloat,
                    reason: 'Opening Float'
                }
            });
        }

        return session;
    }

    /**
     * Get Current Open Session
     */
    static async getCurrentSession(userId: number, terminalId: number) {
        return prisma.posSession.findFirst({
            where: {
                userId,
                terminalId,
                status: 'OPEN'
            },
            include: { movements: true }
        });
    }

    /**
     * Add Cash Movement (Drop/Lift/In/Out)
     */
    static async addMovement(sessionId: number, type: string, amount: number, reason: string) {
        return prisma.posSessionMovement.create({
            data: {
                sessionId,
                type, // CASH_IN, CASH_OUT, DROP, LIFT
                amount,
                reason
            }
        });
    }

    /**
     * Close a POS Session
     */
    static async closeSession(sessionId: number, actualClosingCash: number, userId: string) {
        const session = await prisma.posSession.findUnique({
            where: { id: sessionId },
            include: { movements: true }
        });

        if (!session) throw new Error("Session not found");
        if (session.status === 'CLOSED') throw new Error("Session is already closed");

        // Compute expected cash
        // expected = openingFloat + (Total Cash Sales during session) + CASH_IN - CASH_OUT - DROP
        // We will mock Cash Sales for now as 0, but ideally we query SalesInvoice where paymentMethod = 'CASH' and createdAt >= openedAt
        
        const cashSalesAgg = await prisma.paymentTransaction.aggregate({
            where: {
                gatewayId: 1, // assuming gateway 1 is 'CASH' or similar, we'll mock this calculation
                // For a real implementation, we would query SalesInvoice with CASH payment or a specific PaymentTransaction
            },
            _sum: { amount: true }
        });
        
        // Let's use movements to calculate base shifts
        let movementNet = 0;
        for (const mov of session.movements) {
            if (mov.type === 'CASH_IN' && mov.reason !== 'Opening Float') movementNet += n(mov.amount);
            if (mov.type === 'CASH_OUT' || mov.type === 'DROP' || mov.type === 'LIFT') movementNet -= n(mov.amount);
        }

        // Dummy cash sales querying (for real we need PaymentTransaction linked to SalesInvoice)
        const mockCashSales = 0; 
        
        const expectedClosing = n(session.openingFloat) + movementNet + mockCashSales;
        const variance = actualClosingCash - expectedClosing;

        // Update Session
        const closedSession = await prisma.posSession.update({
            where: { id: sessionId },
            data: {
                closingFloat: actualClosingCash,
                expectedClosing,
                variance,
                status: 'CLOSED',
                closedAt: new Date()
            }
        });

        // Generate Variance JE if needed
        if (Math.abs(variance) > 0) {
            const isOverage = variance > 0;
            const je = await prisma.journalEntry.create({
                data: {
                    entryNumber: `POS-VAR-${session.id}`,
                    entryDate: new Date().toISOString(),
                    description: `POS Session Variance for Session ${session.id}`,
                    status: 'posted',
                    totalDebit: Math.abs(variance),
                    totalCredit: Math.abs(variance),
                    createdBy: parseInt(userId, 10)
                }
            });

            await prisma.journalLine.create({
                data: {
                    entryId: je.id,
                    accountId: 1010, // Cash Account
                    debit: isOverage ? Math.abs(variance) : 0,
                    credit: !isOverage ? Math.abs(variance) : 0,
                    description: 'Cash Drawer Variance'
                }
            });

            await prisma.journalLine.create({
                data: {
                    entryId: je.id,
                    accountId: 5010, // Cash Over/Short Expense Account
                    debit: !isOverage ? Math.abs(variance) : 0,
                    credit: isOverage ? Math.abs(variance) : 0,
                    description: 'Cash Over/Short Variance'
                }
            });
        }

        return closedSession;
    }
}
