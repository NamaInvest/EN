import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { processMessage, sendMessage, getBotToken, processPhoto, processVoice } from '@/lib/telegram-bot';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

// Telegram Update schema (lenient — Telegram adds fields regularly)
const TelegramUpdateSchema = z.object({
  update_id: z.number().optional(),
  message:   z.object({
    chat:  z.object({ id: z.number() }),
    text:  z.string().max(4096).optional(),
    voice: z.object({ file_id: z.string() }).optional(),
    audio: z.object({ file_id: z.string() }).optional(),
    photo: z.array(z.object({ file_id: z.string(), width: z.number(), height: z.number() })).optional(),
  }).optional(),
}).passthrough(); // allow extra Telegram fields

const GETQuerySchema = z.object({
  action: z.enum(['set', 'info', 'remove']).optional(),
});

async function _POST(req: NextRequest) {

    const prisma = getPrisma(req);
    try {
        const rawBody = await req.json();
        const parsed = TelegramUpdateSchema.safeParse(rawBody);
        if (!parsed.success) return NextResponse.json({ ok: true }); // never reject Telegram

        const message = parsed.data.message;
        if (!message) return NextResponse.json({ ok: true });

        const chatId = message.chat?.id;
        if (!chatId) return NextResponse.json({ ok: true });

        // Auto-save the master chat ID for the cron auditor
        try {
            const chatIdStr = String(chatId);
            const existing = await prisma.setting.findUnique({ where: { key: 'master_telegram_chat_id' } });
            if (!existing || existing.value !== chatIdStr) {
                await prisma.setting.upsert({
                    where: { key: 'master_telegram_chat_id' },
                    update: { value: chatIdStr },
                    create: { key: 'master_telegram_chat_id', value: chatIdStr }
                });
            }
        } catch(e) {}

        let text = '';

        // Handle text messages
        if (message.text) {
            text = message.text;
        }

        // Handle voice messages (process via Gemini in the background)
        if (message.voice || message.audio) {
            const fileId = message.voice?.file_id || message.audio?.file_id;
            if (fileId) {
                processVoice(fileId, chatId).catch((e: any) => console.error('Background Voice Failed:', e));
            }
            return NextResponse.json({ ok: true });
        }

        if (text) {
            const response = await processMessage(text);
            await sendMessage(chatId, response);
        }

        // Handle Photos
        if (message.photo && message.photo.length > 0) {
            // Telegram sends an array of photo sizes. The last item is the largest/highest quality.
            const largestPhoto = message.photo[message.photo.length - 1];
            const fileId = largestPhoto.file_id;
            // Process OCR in the background so we don't return an error to Telegram
            processPhoto(fileId, chatId).catch((e: any) => console.error('Background OCR Failed:', e));
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Telegram webhook error:', error);
        return NextResponse.json({ ok: true });
    }
}

// GET endpoint to set webhook + health check
async function _GET(req: NextRequest) {

    const prisma = getPrisma(req);
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'set') {
        const BOT_TOKEN = await getBotToken();
        const host = req.headers.get('host') || '204.168.144.74';
        const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
        const webhookUrl = `${protocol}://${host}/api/telegram/webhook`;
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${webhookUrl}`);
        const data = await res.json();
        return NextResponse.json({ webhookUrl, telegram: data });
    }

    if (action === 'info') {
        const BOT_TOKEN = await getBotToken();
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
        const data = await res.json();
        return NextResponse.json(data);
    }

    if (action === 'remove') {
        const BOT_TOKEN = await getBotToken();
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
        const data = await res.json();
        return NextResponse.json(data);
    }

    return NextResponse.json({ status: 'ok', bot: 'Nama Invest Telegram Bot' });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
