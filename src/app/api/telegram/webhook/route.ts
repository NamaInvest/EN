import { NextRequest, NextResponse } from 'next/server';
import { processMessage, sendMessage, getBotToken } from '@/lib/telegram-bot';

// Telegram sends updates via POST
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const message = body?.message;

        if (!message) return NextResponse.json({ ok: true });

        const chatId = message.chat?.id;
        if (!chatId) return NextResponse.json({ ok: true });

        let text = '';

        // Handle text messages
        if (message.text) {
            text = message.text;
        }

        // Handle voice messages (convert to text using Telegram's file API + OpenAI Whisper)
        if (message.voice || message.audio) {
            const fileId = message.voice?.file_id || message.audio?.file_id;
            const openaiKey = process.env.OPENAI_API_KEY;

            if (fileId && openaiKey) {
                try {
                    const BOT_TOKEN = await getBotToken();
                    const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
                    const fileData = await fileRes.json();
                    const filePath = fileData.result?.file_path;

                    if (filePath) {
                        const audioRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`);
                        const audioBuffer = await audioRes.arrayBuffer();

                        const formData = new FormData();
                        formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'voice.ogg');
                        formData.append('model', 'whisper-1');
                        formData.append('language', 'ar');

                        const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${openaiKey}` },
                            body: formData,
                        });

                        if (whisperRes.ok) {
                            const whisperData = await whisperRes.json();
                            text = whisperData.text || '';
                            await sendMessage(chatId, `🎙️ <i>${text}</i>`);
                        }
                    }
                } catch (e) {
                    console.error('Voice transcription error:', e);
                    await sendMessage(chatId, '❌ فشل تحويل الرسالة الصوتية.');
                    return NextResponse.json({ ok: true });
                }
            } else if (fileId && !openaiKey) {
                await sendMessage(chatId, '🎙️ لتفعيل الرسائل الصوتية، أضف مفتاح OpenAI.\n\nحالياً يمكنك إرسال أوامر نصية.');
                return NextResponse.json({ ok: true });
            }
        }

        if (text) {
            const response = await processMessage(text);
            await sendMessage(chatId, response);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return NextResponse.json({ ok: true });
    }
}

// GET endpoint to set webhook + health check
export async function GET(req: NextRequest) {
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
