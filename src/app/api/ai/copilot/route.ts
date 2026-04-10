import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { message } = await req.json();

        // Fetch Gemini API Key
        const setting = await prisma.setting.findFirst({ where: { key: 'gemini_api_key' } });
        const geminiKey = setting?.value;

        if (!geminiKey) {
            return NextResponse.json({ error: 'Gemini Key not configured' }, { status: 500 });
        }

        const systemPrompt = `
أنت "الوكيل المساعد (AI Copilot)" لمدير نظام (نما إنفست ERP).
مهمتك مساعدة التاجر في التنقل داخل النظام أو الإجابة على استفساراته. 
إذا سألك عن كيفية القيام بشيء يملك شاشة مخصصة له، قم بتوجيهه فوراً لتلك الشاشة باستخدام كود (Action).
- الشاشات المتاحة للتوجه: /pos, /products, /sales, /purchases, /barcode, /reports, /settings.
- إذا كان السؤال عاماً، أجب باختصار باحترافية.
تنسيق الرد الخاص بك يجب أن يكون حصرياً JSON بالشكل التالي:
{
  "answer": "النص الذي سيظهر للمستخدم يقرأه أو يسمعه",
  "action": "NAVIGATE",
  "route": "/route-name"
}
إذا لم يكن هناك شاشة، اجعل الـ action null. `;

        const geminiPayload = {
            contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'مفهوم، سأقوم بإرجاع JSON فقط كما طلبت.' }] },
                { role: 'user', parts: [{ text: message }] }
            ],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
            }
        };

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        if (!geminiRes.ok) {
            const errorText = await geminiRes.text();
            throw new Error(`AI Engine failed: ${geminiRes.status} ${errorText}`);
        }

        const geminiData = await geminiRes.json();
        const rawReply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        let parsed = { answer: 'لم أفهم طلبك جيداً، جرب صياغة أخرى.', action: null, route: null };
        try {
            parsed = JSON.parse(rawReply);
        } catch(e) {}

        return NextResponse.json(parsed);

    } catch (e: any) {
        console.error('AI Error:', e);
        return NextResponse.json({ error: e.message || 'خطأ داخلي في الخادم الذكي' }, { status: 500 });
    }
}
