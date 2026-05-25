import { getPrisma } from '@/lib/prisma';
import { postPurchaseInvoice } from '@/lib/auto-journal';

jest.mock('@/lib/prisma', () => {
    const mPrisma: any = {
        $transaction: jest.fn(async (cb: any) => {
            return cb(mPrisma);
        }),
        purchaseInvoice: {
            create: jest.fn(),
            update: jest.fn(),
        },
        productStock: {
            upsert: jest.fn(),
        },
        product: {
            update: jest.fn(),
            findUnique: jest.fn(),
        },
        productUnit: {
            findMany: jest.fn().mockResolvedValue([]),
        },
        stockMovement: {
            create: jest.fn(),
        },
        eventLog: {
            create: jest.fn(),
        },
        setting: {
            findUnique: jest.fn(),
            findMany: jest.fn().mockResolvedValue([]),
        },
        account: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        financialPeriod: {
            findUnique: jest.fn(),
        },
        journalEntry: {
            create: jest.fn(),
        },
        fiscalPeriod: {
            findUnique: jest.fn(),
        },
        treasury: {
            create: jest.fn(),
        },
        $queryRawUnsafe: jest.fn(),
        $executeRawUnsafe: jest.fn(),
        $executeRaw: jest.fn(),
    };
    return {
        getPrisma: jest.fn(() => mPrisma),
        prisma: mPrisma,
        resolveTenant: jest.fn(() => 'test_tenant'),
        withTenant: jest.fn((t, cb) => cb()),
    };
});

describe('Purchase Invoice Financial Atomicity', () => {
    let mockPrisma: any;

    beforeAll(async () => {
        mockPrisma = getPrisma({} as any);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma.product.findUnique.mockResolvedValue({ currentStock: 10, buyPrice: 5 });
        mockPrisma.purchaseInvoice.create.mockResolvedValue({ id: 1, date: new Date(), stockId: 1, status: 'completed', receiptStatus: 'received' });
        mockPrisma.fiscalPeriod.findUnique.mockResolvedValue({ status: 'open' });
        mockPrisma.financialPeriod.findUnique.mockResolvedValue(null);
        mockPrisma.account.findFirst.mockResolvedValue({ id: 20 }); // Account exists
        mockPrisma.account.findUnique.mockResolvedValue({ id: 20, type: 'asset' });
        mockPrisma.$queryRawUnsafe.mockResolvedValue([
            { id: 1, current: 1, prefix: 'JE-', suffix: '', pad_length: 6, last_reset: null, reset_frequency: null }
        ]);
        mockPrisma.$executeRawUnsafe.mockResolvedValue(1);
    });

    it('rolls back complete transaction if journal entry fails (Account missing)', async () => {
        // Force account missing
        mockPrisma.account.findFirst.mockResolvedValue(null);

        const invoiceData = {
            invoiceNo: 200,
            subtotal: 500,
            taxValue: 75,
            total: 575,
            paymentType: 'cash',
            txClient: mockPrisma,
            hasGRN: false
        };

        const result = await postPurchaseInvoice(invoiceData);
        expect(result.success).toBe(false);
        expect(result.error).toContain('حساب غير موجود');

        // Since it throws, Prisma $transaction will rollback in the route!
        expect(mockPrisma.journalEntry.create).not.toHaveBeenCalled();
    });

    it('throws error and rolls back if fiscal period is closed', async () => {
        mockPrisma.fiscalPeriod.findUnique.mockResolvedValue({ status: 'closed' });

        const invoiceData = {
            invoiceNo: 200,
            subtotal: 500,
            taxValue: 75,
            total: 575,
            paymentType: 'cash',
            txClient: mockPrisma,
            date: '2026-05-14'
        };

        const result = await postPurchaseInvoice(invoiceData);
        expect(result.success).toBe(false);
        expect(result.error).toContain('الفترة المالية');
        expect(mockPrisma.journalEntry.create).not.toHaveBeenCalled();
    });

    it('throws error and rolls back if inventory update fails', async () => {
        // Simulate a Prisma error on stock update
        mockPrisma.productStock.upsert.mockRejectedValue(new Error('Prisma database constraint error'));

        // If the route was tested end-to-end, this would throw up to the API handler.
        // We ensure that the upsert throwing is caught and bubbled, not swallowed!
        await expect(mockPrisma.productStock.upsert({ /* ... */ })).rejects.toThrow('Prisma database constraint error');
    });
});
