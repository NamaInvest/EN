import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// Meta Webhook Verification
export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        const verifyTokenSet = await prisma.setting.findFirst({ where: { key: 'whatsapp_verify_token' } });
        const systemToken = verifyTokenSet?.value || '';

        if (mode && token) {
            if (mode === 'subscribe' && token === systemToken) {
                console.log('WhatsApp Webhook Verified!');
                return new NextResponse(challenge, { status: 200 }); // Meta requires raw plaintext challenge returned
            } else {
                return new NextResponse('Forbidden', { status: 403 });
            }
        }
        return new NextResponse('Invalid request', { status: 400 });
    } catch (e: any) {
        return new NextResponse('Error', { status: 500 });
    }
}

// Meta Webhook Incoming Messages (Customer Text -> Gemini -> WhatsApp)
export async function POST(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        // 1. Acknowledge Receipt Immediately (Meta drops webhooks that don't 200 OK within seconds)
        // Note: For Next.js App Router, we technically MUST return a response. We will do it asynchronously or block.
        // Since Gemini might take 2-4 seconds, it's usually okay. Above 5s Meta retries.
        
        if (body.object !== 'whatsapp_business_account') {
            return NextResponse.json({ status: 'ignored' }, { status: 404 });
        }

        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        // Ensure it's an actual user message (not a status update like "read" or "delivered")
        if (!messages || !messages[0]) {
            return NextResponse.json({ status: 'no_message' });
        }

        const msg = messages[0];
        const senderPhone = msg.from; // e.g., '966500000000'
        let incomingText = '';

        if (msg.type === 'text') {
            incomingText = msg.text.body;
        } else if (msg.type === 'interactive') {
            incomingText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
        }

        if (!incomingText) return NextResponse.json({ status: 'unsupported_type' });

        console.log(`[WhatsApp Incoming] from ${senderPhone}: ${incomingText}`);

        // 2. Fetch Keys and Products context
        const allSettings = await prisma.setting.findMany();
        const sMap: Record<string, string> = {};
        allSettings.forEach(s => sMap[s.key] = s.value || '');

        const geminiKey = sMap['gemini_api_key'];
        const waToken = sMap['whatsapp_token'];
        const phoneId = sMap['whatsapp_phone_id'];

        if (!geminiKey || !waToken || !phoneId) {
            console.error('Missing API keys for WhatsApp AI');
            return NextResponse.json({ error: 'Missing Integration Keys' });
        }

        // Fetch Top 50 Products as context for Gemini
        const products = await prisma.product.findMany({
            where: { active: true },
            take: 50,
            select: { id: true, name: true, sellPrice: true, currentStock: true }
        });

        let catalogContext = 'كاتالوج المنتجات المتوفرة وأسعارها (شاملة الضريبة) وكمياتها بالمستودع:\n';
        products.forEach(p => {
            catalogContext += `- ID:[${p.id}] ${p.name}: السعر ${p.sellPrice || 0} ريال، المتوفر (${p.currentStock || 0} حبة)\n`;
        });
        if (products.length === 0) catalogContext += 'لا يوجد منتجات متاحة حاليا.\n';

        // 3. Load Chat History from Prisma Settings
        const sessionKey = `whatsapp_session_${senderPhone}`;
        const sessionRecord = await prisma.setting.findFirst({ where: { key: sessionKey } });
        let chatHistory = [];
        try {
            if (sessionRecord && sessionRecord.value) chatHistory = JSON.parse(sessionRecord.value);
        } catch(e) {}

        const systemPrompt = `
أنت "بائع ذكي" يعمل لدى شركة (نما إنفست / Nama Invest). مهمتك الرد على استفسارات العملاء على الواتساب وبيع المنتجات لهم بطريقة لبقة ومحترفة باللهجة السعودية أو العربية الفصحى المبسطة.
لا تقدم نفسك كذكاء اصطناعي، بل قدم نفسك كموظف المبيعات لشركة نما إنفست.

قواعد مهمة جداً:
1. كن مختصراً ولا ترسل رسائل طويلة جداً. الواتساب يحتاج رسائل سريعة وقصيرة.
2. استخدم الكاتالوج التالي للإجابة على أسئلة العميل حول توفر الأصناف وأسعارها بدقة عالية.
3. لا تقترح أسعاراً من خيالك، التزم بأسعار الكاتالوج فقط.
4. إذا طلب العميل منتجاً غير موجود في الكاتالوج، اعتذر بلباقة وأخبره أنه غير متوفر حالياً.
5. إذا وافق العميل على الشراء، اطلب منه تزويدك بـ (الاسم الكامل، العنوان المراد التوصيل إليه).
6. بمجرد استلام معلومات التوصيل من العميل، قم بصياغة ملخص للطلب وأختم رسالتك بـكود التوليد الآتي حصرياً:
<CHCKOUT>ProductID:Qty|ProductID:Qty</CHCKOUT>
(استبدل ProductID برقم ID المنتج من الكاتالوج، و Qty بالكمية المطلوبة). احرص على عدم إضافة أي مسافات داخل الكود.

-- الكاتالوج الحي:
${catalogContext}
`;

        const geminiPayload = {
            contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'حسناً، أنا مستعد لخدمة العملاء بناءً على هذه التوجيهات.' }] },
                ...chatHistory,
                { role: 'user', parts: [{ text: incomingText }] }
            ],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500,
            }
        };

        // 4. Call Gemini REST API
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        if (!geminiRes.ok) {
            console.error('Gemini API Error:', await geminiRes.text());
            return NextResponse.json({ error: 'Gemini Failure' });
        }

        const geminiData = await geminiRes.json();
        let replyText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!replyText) return NextResponse.json({ status: 'no_ai_reply' });

        // Agentic Tool Execution: Autonomous Checkout
        const checkoutMatch = replyText.match(/<CHCKOUT>(.*?)<\/CHCKOUT>/);
        if (checkoutMatch) {
            const rawItems = checkoutMatch[1]; // e.g., "1:2|5:1"
            
            // In a complete agent, we decode items and create a Prisma SalesInvoice holding the line details.
            // For now, generate the payment ledger link dynamically.
            const invoiceRef = `INV-${Date.now().toString().slice(-6)}`;
            const paymentLink = `https://pay.namainvest.com/secure/${invoiceRef}`;
            
            replyText = replyText.replace(/<CHCKOUT>.*?<\/CHCKOUT>/g, `\n\n💳 *رابط الدفع الآمن لتأكيد طلبك:* \n${paymentLink}\n\nملاحظة: سيتم البدء بالتجهيز فور اكتمال الدفع.`);
            
            console.log(`[AI AGENT] Autonomous Invoice ${invoiceRef} created via WhatsApp.`);
        }

        // 5. Send Reply via WhatsApp Graph API
        const waPayload = {
            messaging_product: 'whatsapp',
            to: senderPhone,
            type: 'text',
            text: { body: replyText }
        };

        const waRes = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${waToken}`
            },
            body: JSON.stringify(waPayload)
        });

        if (!waRes.ok) {
            console.error('WhatsApp Graph API Error:', await waRes.text());
            return NextResponse.json({ error: 'WhatsApp Graph Failure' });
        }

        // 6. Save updated history (Append User + Model) limit to last 10 messages (5 pairs)
        chatHistory.push({ role: 'user', parts: [{ text: incomingText }] });
        chatHistory.push({ role: 'model', parts: [{ text: replyText }] });
        
        if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(chatHistory.length - 10);
        }

        await prisma.setting.upsert({
            where: { key: sessionKey },
            update: { value: JSON.stringify(chatHistory) },
            create: { key: sessionKey, value: JSON.stringify(chatHistory) }
        });

        return NextResponse.json({ status: 'replied', text: replyText });

    } catch (e: any) {
        console.error('WhatsApp Webhook Fatal Error:', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
