import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get('platform') || 'unknown';
        const body = await request.json();
        const orderId = body.order_id || body.orderId || body.id || '';
        console.log(`[Delivery] Order from ${platform}: ${orderId}`);
        return NextResponse.json({ ok: true, platform, orderId });
    } catch (e: any) {
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        platforms: [
            { id: 'jahez', name: 'جاهز', status: 'ready' },
            { id: 'hungerstation', name: 'هنقرستيشن', status: 'ready' },
            { id: 'mrsool', name: 'مرسول', status: 'ready' },
            { id: 'toyou', name: 'تويو', status: 'ready' },
        ],
    });
}
