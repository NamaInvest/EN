import { NextRequest, NextResponse } from 'next/server';
import { processMessage } from '@/lib/telegram-bot';

// Internal API endpoint for processing Telegram commands
// Used by the polling script
export async function POST(req: NextRequest) {

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
