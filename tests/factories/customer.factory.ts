import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createCustomer(overrides = {}) {
  const defaultCustomer = {
    name: 'شركة تجريبية للعملاء',
    nameEn: 'Demo Customer Co',
    vatNumber: '311122233300003',
    crNumber: '1010123456',
    email: 'info@democustomer.com',
    phone: '+966500000000',
    type: 'B2B',
    tenantId: 'demo-tenant',
    isActive: true,
  };

  const data = { ...defaultCustomer, ...overrides };

  // @ts-ignore
  return await prisma.customer.create({ data });
}
