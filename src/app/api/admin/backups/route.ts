import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { BackupEngine } from '@/lib/backup-engine';

export async function GET(req: NextRequest) {
    const auth = getUserFromRequest(req);
    const prisma = getPrisma(req);
    if (!auth || !(await hasPermission(auth.userId, 'manage_system', prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const backups = await prisma.backupRecord.findMany({
        orderBy: { startedAt: 'desc' },
        take: 50
    });

    // Convert BigInt to string for JSON serialization
    const serialized = backups.map((b: any) => ({
        ...b,
        sizeBytes: b.sizeBytes?.toString()
    }));

    return NextResponse.json(serialized);
}

export async function POST(req: NextRequest) {
    const auth = getUserFromRequest(req);
    const prisma = getPrisma(req);
    if (!auth || !(await hasPermission(auth.userId, 'manage_system', prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { type } = await req.json().catch(() => ({ type: 'FULL' }));

    const result = await BackupEngine.performBackup(type);

    if (result.success) {
        return NextResponse.json(result);
    } else {
        return NextResponse.json(result, { status: 500 });
    }
}
