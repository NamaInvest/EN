import { PrismaClient, Employee } from '@prisma/client';

const prisma = new PrismaClient();

export async function employeeFactory(overrides: Partial<Employee> = {}): Promise<Employee> {
  const defaultData = {
    name: `Emp ${Date.now()}`,
    nameEn: `Emp EN ${Date.now()}`,
    email: `emp${Date.now()}@test.local`,
    iqamaNumber: '2' + Math.floor(100000000 + Math.random() * 900000000).toString(),
    basicSalary: 5000,
    housingAllowance: 1250,
    transportationAllowance: 500,
    isActive: true,
    mudadStatus: 'ACTIVE',
    tenantId: 'test-tenant',
  };

  return await prisma.employee.create({
    data: { ...defaultData, ...overrides } as any,
  });
}
