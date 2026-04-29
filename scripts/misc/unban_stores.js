const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function bypassBilling() {
    console.log("Searching for Stores to extend subscription...");
    
    // Most SaaS ERPs use 'store', 'tenant', 'company', 'organization'
    // Let's check available models in Prisma generically:
    const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
    console.log("Available Models:", models);
    
    // Attempting to update anything that looks like a store/tenant
    for (const model of models) {
        if (model.toLowerCase() === 'store' || model.toLowerCase() === 'tenant' || model.toLowerCase() === 'company') {
            try {
                const date2035 = new Date('2035-12-31T23:59:59Z');
                
                // Typical subscription fields: subscriptionEndDate, validUntil, expiryDate
                // We'll just update blindly if it exists
                let updated = 0;
                
                // Update subscriptionEndDate if it exists
                try {
                    const res = await prisma[model].updateMany({
                        data: { subscriptionEndDate: date2035 }
                    });
                    updated += res.count;
                    console.log(`Extended subscriptionEndDate for ${res.count} ${model}s.`);
                } catch(e) {}

                try {
                    const res = await prisma[model].updateMany({
                        data: { validUntil: date2035 }
                    });
                    updated += res.count;
                    console.log(`Extended validUntil for ${res.count} ${model}s.`);
                } catch(e) {}
                
            } catch (error) {
                console.log(`Model ${model} does not have standard billing fields.`);
            }
        }
    }
    
    console.log("Done.");
    await prisma.$disconnect();
}

bypassBilling().catch(console.error);
