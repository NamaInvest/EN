import { PrismaClient } from '@prisma/client';

type OptionalFeatureDelegates = {
    siemEvent?: {
        createMany: (args: { data: Array<Record<string, unknown>> }) => Promise<unknown>;
    };
};

export async function seedFeatureDemo(prisma: PrismaClient, tenantId: string) {
    console.log(`Seeding feature demo data for ${tenantId}...`);

    // 1. VAT Categories (ZATCA Phase 2)
    const vatCategories = [
        { code: 'S', nameAr: 'Standard Rate (15%)', nameEn: 'Standard Rate (15%)', rate: 0.15, zatcaCode: 'S', isActive: true },
        { code: 'Z', nameAr: 'Zero Rate (0%)', nameEn: 'Zero Rate (0%)', rate: 0, zatcaCode: 'Z', isActive: true },
        { code: 'E', nameAr: 'Exempt', nameEn: 'Exempt', rate: 0, zatcaCode: 'E', isActive: true },
        { code: 'O', nameAr: 'Out of Scope', nameEn: 'Out of Scope', rate: 0, zatcaCode: 'O', isActive: true }
    ];

    for (const vat of vatCategories) {
        await prisma.vatCategory.upsert({
            where: { code: vat.code },
            update: {},
            create: { ...vat, tenantId }
        });
    }

    // 2. PDPL Requests and Breaches (Compliance Demo)
    await prisma.pdplDataSubjectRequest.createMany({
        data: [
            { tenantId, requestType: 'ACCESS', subjectType: 'CUSTOMER', subjectId: 1, subjectIdentifier: 'ahmed@example.com', status: 'RECEIVED', receivedAt: new Date(Date.now() - 10 * 86400000), dueDate: new Date(Date.now() + 20 * 86400000) },
            { tenantId, requestType: 'ERASE', subjectType: 'CUSTOMER', subjectId: 2, subjectIdentifier: 'khalid@example.com', status: 'IN_PROGRESS', receivedAt: new Date(Date.now() - 25 * 86400000), dueDate: new Date(Date.now() + 5 * 86400000) },
            { tenantId, requestType: 'RECTIFY', subjectType: 'CUSTOMER', subjectId: 3, subjectIdentifier: 'sami@example.com', status: 'RECEIVED', receivedAt: new Date(Date.now() - 35 * 86400000), dueDate: new Date(Date.now() - 5 * 86400000) },
        ]
    });

    await prisma.pdplBreachIncident.createMany({
        data: [
            { tenantId, category: 'UNAUTHORIZED_ACCESS', severity: 'LOW', status: 'CONTAINED', detectedAt: new Date(Date.now() - 5 * 86400000), affectedRecords: 12, notificationToSdaia: true, rootCause: 'Unauthorized access to marketing DB' },
            { tenantId, category: 'RANSOMWARE', severity: 'CRITICAL', status: 'DETECTED', detectedAt: new Date(Date.now() - 1 * 86400000), affectedRecords: 50, notificationToSdaia: false, rootCause: 'Ransomware detected on HR server' },
        ]
    });

    // 3. SIEM Audit Events. This delegate is optional because some schemas do not enable it.
    const optionalPrisma = prisma as PrismaClient & OptionalFeatureDelegates;
    if (optionalPrisma.siemEvent) {
        await optionalPrisma.siemEvent.createMany({
            data: [
                { tenantId, eventType: 'FAILED_LOGIN', severity: 'HIGH', ipAddress: '192.168.1.100', details: { reason: 'Brute force' }, createdAt: new Date() },
                { tenantId, eventType: 'FILE_DELETION', severity: 'CRITICAL', ipAddress: '10.0.0.5', details: { file: 'financial_records_2023.pdf' }, createdAt: new Date() },
                { tenantId, eventType: 'PERMISSION_CHANGE', severity: 'MEDIUM', ipAddress: '192.168.1.50', details: { role: 'admin', user: 'jdoe' }, createdAt: new Date() },
            ]
        });
    }

    // 4. Qiwa Contracts
    await prisma.qiwaContract.createMany({
        data: [
            { tenantId, employeeId: 1, contractNo: 'QIWA-DEMO-001', contractType: 'FIXED', qiwaStatus: 'ACTIVE', startDate: new Date(Date.now() - 300 * 86400000), endDate: new Date(Date.now() + 65 * 86400000) },
            { tenantId, employeeId: 2, contractNo: 'QIWA-DEMO-002', contractType: 'UNLIMITED', qiwaStatus: 'ACTIVE', startDate: new Date(Date.now() - 500 * 86400000), endDate: null },
            { tenantId, employeeId: 3, contractNo: 'QIWA-DEMO-003', contractType: 'FIXED', qiwaStatus: 'EXPIRED', startDate: new Date(Date.now() - 400 * 86400000), endDate: new Date(Date.now() - 35 * 86400000) },
        ]
    });

    // 5. Saudization Snapshots (Trend)
    await prisma.saudizationSnapshot.createMany({
        data: [
            { tenantId, snapshotDate: new Date(Date.now() - 60 * 86400000), totalEmployees: 35, saudiEmployees: 5, saudiPct: 0.1420, activityCode: '6201', sizeBracket: 'SMALL', nitaqatBand: 'YELLOW' },
            { tenantId, snapshotDate: new Date(Date.now() - 30 * 86400000), totalEmployees: 35, saudiEmployees: 6, saudiPct: 0.1710, activityCode: '6201', sizeBracket: 'SMALL', nitaqatBand: 'YELLOW' },
            { tenantId, snapshotDate: new Date(), totalEmployees: 36, saudiEmployees: 8, saudiPct: 0.2220, activityCode: '6201', sizeBracket: 'SMALL', nitaqatBand: 'GREEN_LOW' },
        ]
    });

    console.log(`Feature demo data seed complete for ${tenantId}.`);
}
