import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const user = getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Retrieve all AI WhatsApp sessions stored in the generic Settings table
        const sessionRecords = await prisma.setting.findMany({
            where: { key: { startsWith: 'whatsapp_session_' } },
            orderBy: { id: 'desc' }
        });

        const activeChats = sessionRecords.map(r => {
            const phone = r.key.replace('whatsapp_session_', '');
            let history = [];
            try {
                if (r.value) history = JSON.parse(r.value);
            } catch (e) {}
            return { phone, history, updatedAt: r.id }; // Using ID loosely as chron metric
        });

        return NextResponse.json(activeChats);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
