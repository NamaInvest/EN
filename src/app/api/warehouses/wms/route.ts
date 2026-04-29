/**
 * Priority 6: WMS (Warehouse Management System) API
 * يُعيد بنية المستودع: Zones → Racks → Bins مع محتواها
 * GET  /api/warehouses/wms?warehouseId=1
 * POST /api/warehouses/wms — تعيين منتج لـ Bin
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const warehouseId = parseInt(url.searchParams.get('warehouseId') || '1');

    try {
        // Fetch all zones with their racks and bins
        const zones = await prisma.warehouseZone.findMany({
            where: { warehouseId },
            include: {
                racks: {
                    include: {
                        bins: {
                            include: {
                                // ProductStock entries assigned to this bin (if relation exists)
                            },
                        },
                    },
                },
            },
            orderBy: { id: 'asc' },
        });

        // Fetch stock in this warehouse for occupancy data
        const stocks = await prisma.productStock.findMany({
            where: { stockId: warehouseId },
            include: {
                product: {
                    select: { id: true, name: true, sku: true, currentStock: true, unit: { select: { name: true } } },
                },
            },
        });

        return NextResponse.json({
            warehouseId,
            zones,
            stocks,
            summary: {
                totalZones: zones.length,
                totalRacks: zones.reduce((s: number, z: any) => s + (z.racks?.length || 0), 0),
                totalBins: zones.reduce((s: number, z: any) =>
                    s + (z.racks?.reduce((rs: number, r: any) => rs + (r.bins?.length || 0), 0) || 0), 0),
                totalProducts: stocks.length,
            },
        });
    } catch (e) {
        console.error('WMS GET error:', e);
        return NextResponse.json({ error: 'خطأ في تحميل بيانات المستودع' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();
        const { action, ...data } = body;

        if (action === 'create_zone') {
            const zone = await prisma.warehouseZone.create({
                data: {
                    warehouseId: parseInt(data.warehouseId),
                    name: data.name,
                    type: data.type || 'storage',
                },
            });
            return NextResponse.json(zone, { status: 201 });
        }

        if (action === 'create_rack') {
            const rack = await prisma.warehouseRack.create({
                data: {
                    zoneId: parseInt(data.zoneId),
                    code: data.code,
                    capacity: data.capacity ? parseInt(data.capacity) : null,
                },
            });
            return NextResponse.json(rack, { status: 201 });
        }

        if (action === 'create_bin') {
            const bin = await prisma.warehouseBin.create({
                data: {
                    rackId: parseInt(data.rackId),
                    code: data.code,
                    capacity: data.capacity ? parseFloat(data.capacity) : null,
                },
            });
            return NextResponse.json(bin, { status: 201 });
        }

        return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
    } catch (e) {
        console.error('WMS POST error:', e);
        return NextResponse.json({ error: 'خطأ في إنشاء عنصر المستودع' }, { status: 500 });
    }
}
