import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        
        // Fetch all warehouses (Stocks)
        const stocks = await prisma.stock.findMany({
            where: {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } }
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
