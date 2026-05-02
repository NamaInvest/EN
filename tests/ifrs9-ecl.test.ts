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
        },
        $transaction: vi.fn(),
    }
}));

describe('IFRS9Engine Engine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate Stage 1 ECL correctly (PD * LGD * EAD)', async () => {
        // Mock 1 invoice
        (prisma.salesInvoice.findMany as any).mockResolvedValue([
            { id: 1, balanceDue: 10000, status: 'posted', dueDate: new Date() }
        ]);

        (prisma.eCLModel.findUnique as any).mockResolvedValue({
            stage1PD: 0.05, // 5%
            stage1LGD: 0.40, // 40%
        });

        const ead = await IFRS9Engine.calculateEAD(1);
        expect(ead).toBe(10000);

        const ecl = await IFRS9Engine.calculateCustomerECL(1, 1);
        // Stage 1 Expected ECL: 10000 * 0.05 * 0.40 = 200
        expect(ecl.eclAmount).toBe(200);
        expect(ecl.stage).toBe(1);
    });

    it('should classify customer as Stage 3 if invoices are > 90 days overdue', async () => {
        const past90Days = new Date();
        past90Days.setDate(past90Days.getDate() - 100);

        (prisma.salesInvoice.findMany as any).mockResolvedValue([
            { id: 2, balanceDue: 50000, status: 'posted', dueDate: past90Days }
        ]);

        (prisma.eCLModel.findUnique as any).mockResolvedValue({
            stage3PD: 1.0, // 100%
            stage3LGD: 0.50, // 50%
        });

        const ecl = await IFRS9Engine.calculateCustomerECL(1, 1);
        
        expect(ecl.stage).toBe(3);
        // Stage 3 Expected ECL: 50000 * 1.0 * 0.50 = 25000
        expect(ecl.eclAmount).toBe(25000);
    });
});
