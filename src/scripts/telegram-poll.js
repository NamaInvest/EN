#!/usr/bin/env node
// Telegram Bot Polling Script (no SSL required)
// Run with PM2: pm2 start src/scripts/telegram-poll.js --name telegram-bot

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8469277343:AAGCWUh1NNIGrB4IwaUOOu-XFkWn1Sskio0';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const APP_URL = process.env.APP_URL || 'http://127.0.0.1:3000';

let offset = 0;

async function sendMessage(chatId, text) {
    await fetch(`${API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
}

async function processViaApi(text) {
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
    console.log('🤖 بوت نما سوفت شغال (Polling)! انتظار الرسائل...');

    // Remove any existing webhook first
    await fetch(`${API}/deleteWebhook`);
    console.log('✅ Webhook removed, polling active');

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
