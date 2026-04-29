export {};
// Telegram Bot Polling Script
// Run: npx ts-node --skip-project src/scripts/telegram-poll.ts

const BOT_TOKEN = '8469277343:AAGCWUh1NNIGrB4IwaUOOu-XFkWn1Sskio0';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const APP_URL = 'http://95.217.187.44';

let offset = 0;

async function sendMessage(chatId: number, text: string) {
    await fetch(`${API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
}

async function processViaApi(text: string): Promise<string> {
    try {
        const res = await fetch(`${APP_URL}/api/telegram/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (res.ok) {
            const data = await res.json();
            return data.response;
        }
        return '❌ خطأ في الاتصال بالنظام';
    } catch (e) {
        console.error('API error:', e);
        return '❌ النظام غير متاح حالياً';
    }
}

async function poll() {
    console.log('🤖 بوت نما سوفت شغال! انتظار الرسائل...');

    // Remove any existing webhook
    await fetch(`${API}/deleteWebhook`);

    while (true) {
        try {
            const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=30`);
            const data = await res.json();

            if (data.ok && data.result.length > 0) {
                for (const update of data.result) {
                    offset = update.update_id + 1;
                    const message = update.message;
                    if (!message) continue;

                    const chatId = message.chat.id;
                    const text = message.text;

                    if (text) {
                        console.log(`📩 ${message.from?.first_name}: ${text}`);
                        const response = await processViaApi(text);
                        await sendMessage(chatId, response);
                        console.log(`📤 رد: ${response.substring(0, 50)}...`);
                    } else if (message.voice) {
                        await sendMessage(chatId, '🎙️ لتفعيل الرسائل الصوتية، أضف مفتاح OpenAI.\n\nحالياً يمكنك إرسال أوامر نصية.\nأرسل /help للمساعدة.');
                    }
                }
            }
        } catch (e) {
            console.error('Poll error:', e);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

poll();
