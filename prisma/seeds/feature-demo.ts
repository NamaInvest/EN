import { PrismaClient } from '@prisma/client';

export async function seedFeatureDemo(prisma: PrismaClient, tenantId: string) {
    console.log(`\n🚀 Seeding Phase A+B+C+D+E+F Feature Demo Data for ${tenantId}...`);
    
    // 1. VAT Categories (ZATCA Phase 2)
    const vatCategories = [
        { code: 'S', name: 'Standard Rate (15%)', rate: 15, isActive: true },
        { code: 'Z', name: 'Zero Rate (0%)', rate: 0, isActive: true },
        { code: 'E', name: 'Exempt', rate: 0, isActive: true },
        { code: 'O', name: 'Out of Scope', rate: 0, isActive: true }
    ];

    for (const vat of vatCategories) {
        try {
            // @ts-ignore
            if (prisma.vatCategory) {
                // @ts-ignore
                await prisma.vatCategory.upsert({
                    where: { code: vat.code },
                    update: {},
                    create: { ...vat, tenantId }
                });
            }
        } catch (e) {}
    }
    
    // 2. PDPL Requests & Breaches (Compliance Demo)
    try {
        // @ts-ignore
        if (prisma.pdplDataSubjectRequest) {
            // @ts-ignore
            await prisma.pdplDataSubjectRequest.createMany({
                data: [
                    { tenantId, requestType: 'ACCESS', status: 'RECEIVED', subjectEmail: 'ahmed@example.com', createdAt: new Date(Date.now() - 10 * 86400000), deadlineAt: new Date(Date.now() + 20 * 86400000) },
                    { tenantId, requestType: 'ERASURE', status: 'IN_PROGRESS', subjectEmail: 'khalid@example.com', createdAt: new Date(Date.now() - 25 * 86400000), deadlineAt: new Date(Date.now() + 5 * 86400000) },
                    { tenantId, requestType: 'RECTIFICATION', status: 'OVERDUE', subjectEmail: 'sami@example.com', createdAt: new Date(Date.now() - 35 * 86400000), deadlineAt: new Date(Date.now() - 5 * 86400000) },
                ]
            });
        }
        
        // @ts-ignore
        if (prisma.pdplBreachIncident) {
            // @ts-ignore
            await prisma.pdplBreachIncident.createMany({
                data: [
                    { tenantId, title: 'Unauthorized access to marketing DB', severity: 'LOW', status: 'CONTAINED', detectedAt: new Date(Date.now() - 5 * 86400000), sdaiaNotified: true },
                    { tenantId, title: 'Ransomware detected on HR server', severity: 'CRITICAL', status: 'DETECTED', detectedAt: new Date(Date.now() - 1 * 86400000), sdaiaNotified: false },
                ]
            });
        }
    } catch(e) {}

    // 3. SIEM Audit Events
    try {
        // @ts-ignore
        if (prisma.siemEvent) {
            // @ts-ignore
            await prisma.siemEvent.createMany({
                data: [
                    { tenantId, eventType: 'FAILED_LOGIN', severity: 'HIGH', ipAddress: '192.168.1.100', details: { reason: 'Brute force' }, createdAt: new Date() },
                    { tenantId, eventType: 'FILE_DELETION', severity: 'CRITICAL', ipAddress: '10.0.0.5', details: { file: 'financial_records_2023.pdf' }, createdAt: new Date() },
                    { tenantId, eventType: 'PERMISSION_CHANGE', severity: 'MEDIUM', ipAddress: '192.168.1.50', details: { role: 'admin', user: 'jdoe' }, createdAt: new Date() },
                ]
            });
        }
    } catch(e) {}

    // 4. Qiwa Contracts
    try {
        // @ts-ignore
        if (prisma.qiwaContract) {
            // @ts-ignore
            await prisma.qiwaContract.createMany({
                data: [
                    { tenantId, employeeId: 1, type: 'FIXED', status: 'ACTIVE', startDate: new Date(Date.now() - 300 * 86400000), endDate: new Date(Date.now() + 65 * 86400000) },
                    { tenantId, employeeId: 2, type: 'UNLIMITED', status: 'ACTIVE', startDate: new Date(Date.now() - 500 * 86400000), endDate: null },
                    { tenantId, employeeId: 3, type: 'FIXED', status: 'EXPIRED', startDate: new Date(Date.now() - 400 * 86400000), endDate: new Date(Date.now() - 35 * 86400000) },
                ]
            });
        }
    } catch(e) {}

    // 5. Saudization Snapshots (Trend)
    try {
        // @ts-ignore
        if (prisma.saudizationSnapshot) {
            // @ts-ignore
            await prisma.saudizationSnapshot.createMany({
                data: [
                    { tenantId, date: new Date(Date.now() - 60 * 86400000), category: 'YELLOW', saudiCount: 5, expatCount: 30, ratio: 14.2 },
                    { tenantId, date: new Date(Date.now() - 30 * 86400000), category: 'YELLOW', saudiCount: 6, expatCount: 29, ratio: 17.1 },
                    { tenantId, date: new Date(), category: 'GREEN_LOW', saudiCount: 8, expatCount: 28, ratio: 22.2 },
                ]
            });
        }
    } catch(e) {}

    console.log(`✅ Feature Demo Data Seed Complete for ${tenantId}.`);
}
