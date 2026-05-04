import { NextRequest, NextResponse } from 'next/server';
import { ThreeWayMatchEngine } from '@/lib/three-way-match';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        await ThreeWayMatchEngine.resolveHold(parseInt(params.id, 10), body.action, body.userId, body.notes);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
