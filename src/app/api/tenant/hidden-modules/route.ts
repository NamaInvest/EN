import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const setting = await prisma.setting.findUnique({ where: { key: 'hidden_modules' } });
        let hiddenModules: string[] = [];
        if (setting?.value) {
            try { hiddenModules = JSON.parse(setting.value); } catch {}
        }
        return NextResponse.json({ hiddenModules });
    } catch {
        return NextResponse.json({ hiddenModules: [] });
    } finally {
        await prisma.$disconnect();
    }
}
