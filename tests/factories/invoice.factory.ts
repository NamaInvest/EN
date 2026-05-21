import { PrismaClient, SalesInvoice } from '@prisma/client';

const prisma = new PrismaClient();

export async function invoiceFactory(overrides: Partial<SalesInvoice> = {}): Promise<SalesInvoice> {
  const defaultData = {
    invoiceNo: `INV-${Date.now()}`,
    customerId: 1, // Must exist
    branchId: 1,
    issueDate: new Date(),
    dueDate: new Date(),
    totalAmount: 1150,
    taxAmount: 150,
    netAmount: 1000,
    status: 'DRAFT',
    zatcaStatus: 'PENDING',
    tenantId: 'test-tenant',
  };

  return await prisma.salesInvoice.create({
    data: { ...defaultData, ...overrides } as any,
  });
}
