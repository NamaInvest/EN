// @ts-nocheck
import { PrismaClient, BankStatementLine } from '@prisma/client';

const prisma = new PrismaClient();

export class BankReconEngine {
    
    /**
     * Run the Auto-Matching routine on a specific Bank Statement
     */
    static async autoMatch(statementId: number, userId: number): Promise<{ autoMatched: number, needsReview: number, unmatched: number }> {
        const statement = await prisma.bankStatement.findUnique({
            where: { id: statementId },
            include: { lines: true }
        });

        if (!statement) throw new Error("Statement not found");

        let autoMatchedCount = 0;
        let needsReviewCount = 0;
        let unmatchedCount = 0;

        for (const line of statement.lines) {
            if (line.matchStatus !== 'UNMATCHED') continue;

            // 1. Exact Match (Amount + Date within 3 days + Description similarity)
            const exactMatch = await this.findExactMatch(line);
            if (exactMatch) {
                await this.applyMatch(line.id, exactMatch.type, exactMatch.id, 99.0, userId, 'AUTO_MATCHED');
                autoMatchedCount++;
                continue;
            }

            // 2. Rule Match (e.g., "BANK CHARGE" -> 5800)
            const ruleMatch = await this.findRuleMatch(line);
            if (ruleMatch) {
                // Creates a new JE for the bank fee based on rule
                const je = await this.postLineAsNewJE(line, ruleMatch.postToAccountCode, userId, ruleMatch.id);
                await this.applyMatch(line.id, 'RULE', ruleMatch.id, 90.0, userId, 'AUTO_MATCHED');
                autoMatchedCount++;
                continue;
            }

            // 3. Fuzzy Match / Needs Review
            const fuzzyCandidates = await this.findFuzzyMatch(line);
            if (fuzzyCandidates.length > 0) {
                // Flag for manual review but save candidates (simplified here)
                unmatchedCount++; // actually "needs review" but we leave it UNMATCHED for now
                continue;
            }

            unmatchedCount++;
        }

        return { autoMatched: autoMatchedCount, needsReview: needsReviewCount, unmatched: unmatchedCount };
    }

    private static async findExactMatch(line: BankStatementLine): Promise<{ type: string, id: number } | null> {
        const amount = line.debit > 0 ? line.debit : line.credit;
        
        // Find an open Payment or Receipt with exact amount and date +/- 3 days
        const targetDate = new Date(line.valueDate);
        const minDate = new Date(targetDate); minDate.setDate(minDate.getDate() - 3);
        const maxDate = new Date(targetDate); maxDate.setDate(maxDate.getDate() + 3);

        if (line.debit > 0) {
            // Money left bank -> Payment out
            // Look for unmatched Payments
        } else {
            // Money entered bank -> Receipt in
            // Look for unmatched Receipts
        }

        // Dummy implementation to represent exact matching
        return null; 
    }

    private static async findRuleMatch(line: BankStatementLine): Promise<any | null> {
        const rules = await prisma.bankReconRule.findMany({ where: { isActive: true }, orderBy: { priority: 'asc' } });
        
        for (const rule of rules) {
            const conditions = rule.conditions as any;
            if (conditions.descriptionContains && line.description.toUpperCase().includes(conditions.descriptionContains.toUpperCase())) {
                return rule;
            }
        }
        return null;
    }

    private static async findFuzzyMatch(line: BankStatementLine): Promise<any[]> {
        return [];
    }

    private static async applyMatch(lineId: number, matchType: string, matchedToId: number, confidence: number, userId: number, status: string) {
        await prisma.bankStatementLine.update({
            where: { id: lineId },
            data: {
                matchStatus: status,
                matchConfidence: confidence,
                matchedBy: userId,
                matchedAt: new Date()
            }
        });

        await prisma.bankReconMatch.create({
            data: {
                bankLineId: lineId,
                matchType: matchType,
                matchedTo: matchedToId.toString(),
                confidence: confidence,
                matchedBy: userId
            }
        });
    }

    static async postLineAsNewJE(line: BankStatementLine, accountCode: string, userId: number, ruleId?: number): Promise<any> {
        // Implement Journal Entry creation for bank charges, interest, etc.
        // Debit Expense, Credit Bank (if line.debit)
        // Debit Bank, Credit Income (if line.credit)
        return { id: 999 }; // Mock
    }
}
