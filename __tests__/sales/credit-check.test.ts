import { checkCredit } from '../../src/lib/credit-check';

describe('Customer Credit Limit Engine', () => {
    let mockTx: any;

    beforeEach(() => {
        mockTx = {
            customer: {
                findUnique: jest.fn().mockResolvedValue({
                    creditLimit: 10000,
                    status: 'ACTIVE',
                    creditTermsDays: 30
                })
            },
            salesInvoice: {
                aggregate: jest.fn().mockResolvedValue({
                    _sum: { totalAmount: 8000, paidAmount: 2000 } // Used: 6000
                })
            },
            salesOrder: {
                aggregate: jest.fn().mockResolvedValue({
                    _sum: { totalAmount: 1000 } // Pending: 1000
                })
            }
        };
    });

    it('should pass if additional amount is within limit', async () => {
        // Used: 6000 + 1000 (Pending) = 7000
        // Additional: 2000 => Total 9000 <= 10000 limit
        const result = await checkCredit(mockTx, 1, 2000);
        expect(result.passed).toBe(true);
        expect(result.totalExposure).toBe(9000);
    });

    it('should fail with 422 reason if additional amount exceeds limit', async () => {
        // Used: 6000 + 1000 (Pending) = 7000
        // Additional: 4000 => Total 11000 > 10000 limit
        const result = await checkCredit(mockTx, 1, 4000);
        expect(result.passed).toBe(false);
        expect(result.reason).toContain('Credit limit exceeded');
    });

    it('should pass if additional amount exceeds limit BUT bypass is granted', async () => {
        const result = await checkCredit(mockTx, 1, 4000, true);
        expect(result.passed).toBe(true);
        expect(result.totalExposure).toBe(11000);
    });

    it('should fail if customer is ON_HOLD even if within limit', async () => {
        mockTx.customer.findUnique.mockResolvedValue({
            creditLimit: 10000,
            status: 'ON_HOLD'
        });

        const result = await checkCredit(mockTx, 1, 1000);
        expect(result.passed).toBe(false);
        expect(result.reason).toContain('ON HOLD');
    });

    it('should pass if customer is ON_HOLD but bypass is granted', async () => {
        mockTx.customer.findUnique.mockResolvedValue({
            creditLimit: 10000,
            status: 'ON_HOLD'
        });

        const result = await checkCredit(mockTx, 1, 1000, true);
        expect(result.passed).toBe(true);
    });
});
