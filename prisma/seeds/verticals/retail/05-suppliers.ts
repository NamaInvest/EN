import { PrismaClient } from '@prisma/client';
export async function seedSuppliers(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding 20 Suppliers...');
    for (let i = 1; i <= 20; i++) {
        // @ts-ignore
        if (prisma.supplier) {
            // @ts-ignore
            await prisma.supplier.create({
                data: { name: `مورد تجزئة ${i}`, phone: `05500000${i < 10 ? '0'+i : i}`, taxNumber: `31100000${i}00003` }
            }).catch(() => null);
        }
    }
}