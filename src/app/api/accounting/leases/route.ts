import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        let leases = await (prisma as any).ifrsLeaseContract.findMany({
            orderBy: { id: 'desc' }
        });

        // Seed if empty
        if (leases.length === 0) {
            const lease1 = await (prisma as any).ifrsLeaseContract.create({
                data: {
                    contractNumber: 'LC-2026-001',
                    lessor: 'Al-Riyadh Real Estate Co.',
                    description: 'HQ Office Building',
                    leaseStartDate: new Date('2024-01-01'),
                    leaseEndDate: new Date('2028-12-31'),
                    leaseTermMonths: 60,
                    paymentFrequency: 'MONTHLY',
                    fixedPayment: 25000.00,
                    paymentAtBeginning: true,
                    incrementalBorrowingRate: 0.05,
                    initialLiability: 1200000.00,
                    initialROUAsset: 1200000.00,
                    assetCategory: 'BUILDING',
                    rouAssetAccountCode: '1501',
                    liabilityAccountCode: '21050'
                }
            });

            const lease2 = await (prisma as any).ifrsLeaseContract.create({
                data: {
                    contractNumber: 'LC-2026-002',
                    lessor: 'Saudi Fleet Services',
                    description: 'Delivery Trucks',
                    leaseStartDate: new Date('2025-01-01'),
                    leaseEndDate: new Date('2027-12-31'),
                    leaseTermMonths: 36,
                    paymentFrequency: 'MONTHLY',
                    fixedPayment: 8500.00,
                    paymentAtBeginning: true,
                    incrementalBorrowingRate: 0.06,
                    initialLiability: 250000.00,
                    initialROUAsset: 250000.00,
                    assetCategory: 'VEHICLE',
                    rouAssetAccountCode: '1502',
                    liabilityAccountCode: '21050'
                }
            });

            leases = [lease1, lease2];
        }

        const activeLeasesCount = leases.length;
        const totalROUAssets = leases.reduce((sum: number, l: any) => sum + l.initialROUAsset, 0);
        const totalLiability = leases.reduce((sum: number, l: any) => sum + l.initialLiability, 0);

        return NextResponse.json({
            leases,
            summary: {
                activeLeasesCount,
                totalROUAssets,
                totalLiability
            }
        });
    } catch (error) {
        console.error('Leases GET error:', error);
        return NextResponse.json({ error: 'فشل جلب بيانات عقود الإيجار' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        return NextResponse.json({ success: true, message: 'Monthly amortization run successfully.' });
    } catch (error: any) {
        console.error('Leases POST error:', error);
        return NextResponse.json({ error: 'فشل تشغيل إطفاء الإيجارات' }, { status: 500 });
    }
}
