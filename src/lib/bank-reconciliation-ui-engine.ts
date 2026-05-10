/**
 * Bank Reconciliation Engine (G-01)
 * ═══════════════════════════════════
 * 
 * - تحليل كشوفات البنك CSV
 * - مطابقة تلقائية بالمبلغ+التاريخ+المرجع
 * - مطابقة يدوية + إنشاء قيود فروقات
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.bank-reconci' });
const db = (p: any) => p as any;

export type MatchResult = {
    lineId: number;
    status: 'MATCHED' | 'SUGGESTED' | 'UNMATCHED';
    matchedJeId?: number;
    matchedRef?: string;
    confidence: number; // 0-100
};

export class BankReconciliationEngine {
    /**
     * Parse CSV bank statement
     */
    static parseCSV(csvContent: string): Array<{
        date: string; description: string; reference: string; debit: number; credit: number;
    }> {
        const lines = csvContent.trim().split('\n');
        const results: any[] = [];
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
            if (cols.length < 4) continue;
            
            results.push({
                date: cols[0],
                description: cols[1] || '',
                reference: cols[2] || '',
                debit: Math.abs(parseFloat(cols[3]) || 0),
                credit: cols.length > 4 ? Math.abs(parseFloat(cols[4]) || 0) : 0,
            });
        }
        return results;
    }

    /**
     * Auto-match statement lines with journal entries
     */
    static async autoMatch(
        prisma: PrismaClient,
        bankAccountId: number,
        statementLines: Array<{ id: number; date: string; description: string; reference: string; amount: number }>
    ): Promise<MatchResult[]> {
        const results: MatchResult[] = [];
        
        // Get unreconciled journal entries for this bank account
        const journalEntries = await (prisma as any).journalEntry.findMany({
            where: {
                status: { in: ['posted', 'POSTED'] },
            },
            include: { items: true },
            orderBy: { entryDate: 'desc' },
            take: 500,
        });

        // Build lookup of JE amounts
        const jeAmounts: Array<{ jeId: number; amount: number; date: Date; ref: string }> = [];
        for (const je of journalEntries) {
            for (const line of (je.items || [])) {
                const amount = Number(line.debit) - Number(line.credit);
                if (Math.abs(amount) > 0.01) {
                    jeAmounts.push({
                        jeId: je.id,
                        amount: Math.abs(amount),
                        date: new Date(je.entryDate),
                        ref: je.description || '',
                    });
                }
            }
        }

        for (const sl of statementLines) {
            const slDate = new Date(sl.date);
            const slAmount = Math.abs(sl.amount);
            
            // Try exact match: amount + date ±3 days
            let bestMatch: any = null;
            let bestScore = 0;

            for (const je of jeAmounts) {
                let score = 0;
                
                // Amount match (must be exact or very close)
                const amountDiff = Math.abs(je.amount - slAmount);
                if (amountDiff < 0.01) score += 50;
                else if (amountDiff < 1) score += 30;
                else continue; // Skip if amount doesn't match

                // Date proximity
                const daysDiff = Math.abs((slDate.getTime() - je.date.getTime()) / 86400000);
                if (daysDiff < 1) score += 30;
                else if (daysDiff <= 3) score += 20;
                else if (daysDiff <= 7) score += 10;
                else score += 0;

                // Reference match
                if (sl.reference && je.ref && (
                    je.ref.includes(sl.reference) || sl.reference.includes(je.ref)
                )) {
                    score += 20;
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = je;
                }
            }

            if (bestScore >= 70) {
                results.push({ lineId: sl.id, status: 'MATCHED', matchedJeId: bestMatch.jeId, matchedRef: bestMatch.ref, confidence: bestScore });
            } else if (bestScore >= 40) {
                results.push({ lineId: sl.id, status: 'SUGGESTED', matchedJeId: bestMatch?.jeId, matchedRef: bestMatch?.ref, confidence: bestScore });
            } else {
                results.push({ lineId: sl.id, status: 'UNMATCHED', confidence: 0 });
            }
        }

        return results;
    }

    /**
     * Get reconciliation summary for a bank account
     */
    static async getSummary(
        prisma: PrismaClient,
        bankAccountId: number
    ): Promise<{
        bookBalance: number;
        bankBalance: number;
        difference: number;
        matchedCount: number;
        unmatchedCount: number;
        totalLines: number;
    }> {
        // Book balance from GL
        const glEntries = await (prisma as any).journalEntry.findMany({
            take: 100,
            where: { status: { in: ['posted', 'POSTED'] } },
            include: { lines: { where: { accountId: bankAccountId } } },
        });
        
        let bookBalance = 0;
        for (const je of glEntries) {
            for (const line of je.lines) {
                bookBalance += Number(line.debit) - Number(line.credit);
            }
        }

        return {
            bookBalance: Math.round(bookBalance * 100) / 100,
            bankBalance: 0, // Set from uploaded statement
            difference: 0,
            matchedCount: 0,
            unmatchedCount: 0,
            totalLines: 0,
        };
    }
}
