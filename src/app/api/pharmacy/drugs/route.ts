/**
 * Pharmacy Drugs API — إدارة الأدوية
 * GET  /api/pharmacy/drugs — قائمة الأدوية
 * POST /api/pharmacy/drugs — إضافة دواء جديد (مع Product)
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const search = url.searchParams.get('q') || '';
    const drugClass = url.searchParams.get('class') || '';
    const lowStock = url.searchParams.get('lowStock') === 'true';
    const expiringSoon = url.searchParams.get('expiringSoon') === 'true';

    try {
        const where: any = { active: true };
        if (drugClass) where.drugClass = drugClass;
        if (search) {
            where.OR = [
                { genericName: { contains: search, mode: 'insensitive' } },
                { sfdaNumber: { contains: search } },
                { product: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        // @ts-ignore — new pharmacy model; restart TS server to clear IDE cache
        const drugs = await prisma.pharmacyDrug.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true, name: true, nameEn: true, barcode: true,
                        currentStock: true, minQuantity: true, sellPrice: true,
                        buyPrice: true, expiryDate: true, batches: {
                            select: { batchNumber: true, expiryDate: true, quantity: true },
                            orderBy: { expiryDate: 'asc' },
                        },
                    },
                },
            },
            orderBy: { genericName: 'asc' },
        });

        let result = drugs;

        // Filter by low stock
        if (lowStock) {
            result = result.filter((d: any) => d.product.currentStock <= d.product.minQuantity);
        }

        // Filter expiring within 30 days
        if (expiringSoon) {
            const in30 = new Date();
            in30.setDate(in30.getDate() + 30);
            result = result.filter((d: any) =>
                d.product.batches.some((b: any) => b.expiryDate && new Date(b.expiryDate) <= in30)
            );
        }

        return NextResponse.json({ total: result.length, drugs: result });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'خطأ في تحميل الأدوية' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();

        // 1. Create Product first
        // @ts-ignore — new pharmacy model; restart TS server to clear IDE cache
        const product = await prisma.product.create({
            data: {
                name: body.name,
                nameEn: body.nameEn || '',
                barcode: body.barcode || null,
                buyPrice: parseFloat(body.buyPrice) || 0,
                sellPrice: parseFloat(body.sellPrice) || parseFloat(body.mohMaxPrice) || 0,
                minQuantity: parseFloat(body.minQuantity) || 5,
                taxRate: 0, // أدوية معفاة من الضريبة في السعودية
                categoryId: body.categoryId ? parseInt(body.categoryId) : null,
                unitId: body.unitId ? parseInt(body.unitId) : 1,
            },
        });

        // 2. Create PharmacyDrug linked to product
        // @ts-ignore — new pharmacy model; restart TS server to clear IDE cache
        const drug = await prisma.pharmacyDrug.create({
            data: {
                productId: product.id,
                sfdaNumber: body.sfdaNumber,
                genericName: body.genericName,
                genericNameEn: body.genericNameEn || '',
                drugClass: body.drugClass || 'OTC',
                manufacturer: body.manufacturer || null,
                countryOfOrigin: body.countryOfOrigin || null,
                storageTemp: body.storageTemp || 'room',
                mohMaxPrice: parseFloat(body.mohMaxPrice) || 0,
                requiresRx: body.requiresRx || false,
                isControlled: body.isControlled || false,
            },
            include: { product: true },
        });

        return NextResponse.json(drug, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'خطأ في إضافة الدواء' }, { status: 500 });
    }
}
