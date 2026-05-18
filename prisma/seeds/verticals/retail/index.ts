import { PrismaClient } from '@prisma/client';
import { seedCompany } from './01-company';
import { seedCOA } from './02-coa';
import { seedProducts } from './03-products';
import { seedCustomers } from './04-customers';
import { seedSuppliers } from './05-suppliers';
import { seedEmployees } from './06-employees';
import { seedHistorical } from './07-historical-transactions';
import { seedBalances } from './08-open-balances';

export async function runRetailSeed(prisma: PrismaClient, tenantId: string) {
    console.log('====================================');
    console.log('🚀 Starting Retail Vertical Seed...');
    console.log('====================================');
    await seedCompany(prisma, tenantId);
    await seedCOA(prisma, tenantId);
    await seedProducts(prisma, tenantId);
    await seedCustomers(prisma, tenantId);
    await seedSuppliers(prisma, tenantId);
    await seedEmployees(prisma, tenantId);
    await seedHistorical(prisma, tenantId);
    await seedBalances(prisma, tenantId);
    console.log('====================================');
    console.log('✅ Retail Seed Completed.');
    console.log('====================================');
}