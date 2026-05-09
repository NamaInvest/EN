import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { processMessage } from '@/lib/telegram-bot';

// Internal API endpoint for processing Telegram commands
// Used by the polling script
async function _POST(req: NextRequest) {

    try {
        const { text } = await req.json();
        if (!text) return NextResponse.json({ response: '❌ لا يوجد نص' });

        const response = await processMessage(text);
        return NextResponse.json({ response });
    } catch (error: any) {
        console.error('Telegram process error:', error);
        return NextResponse.json({ response: '❌ خطأ في معالجة الطلب' });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
