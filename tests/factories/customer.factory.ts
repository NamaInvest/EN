import { PrismaClient, Customer } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates a mock customer for testing purposes.
 * @param overrides Partial customer fields to override defaults.
 * @returns The created Customer record.
 */
export async function customerFactory(overrides: Partial<Customer> = {}): Promise<Customer> {
  const defaultData = {
    name: `Test Customer ${Date.now()}`,
    nameEn: `Test Customer EN ${Date.now()}`,
    phone: `+9665${Math.floor(10000000 + Math.random() * 90000000)}`,
    email: `customer${Date.now()}@test.local`,
    taxNumber: '311122233300003',
    isActive: true,
    tenantId: 'test-tenant',
    creditLimit: 10000,
  };

  return await prisma.customer.create({
    data: { ...defaultData, ...overrides } as any,
  });
}
