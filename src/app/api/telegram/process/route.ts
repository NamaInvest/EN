import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { processMessage } from '@/lib/telegram-bot';
import { z } from 'zod';

const POSTSchema = z.object({
  text: z.string().min(1, 'النص مطلوب').max(4096),
});

async function _POST(req: NextRequest) {
    try {
        const rawBody = await req.json();
        const parsed = POSTSchema.safeParse(rawBody);
        if (!parsed.success) {
          return NextResponse.json({ response: '❌ لا يوجد نص' });
        }
        const { text } = parsed.data;
        const response = await processMessage(text);
        return NextResponse.json({ response });
    } catch (error: any) {
        console.error('Telegram process error:', error);
        return NextResponse.json({ response: '❌ خطأ في معالجة الطلب' });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
