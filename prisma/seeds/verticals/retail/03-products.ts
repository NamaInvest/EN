import { PrismaClient } from '@prisma/client';
export async function seedProducts(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding 100 Retail Products...');
    // @ts-ignore
    let unitId = null;
    // @ts-ignore
    let categoryId = null;
    try {
        // @ts-ignore
        let u = await prisma.unit.findFirst({ where: { name: 'Piece' } });
        // @ts-ignore
        if (!u) u = await prisma.unit.create({ data: { name: 'Piece', tenantId } });
        unitId = u.id;
        
        // @ts-ignore
        let c = await prisma.category.findFirst({ where: { name: 'Retail' } });
        // @ts-ignore
        if (!c) c = await prisma.category.create({ data: { name: 'Retail', tenantId } });
        categoryId = c.id;
    } catch(e) {}
    
    for (let i = 1; i <= 100; i++) {
        // @ts-ignore
        if (prisma.product) {
            // @ts-ignore
            await prisma.product.create({
                data: { 
                  name: `Demo Product ${i}`, 
                  barcode: `1000${i}`, 
                  sellPrice: 50 + i, 
                  buyPrice: 30 + i, 
                  taxRate: 15, 
                  tenantId: tenantId, 
                  unit: unitId ? { connect: { id: unitId } } : undefined, 
                  category: categoryId ? { connect: { id: categoryId } } : undefined 
                }
            }).catch(() => null);
        }
    }
}