const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function bypass() {
    try {
        const res = await prisma.subscription.updateMany({
            data: { 
                status: 'ACTIVE',
                endDate: new Date('2035-12-31T23:59:59Z')
            }
        });
        console.log(`✅ SUCCESS! Reactivated ${res.count} expired store subscriptions across the SaaS Network.`);
    } catch (err) {
        console.error("Failed to update subscriptions:", err);
    } finally {
        await prisma.$disconnect();
    }
}

bypass();
