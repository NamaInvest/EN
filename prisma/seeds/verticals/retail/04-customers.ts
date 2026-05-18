import { PrismaClient } from '@prisma/client';
export async function seedCustomers(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding 50 Customers...');
    for (let i = 1; i <= 50; i++) {
        // @ts-ignore
        if (prisma.customer) {
            // @ts-ignore
            await prisma.customer.create({
                data: { name: `عميل تجزئة ${i}`, phone: `05000000${i < 10 ? '0'+i : i}`, taxNumber: `30000000${i}00003` }
            }).catch(() => null);
        }
    }
}