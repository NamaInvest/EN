const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    try {
        console.log('Seeding Enterprise Dummy Data...');

        // 1. Seed WHT Transactions
        const rule = await prisma.wHTRule.create({
            data: {
                countryCode: 'US',
                serviceType: 'Technical Consulting',
                residentRate: 5.0,
                nonResidentRate: 15.0,
                effectiveFrom: new Date()
            }
        });

        // Find a customer to act as supplier
        let vendor = await prisma.customer.findFirst();
        if (!vendor) {
            vendor = await prisma.customer.create({
                data: { name: 'Tech Global Inc', type: 1 } // Supplier
            });
        }

        await prisma.wHTTransaction.create({
            data: {
                vendorId: vendor.id,
                ruleId: rule.id,
                baseAmount: 50000,
                whtRate: 15.0,
                whtAmount: 7500,
                paidToZATCA: false
            }
        });

        // 2. Seed Quality Inspections
        await prisma.qualityInspection.create({
            data: {
                referenceNumber: 'GRN-2026-0091',
                inspectorId: 1,
                status: 'PENDING',
                notes: ''
            }
        });

        await prisma.qualityInspection.create({
            data: {
                referenceNumber: 'MO-2026-0044',
                inspectorId: 1,
                status: 'FAILED',
                notes: 'Color mismatch, NCR required.'
            }
        });

        // 3. Seed Cost Variances
        await prisma.costVariance.create({
            data: {
                type: 'PPV',
                orderId: 1001,
                expectedCost: 10000,
                actualCost: 12500,
                varianceAmount: 2500,
                isPosted: false
            }
        });

        await prisma.costVariance.create({
            data: {
                type: 'MV',
                orderId: 1002,
                expectedCost: 8000,
                actualCost: 7500,
                varianceAmount: -500, // Favorable
                isPosted: false
            }
        });

        console.log('Seeding completed successfully!');
    } catch (e) {
        console.error('Seeding failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
