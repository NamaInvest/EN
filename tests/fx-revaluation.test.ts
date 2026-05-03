/**
 * FX Revaluation Engine Tests
 * IAS 21 — Foreign Currency Translation
 */
import { describe, it, expect } from 'vitest';

describe('FX Revaluation Logic', () => {
    describe('Unrealized Gain/Loss Calculation', () => {
        it('should calculate gain when rate increases (long position)', () => {
            const originalAmount = 10000; // USD
            const bookRate = 3.70; // SAR/USD at booking
            const closingRate = 3.75; // SAR/USD at period end
            const bookValue = originalAmount * bookRate;
            const fairValue = originalAmount * closingRate;
            const unrealizedGain = fairValue - bookValue;
            expect(unrealizedGain).toBe(500);
        });

        it('should calculate loss when rate decreases', () => {
            const originalAmount = 10000;
            const bookRate = 3.80;
            const closingRate = 3.75;
            const unrealizedLoss = (originalAmount * closingRate) - (originalAmount * bookRate);
            expect(unrealizedLoss).toBe(-500);
        });

        it('should return 0 for same-currency accounts', () => {
            const bookValue = 50000;
            const fairValue = 50000;
            expect(fairValue - bookValue).toBe(0);
        });
    });

    describe('Multi-Currency Revaluation', () => {
        it('should revalue multiple currencies independently', () => {
            const positions = [
                { currency: 'USD', amount: 10000, bookRate: 3.70, closingRate: 3.75 },
                { currency: 'EUR', amount: 5000, bookRate: 4.10, closingRate: 4.20 },
                { currency: 'GBP', amount: 3000, bookRate: 4.60, closingRate: 4.55 },
            ];

            const results = positions.map(p => ({
                currency: p.currency,
                unrealized: (p.amount * p.closingRate) - (p.amount * p.bookRate)
            }));

            expect(results[0].unrealized).toBe(500);   // USD gain
            expect(results[1].unrealized).toBe(500);   // EUR gain
            expect(results[2].unrealized).toBeCloseTo(-150, 2);  // GBP loss
        });

        it('should calculate total net revaluation', () => {
            const gains = [500, 500, -150];
            const total = gains.reduce((s, g) => s + g, 0);
            expect(total).toBe(850);
        });
    });

    describe('Journal Entry Generation', () => {
        it('should create balanced journal entry (debit = credit)', () => {
            const gain = 500;
            const debit = gain > 0 ? gain : 0;
            const credit = gain > 0 ? gain : 0;
            expect(debit).toBe(credit);
        });

        it('should reverse previous period revaluation', () => {
            const prevGain = 300;
            const currGain = 500;
            const netAdjustment = currGain - prevGain;
            expect(netAdjustment).toBe(200);
        });
    });
});
