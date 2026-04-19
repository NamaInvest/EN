import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const tenant = request.headers.get('x-tenant');
        
        if (tenant) {
            // SaaS mode: read from tenant-specific database
            const { Pool } = require('pg');
            const pool = new Pool({
                connectionString: `postgresql://n11_db:n11_pass123@localhost:5432/${tenant}_db`,
                max: 2,
            });
            try {
                // Try both table names: "Setting" (ICE creates) and settings (Prisma creates)
                let value = null;
                try {
                    const r = await pool.query(`SELECT value FROM "Setting" WHERE key = 'hidden_modules' LIMIT 1`);
                    value = r.rows[0]?.value;
                } catch {
                    // Fallback to lowercase settings
                    try {
                        const r2 = await pool.query(`SELECT value FROM settings WHERE key = 'hidden_modules' LIMIT 1`);
                        value = r2.rows[0]?.value;
                    } catch {}
                }
                
                let hiddenModules: string[] = [];
                if (value) {
                    try { hiddenModules = JSON.parse(value); } catch {}
                }
                return NextResponse.json({ hiddenModules });
            } finally {
                await pool.end();
            }
        } else {
            // Non-tenant (main site): use Prisma default
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            try {
                const setting = await prisma.setting.findUnique({ where: { key: 'hidden_modules' } });
                let hiddenModules: string[] = [];
                if (setting?.value) {
                    try { hiddenModules = JSON.parse(setting.value); } catch {}
                }
                return NextResponse.json({ hiddenModules });
            } finally {
                await prisma.$disconnect();
            }
        }
    } catch {
        return NextResponse.json({ hiddenModules: [] });
    }
}
