import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { PrismaClient } from '@prisma/client';
// Removed heavy Google SDK dependency to rely on native fetch

// Using a dedicated Prisma instance for the worker to avoid clashes if running separately
const prisma = new PrismaClient();

async function getGeminiKey() {
    const setting = await prisma.setting.findUnique({ where: { key: 'gemini_api_key' } });
    return setting?.value;
}

async function updateSetting(key: string, value: string) {
    await prisma.setting.upsert({
        where: { key: key },
        update: { value: value },
        create: { key: key, value: value, description: `Auto-generated ${key}` }
    });
}

// Ensure settings exist for QR and Status
async function initSettings() {
    await updateSetting('whatsapp_status', 'disconnected');
    await updateSetting('whatsapp_qr', '');
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'nama-invest' }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    console.log('QR Code Received. Scan it to authenticate!');
    qrcode.generate(qr, { small: true });
    
    // Save QR to database so the Settings UI can fetch and display it!
    await updateSetting('whatsapp_qr', qr);
    await updateSetting('whatsapp_status', 'scanning');
});

client.on('ready', async () => {
    console.log('WhatsApp Client is ready!');
    await updateSetting('whatsapp_status', 'connected');
    await updateSetting('whatsapp_qr', ''); // Clear QR once connected
});

client.on('disconnected', async (reason) => {
    console.log('WhatsApp Client was disconnected', reason);
    await updateSetting('whatsapp_status', 'disconnected');
});

client.on('message', async (msg: Message) => {
    // Only respond to text messages for now
    if (msg.type !== 'chat') return;
    
    const phoneNumber = msg.from.replace('@c.us', '');
    console.log(`Received message from ${phoneNumber}: ${msg.body}`);

    try {
        // Find customer by phone
        const customer = await prisma.customer.findFirst({
            where: {
                phone: {
                    contains: phoneNumber
                }
            }
        });

        const geminiKey = await getGeminiKey();
        if (!geminiKey) return;

        let customerContext = "العميل غير مسجل في النظام لدينا.";
        if (customer) {
            // Get customer balance safely avoiding type errors
            const c: any = customer;
            customerContext = `إسم العميل: ${c.name}. رقم العميل: ${c.id}. رصيده الحالي في النظام: ${c.balance || '0'} ريال.`;
        }

        const promptText = `
أنت المساعد الذكي الآلي لشركة تجارية تعمل بنظام نما إنفست.
يتواصل معك العميل الآن عبر الواتساب.
معلومات العميل المستخرجة من قاعدة بياناتنا:
${customerContext}

رسالة العميل هي:
"${msg.body}"

مهمتك:
1. الرد على العميل بلباقة واحترافية وبلهجة سعودية/عربية واضحة.
2. إذا سأل العميل عن ديونه أو حسابه، أخبره بالرصيد الحالي المذكور في المعلومات السابقة.
3. إذا لم يكن مسجلاً، اطلب منه تزويدك باسمه الكامل أو مراجعة الفرع.
4. الرد يجب أن يكون رسالة نصية قصيرة ومباشرة ترسل للواتساب مباشرة. لا تكتب أي مقدمات أو شروحات إضافية.
`;

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.replace(/[\"\'\\]/g, '').trim()}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.1 }
            })
        });

        if (!aiRes.ok) {
            console.error('Failed to communicate with Gemini API');
            return;
        }

        const geminiData = await aiRes.json();
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، لا يمكنني الرد الآن.';

        // Reply to the user on WhatsApp
        await msg.reply(responseText);
        console.log(`Replied to ${phoneNumber} successfully.`);

    } catch (error) {
        console.error('Error processing WhatsApp message:', error);
    }
});

// Start the client
console.log('Starting WhatsApp Web Daemon...');
initSettings().then(() => {
    client.initialize();
});
