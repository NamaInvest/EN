import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenItemsEngine } from '@/lib/open-items';
import { DunningEngineV2 } from '@/lib/dunning-engine-v2';
import { mockPrisma, createTenantContext } from '../../helpers/test-harness';

// Mock standard prisma dependency used in Open Items Engines
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    openItem: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    financialPeriod: {
      findUnique: vi.fn(),
    },
    itemApplication: {
      create: vi.fn(),
    },
    salesInvoice: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    purchaseInvoice: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    treasury: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    setting: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
    },
    journalEntry: {
      create: vi.fn(),
    },
    dunningLevel: {
      findMany: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
  resolveTenant: () => 'test_tenant_open_items',
  withTenant: (tenant: string, callback: any) => callback(),
}));

import { prisma } from '@/lib/prisma';

describe('GL-03 SLA & Open Items Management Framework Integration Flow', () => {
    const ctx = createTenantContext('test_tenant_open_items');

    beforeEach(() => {
        vi.clearAllMocks();
        // Set all mock functions to resolve to a promise by default so .catch() works
        const mockPromiseResolvers = (obj: any) => {
            for (const key of Object.keys(obj)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    mockPromiseResolvers(obj[key]);
                } else if (typeof obj[key] === 'function' && vi.isMockFunction(obj[key])) {
                    obj[key].mockResolvedValue({});
                }
            }
        };
        mockPromiseResolvers(prisma);

        // Setup $transaction mock to resolve with internal logic
        (prisma.$transaction as any).mockImplementation(async (callback: any) => {
            return callback(prisma);
        });
    });

    it('should create a customer open item successfully in the sub-ledger', async () => {
        (prisma.openItem.create as any).mockResolvedValue({
            id: 101,
            partyId: 5,
            partyType: 'customer',
            documentType: 'sales_invoice',
            amount: 1500,
            openAmount: 1500,
            status: 'OPEN',
        });

        const openItem = await OpenItemsEngine.createOpenItem({
            partyId: 5,
            partyType: 'customer',
            documentType: 'sales_invoice',
            documentId: 12,
            documentNumber: 'SI-1001',
            documentDate: new Date(),
            amount: 1500,
            tenantId: ctx.tenantId,
        }, prisma);

        expect(prisma.openItem.create).toHaveBeenCalled();
        expect(openItem.amount).toBe(1500);
        expect(openItem.partyType).toBe('customer');
    });

    it('should create a vendor open item successfully in the sub-ledger', async () => {
        (prisma.openItem.create as any).mockResolvedValue({
            id: 102,
            partyId: 8,
            partyType: 'vendor',
            documentType: 'purchase_invoice',
            amount: 2000,
            openAmount: 2000,
            status: 'OPEN',
        });

        const openItem = await OpenItemsEngine.createOpenItem({
            partyId: 8,
            partyType: 'vendor',
            documentType: 'purchase_invoice',
            documentId: 44,
            documentNumber: 'PI-2002',
            documentDate: new Date(),
            amount: 2000,
            tenantId: ctx.tenantId,
        }, prisma);

        expect(prisma.openItem.create).toHaveBeenCalled();
        expect(openItem.amount).toBe(2000);
        expect(openItem.partyType).toBe('vendor');
    });

    it('should apply a payment and match it with an open invoice, updating open amounts', async () => {
        (prisma.financialPeriod.findUnique as any).mockResolvedValue({ status: 'OPEN' });
        // Mocking payment open item fetch
        (prisma.openItem.findFirst as any)
            .mockResolvedValueOnce({
                id: 501,
                partyId: 5,
                partyType: 'customer',
                documentType: 'payment',
                amount: 1000,
                openAmount: 1000,
                originalOpenAmount: 1000,
                exchangeRate: 1,
            })
            // Mocking invoice open item fetch
            .mockResolvedValueOnce({
                id: 101,
                partyId: 5,
                partyType: 'customer',
                documentType: 'sales_invoice',
                amount: 1500,
                openAmount: 1500,
                originalOpenAmount: 1500,
                exchangeRate: 1,
            });

        (prisma.itemApplication.create as any).mockResolvedValue({ id: 99 });
        (prisma.openItem.update as any).mockResolvedValue({ id: 101, status: 'PARTIAL' });

        const result = await OpenItemsEngine.applyPayment(
            501,
            [{ invoiceId: 101, amount: 1000 }],
            'system-user',
            ctx.tenantId,
            prisma
        );

        expect(result.appliedList.length).toBe(1);
        expect(result.totalFxGainLoss).toBe(0);
        expect(prisma.openItem.update).toHaveBeenCalledTimes(2);
    });

    it('should execute dunning v2 engine and transition levels for overdue invoices', async () => {
        // Mocking overdue invoices query
        (prisma.salesInvoice.findMany as any).mockResolvedValue([
            {
                id: 1,
                remaining: 5000,
                date: new Date(Date.now() - 40 * 86400000), // 40 days overdue
                customerId: 12,
                customer: { id: 12, dunningPaused: false, dunningCurrentLevel: 0 },
            }
        ]);

        // Mocking active dunning levels
        (prisma.dunningLevel.findMany as any).mockResolvedValue([
            { id: 2, levelNumber: 2, daysOverdue: 30, lateFeeAmount: 100, active: true },
            { id: 1, levelNumber: 1, daysOverdue: 10, lateFeeAmount: 0, active: true }
        ]);

        // Mocking setting lookup
        (prisma.setting.findUnique as any).mockResolvedValue({ value: '1210' });

        // Mocking promise-to-pay check (none active)
        (prisma as any).promiseToPay = {
            findFirst: vi.fn().mockResolvedValue(null),
        };
        (prisma as any).dunningCampaign = {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: 99 }),
        };
        (prisma as any).dunningLetter = {
            create: vi.fn().mockResolvedValue({ id: 88 }),
        };
        (prisma as any).dunningCommunication = {
            create: vi.fn().mockResolvedValue({ id: 77 }),
        };

        const res = await DunningEngineV2.executeDailyRun(prisma as any);

        expect(res.processed).toBe(1);
        expect(res.letters).toBe(1);
        expect(prisma.customer.update).toHaveBeenCalled();
    });
});
