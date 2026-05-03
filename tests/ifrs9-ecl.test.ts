import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IFRS9Engine } from '../src/lib/ifrs9-ecl';
import { prisma } from '../src/lib/prisma';

vi.mock('../src/lib/prisma', () => ({
    prisma: {
        customer: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        eCLAssessment: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        salesInvoice: {
            findMany: vi.fn(),
        },
        eCLModel: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
        },
        $transaction: vi.fn(),
    }
}));

describe('IFRS9Engine Engine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate Stage 1 ECL correctly', async () => {
        (prisma.customer.findUnique as any).mockResolvedValue({ id: 1, category: 'General' });

        // Mock 1 invoice within 30 days
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 10);
        (prisma.salesInvoice.findMany as any).mockResolvedValue([
            { id: 1, remaining: 10000, status: 'posted', date: recentDate }
        ]);

        (prisma.eCLModel.findFirst as any).mockResolvedValue({
            stage1Pct: 0.05, // 5%
        });

        (prisma.eCLAssessment.create as any).mockImplementation(({ data }: any) => Promise.resolve(data));

        const asOfDate = new Date();
        const ecl = await IFRS9Engine.assessCustomer(1, 1, asOfDate);
        
        expect(ecl).not.toBeNull();
        expect(ecl!.exposure).toBe(10000);
        expect(ecl!.stage).toBe(1);
        // Stage 1 Expected ECL: 10000 * 0.05 * 0.50 (hardcoded LGD) = 250
        expect(ecl!.eclAmount).toBe(250);
    });

    it('should classify customer as Stage 3 if invoices are > 90 days overdue', async () => {
        (prisma.customer.findUnique as any).mockResolvedValue({ id: 1, category: 'General' });

        const past100Days = new Date();
        past100Days.setDate(past100Days.getDate() - 130); // invoice date 130 days ago, due date was 100 days ago

        (prisma.salesInvoice.findMany as any).mockResolvedValue([
            { id: 2, remaining: 50000, status: 'posted', date: past100Days }
        ]);

        (prisma.eCLModel.findFirst as any).mockResolvedValue({
            stage3Pct: 1.0, // 100%
        });

        (prisma.eCLAssessment.create as any).mockImplementation(({ data }: any) => Promise.resolve(data));

        const asOfDate = new Date();
        const ecl = await IFRS9Engine.assessCustomer(1, 1, asOfDate);
        
        expect(ecl).not.toBeNull();
        expect(ecl!.stage).toBe(3);
        // Stage 3 Expected ECL: 50000 * 1.0 * 0.50 = 25000
        expect(ecl!.eclAmount).toBe(25000);
    });
});
