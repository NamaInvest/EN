import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const TRACKING_FILE = '/tmp/namainvist_provisioned.json';

async function loadTracking(): Promise<Record<string, string>> {
    try {
        const raw = await readFile(TRACKING_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ provisioned: false }, { status: 400 });
    }

    const tracking = await loadTracking();
    const subdomain = tracking[userId];

    if (subdomain) {
        return NextResponse.json({ provisioned: true, subdomain });
    }
    return NextResponse.json({ provisioned: false });
}

export async function POST(req: Request) {
    try {
        const { userId, subdomain } = await req.json();
        if (!userId || !subdomain) {
            return NextResponse.json({ success: false }, { status: 400 });
        }
        const tracking = await loadTracking();
        tracking[userId] = subdomain;
        await writeFile(TRACKING_FILE, JSON.stringify(tracking, null, 2), 'utf-8');
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
