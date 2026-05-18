import { NextRequest, NextResponse } from 'next/server';
import { FsNotesEngine } from '@/lib/fs-notes-engine';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);

    const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
    await FsNotesEngine.generateAllNotes(tenant, period);
    return NextResponse.json({ success: true, period });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
