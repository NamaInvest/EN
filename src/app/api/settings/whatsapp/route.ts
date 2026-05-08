import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const user = getUserFromRequest(req as any);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const qrSetting = await prisma.setting.findUnique({ where: { key: 'whatsapp_qr' } });
        const statusSetting = await prisma.setting.findUnique({ where: { key: 'whatsapp_status' } });

        return NextResponse.json({ 
            qr: qrSetting?.value || null, 
            status: statusSetting?.value || 'disconnected' 
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
