import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 });
        }

        // Prioritize GEMINI_API_KEY from Database settings, fallback to ENV
        const setting = await prisma.setting.findUnique({ where: { key: 'gemini_api_key' } });
        let apiKey = setting?.value || process.env.GEMINI_API_KEY || '';
        if (apiKey) apiKey = apiKey.replace(/[\"\'\\]/g, '').trim();

        if (!apiKey) {
            return NextResponse.json({ error: 'مفتاح Gemini API غير متوفر. الرجاء إضافته في الإعدادات.' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');
        const mimeType = file.type || 'image/jpeg';

        // Prompt Gemini to extract structured invoice data
        const promptText = `
أنت خبير في قراءة الفواتير الضريبية السعودية باللغتين العربية والإنجليزية.
استخرج البيانات التالية من الفاتورة بدقة عالية جداً وأرجع النتيجة بصيغة JSON فقط (بدون أي نصوص إضافية أو علامات Markdown مثل \`\`\`json):
{
  "supplierName": "اسم المورد او الشركة",
  "taxNumber": "الرقم الضريبي المكون من 15 رقم عادة",
  "invoiceNo": "رقم الفاتورة",
  "date": "تاريخ الفاتورة بصيغة YYYY-MM-DD",
  "subtotal": 0.00,
  "taxAmount": 0.00,
  "grandTotal": 0.00,
  "items": [
    { "name": "اسم المنتج المنظف بدون ارقام او رموز غريبة", "quantity": 1, "price": 0.00, "total": 0.00 }
  ]
}
إذا تعذر إيجاد أي حقل أو كان فارغاً اجعله null للمحتوى النصي و 0 للأرقام. استخدم السعر قبل الضريبة للـ price إذا أمكن.
`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent([
            promptText,
            { inlineData: { data: base64Image, mimeType: mimeType } }
        ]);

        const extractedText = result.response.text();
        
        let parsedData;
        try {
            parsedData = JSON.parse(extractedText.replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) {
            console.error('Failed to parse Gemini JSON:', extractedText);
            return NextResponse.json({ error: 'عذراً، فشل في فهم نتيجة الذكاء الاصطناعي' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: parsedData,
            message: parsedData.items?.length > 0 
                ? `تم استخراج بيانات الفاتورة بنجاح`
                : 'تم استخراج بيانات الفاتورة لكن لم يتم التعرف على الأصناف بوضوح',
        });
    } catch (error: any) {
        const errMsg = error?.message || String(error);
        console.error('OCR Error:', errMsg);
        
        let msg = 'فشل في قراءة الفاتورة';

        if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
            msg = '❌ مفتاح Gemini غير صحيح. تحقق من المفتاح في الإعدادات.';
        } else if (
            errMsg.includes('PERMISSION_DENIED') ||
            errMsg.includes('has not been used') ||
            errMsg.includes('is not enabled') ||
            errMsg.includes('disabled')
        ) {
            msg = '🔒 Generative Language API غير مفعّل في Google Cloud.\nالحل: افتح console.cloud.google.com ← APIs & Services ← Enable APIs ← Generative Language API\nأو استخدم مفتاحاً من aistudio.google.com مباشرة.';
        } else if (errMsg.includes('no longer available') || errMsg.includes('404')) {
            msg = '⚠️ النموذج المستخدم غير متاح. تواصل مع الدعم.';
        } else if (errMsg.includes('quota') || errMsg.includes('exhausted') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            msg = '⚠️ وصلت للحد الأقصى المجاني من Google. انتظر دقيقة وأعد المحاولة.';
        }
        
        return NextResponse.json({ error: msg, debug: errMsg.slice(0, 300) }, { status: 500 });
    }
}
