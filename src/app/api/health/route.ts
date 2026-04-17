import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // فحص وجود جداول وقاعدة بيانات حقيقية لهذا الدومين
        const setting = await prisma.setting.findFirst();
        if (!setting) {
            return NextResponse.json({ status: 'booting', message: 'DB not seeded yet' }, { status: 503 });
        }
        
        return NextResponse.json(
            { status: 'ok', timestamp: Date.now() },
            { 
                headers: { 
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS'
                } 
            }
        );
    } catch (error) {
        return NextResponse.json({ status: 'error', message: 'DB not ready' }, { status: 503 });
    }
}
