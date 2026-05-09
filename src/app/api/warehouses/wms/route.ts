import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Priority 6: WMS (Warehouse Management System) API
 *
 * Schema facts:
 * - WarehouseZone: stockId (Int) — linked to Stock, NOT warehouseId
 * - WarehouseRack: zoneId (Int), name (String) — no 'code' field
 * - WarehouseBin: rackId (Int), name (String), barcode (String?), maxWeight (Float) — no 'code'
 * - Product: no 'sku' — use barcode instead
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

async function _GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    // WarehouseZone links to Stock via stockId, not warehouseId
    const stockId = parseInt(url.searchParams.get('stockId') || url.searchParams.get('warehouseId') || '1');

    try {
        const zones = await prisma.warehouseZone.findMany({
            take: 100,
            where: { stockId },   // correct field
            include: {
                racks: { include: { bins: true } },
            },
            orderBy: { id: 'asc' },
        });

        // Stock occupancy per product
        const stocks = await prisma.productStock.findMany({
            take: 100,
            where: { stockId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        barcode: true,       // no 'sku' field
                        currentStock: true,
                        unit: { select: { name: true } },
                    },
                },
            },
        });

        return NextResponse.json({
            stockId,
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
    } catch (e: any) {
        console.error('WMS GET error:', e);
        return NextResponse.json({ error: 'خطأ في تحميل بيانات المستودع' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  action: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { action, ...data } = body;

        if (action === 'create_zone') {
            // WarehouseZone: stockId (Int), name (String), description (String?)
            const zone = await prisma.warehouseZone.create({
                data: {
                    stockId: parseInt(data.stockId),  // correct field
                    name: data.name,
                    description: data.description || null,
                },
            });
            return NextResponse.json(zone, { status: 201 });
        }

        if (action === 'create_rack') {
            // WarehouseRack: zoneId (Int), name (String)
            const rack = await prisma.warehouseRack.create({
                data: {
                    zoneId: parseInt(data.zoneId),
                    name: data.name,      // 'name' not 'code'
                },
            });
            return NextResponse.json(rack, { status: 201 });
        }

        if (action === 'create_bin') {
            // WarehouseBin: rackId (Int), name (String), barcode (String?), maxWeight (Float)
            const bin = await prisma.warehouseBin.create({
                data: {
                    rackId: parseInt(data.rackId),
                    name: data.name,          // 'name' not 'code'
                    barcode: data.barcode || null,
                    maxWeight: data.maxWeight ? parseFloat(data.maxWeight) : 0,
                },
            });
            return NextResponse.json(bin, { status: 201 });
        }

        return NextResponse.json({ error: 'action غير معروف. استخدم: create_zone | create_rack | create_bin' }, { status: 400 });
    } catch (e: any) {
        console.error('WMS POST error:', e);
        return NextResponse.json({ error: 'خطأ في إنشاء عنصر المستودع' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
