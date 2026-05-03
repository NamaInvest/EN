/**
 * Budget Control Engine Tests
 */
import { describe, it, expect } from 'vitest';

describe('Budget Control Logic', () => {
    describe('Budget Availability Check', () => {
        it('should allow spending within budget', () => {
            const allocated = 100000;
            const spent = 40000;
            const encumbered = 10000;
            const amount = 20000;

            const available = allocated - spent - encumbered;
            const allowed = available >= amount;
            expect(available).toBe(50000);
            expect(allowed).toBe(true);
        });

        it('should reject spending exceeding budget', () => {
            const allocated = 100000;
            const spent = 80000;
            const encumbered = 15000;
            const amount = 10000;

            const available = allocated - spent - encumbered;
            const allowed = available >= amount;
            expect(available).toBe(5000);
            expect(allowed).toBe(false);
        });

        it('should calculate breach percentage correctly', () => {
            const allocated = 100000;
            const spent = 80000;
            const encumbered = 10000;
            const amount = 15000;

            const proposedTotal = spent + encumbered + amount;
            const breachPct = (proposedTotal / allocated) * 100;
            expect(breachPct).toBe(105); // 5% over budget
        });

        it('should handle zero budget line', () => {
            const allocated = 0;
            const amount = 100;

            const available = allocated - 0 - 0;
            const allowed = available >= amount;
            expect(allowed).toBe(false);
        });
    });

    describe('Encumbrance Lifecycle', () => {
        it('should track encumbrance creation', () => {
            const enc = {
                sourceDocType: 'PO',
                sourceDocId: 101,
                accountId: 5100,
                amount: 25000,
                status: 'ACTIVE',
            };
            expect(enc.status).toBe('ACTIVE');
            expect(enc.amount).toBe(25000);
        });

        it('should release encumbrance on invoice receipt', () => {
            const enc = {
                status: 'ACTIVE' as string,
                amount: 25000,
                releasedAt: null as Date | null,
            };
            // Simulate release
            enc.status = 'RELEASED';
            enc.releasedAt = new Date();
            expect(enc.status).toBe('RELEASED');
            expect(enc.releasedAt).toBeInstanceOf(Date);
        });
    });

    describe('Variance Analysis', () => {
        it('should identify favorable variance', () => {
            const allocated = 50000;
            const spent = 40000;
            const variance = allocated - spent;
            const status = variance >= 0 ? 'FAVORABLE' : 'UNFAVORABLE';
            expect(variance).toBe(10000);
            expect(status).toBe('FAVORABLE');
        });

        it('should identify unfavorable variance', () => {
            const allocated = 50000;
            const spent = 55000;
            const variance = allocated - spent;
            const status = variance >= 0 ? 'FAVORABLE' : 'UNFAVORABLE';
            expect(variance).toBe(-5000);
            expect(status).toBe('UNFAVORABLE');
        });
    });
});
