import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
        const prisma = getPrisma(req);

        // Check if restaurant tables exist in DB
        let zones: any[] = [];
        try {
            zones = await prisma.restaurantZone.findMany({
                include: { tables: { include: { sessions: { where: { status: 'Active' } } } } }
            });
        } catch (e: any) {
            // If tables don't exist, create them via raw SQL
            if (e.message?.includes('does not exist') || e.code === 'P2021') {
                await prisma.$executeRawUnsafe(`
                    CREATE TABLE IF NOT EXISTS "RestaurantZone" (
                        "id" SERIAL PRIMARY KEY,
                        "name" TEXT NOT NULL,
                        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE TABLE IF NOT EXISTS "RestaurantTable" (
                        "id" SERIAL PRIMARY KEY,
                        "name" TEXT NOT NULL,
                        "capacity" INTEGER NOT NULL DEFAULT 4,
                        "status" TEXT NOT NULL DEFAULT 'Available',
                        "zoneId" INTEGER NOT NULL REFERENCES "RestaurantZone"("id"),
                        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE TABLE IF NOT EXISTS "RestaurantSession" (
                        "id" SERIAL PRIMARY KEY,
                        "tableId" INTEGER NOT NULL REFERENCES "RestaurantTable"("id"),
                        "status" TEXT NOT NULL DEFAULT 'Active',
                        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        "endedAt" TIMESTAMP(3)
                    );
                `);
                zones = [];
            } else {
                throw e;
            }
        }
        return NextResponse.json({ success: true, zones });
    } catch (e: any) {
        console.error('Floor GET error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
        const prisma = getPrisma(req);
        const { action, payload } = await req.json();
        
        // Auto-create tables if they don't exist
        try {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "RestaurantZone" (
                    "id" SERIAL PRIMARY KEY,
                    "name" TEXT NOT NULL,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS "RestaurantTable" (
                    "id" SERIAL PRIMARY KEY,
                    "name" TEXT NOT NULL,
                    "capacity" INTEGER NOT NULL DEFAULT 4,
                    "status" TEXT NOT NULL DEFAULT 'Available',
                    "zoneId" INTEGER NOT NULL REFERENCES "RestaurantZone"("id"),
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS "RestaurantSession" (
                    "id" SERIAL PRIMARY KEY,
                    "tableId" INTEGER NOT NULL REFERENCES "RestaurantTable"("id"),
                    "status" TEXT NOT NULL DEFAULT 'Active',
                    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "endedAt" TIMESTAMP(3)
                );
            `);
        } catch (e) { /* tables already exist */ }

        if (action === 'create_zone') {
            const zone = await prisma.restaurantZone.create({ data: { name: payload.name } });
            return NextResponse.json({ success: true, zone });
        }
        
        if (action === 'create_table') {
            const table = await prisma.restaurantTable.create({
                data: { name: payload.name, capacity: payload.capacity, zoneId: payload.zoneId }
            });
            return NextResponse.json({ success: true, table });
        }
        
        if (action === 'update_table_status') {
            const table = await prisma.restaurantTable.update({
                where: { id: payload.tableId },
                data: { status: payload.status }
            });
            return NextResponse.json({ success: true, table });
        }

        if (action === 'open_session') {
            await prisma.restaurantTable.update({
                where: { id: payload.tableId },
                data: { status: 'Occupied' }
            });
            const session = await prisma.restaurantSession.create({
                data: { tableId: payload.tableId, status: 'Active' }
            });
            return NextResponse.json({ success: true, session });
        }

        if (action === 'close_session') {
            await prisma.restaurantTable.update({
                where: { id: payload.tableId },
                data: { status: 'Available' }
            });
            // End all active sessions for this table
            await prisma.$executeRawUnsafe(
                `UPDATE "RestaurantSession" SET "status" = 'Closed', "endedAt" = NOW() WHERE "tableId" = ${payload.tableId} AND "status" = 'Active'`
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'delete_zone') {
            // Delete all tables and sessions in this zone first
            const tables = await prisma.restaurantTable.findMany({ where: { zoneId: payload.zoneId } });
            for (const table of tables) {
                await prisma.$executeRawUnsafe(`DELETE FROM "RestaurantSession" WHERE "tableId" = ${table.id}`);
            }
            await prisma.restaurantTable.deleteMany({ where: { zoneId: payload.zoneId } });
            await prisma.restaurantZone.delete({ where: { id: payload.zoneId } });
            return NextResponse.json({ success: true });
        }

        if (action === 'delete_table') {
            await prisma.$executeRawUnsafe(`DELETE FROM "RestaurantSession" WHERE "tableId" = ${payload.tableId}`);
            await prisma.restaurantTable.delete({ where: { id: payload.tableId } });
            return NextResponse.json({ success: true });
        }
        
        return NextResponse.json({ success: false, error: 'Invalid action' });
    } catch (e: any) {
        console.error('Floor POST error:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
