import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        
        // Fetch all warehouses (Stocks)
        const stocks = await prisma.stock.findMany({
            take: 100,
            where: {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                ]
            },
            include: {
                warehouseZones: {
                    include: {
                        racks: {
                            include: {
                                bins: true,
                                _count: { select: { bins: true } }
                            }
                        },
                        _count: { select: { racks: true } }
                    }
                }
            },
            orderBy: { id: 'asc' },
        });

        // Compute metrics
        const enrichedWMS = stocks.map(stock => {
            let totalZones = stock.warehouseZones.length;
            let totalRacks = 0;
            let totalBins = 0;
            
            stock.warehouseZones.forEach(zone => {
                totalRacks += zone.racks.length;
                zone.racks.forEach(rack => {
                    totalBins += rack.bins.length;
                });
            });

            return {
                ...stock,
                totalZones,
                totalRacks,
                totalBins
            };
        });

        return NextResponse.json(enrichedWMS);
    } catch (error: any) {
        console.error('WMS Fetch Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/wms' });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  description: z.any().optional(),
  stockId: z.union([z.string(), z.number()]).optional(),
  zoneId: z.union([z.string(), z.number()]).optional(),
  barcode: z.any().optional(),
  type: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { type } = data;

        if (type === 'zone') {
            const zone = await prisma.warehouseZone.create({
                data: { name: data.name, description: data.description, stockId: parseInt(data.stockId) }
            });
            return NextResponse.json({ message: 'تم إضافة المنطقة', zone });
        }
        
        if (type === 'rack') {
            const rack = await prisma.warehouseRack.create({
                data: { name: data.name, zoneId: parseInt(data.zoneId) }
            });
            return NextResponse.json({ message: 'تم إضافة الرف', rack });
        }
        
        if (type === 'bin') {
            const bin = await prisma.warehouseBin.create({
                data: { name: data.name, barcode: data.barcode, rackId: parseInt(data.rackId), maxWeight: parseFloat(data.maxWeight) || 0 }
            });
            return NextResponse.json({ message: 'تم إضافة الخانة (Bin)', bin });
        }

        return NextResponse.json({ error: 'Invalid type specificed' }, { status: 400 });
    } catch (error: any) {
        console.error('Create WMS Entity Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/wms' });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
