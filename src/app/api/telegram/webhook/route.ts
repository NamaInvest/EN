import { NextRequest, NextResponse } from 'next/server';
import { processMessage, sendMessage, getBotToken, processPhoto, processVoice } from '@/lib/telegram-bot';
import { getPrisma } from '@/lib/prisma';

// Telegram sends updates via POST
export async function POST(req: NextRequest) {

    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        const message = body?.message;

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
export async function GET(req: NextRequest) {

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
