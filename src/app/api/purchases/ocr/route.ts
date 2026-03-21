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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
        console.error('OCR Error:', error.message || error);
        
        let msg = 'فشل في قراءة الملف';
        if (error?.message?.includes('not found') || error?.message?.includes('API version')) {
            msg = 'المفتاح محظور من جوجل (Generative Language API غير مفعل).';
        } else if (error?.message?.includes('API key not valid')) {
            msg = 'المفتاح غير صحيح أو تم حذفه.';
        } else if (error?.message?.includes('Too Many Requests') || error?.message?.includes('exhausted') || error?.message?.includes('quota')) {
            msg = '⚠️ عذراً، وصلت للحد الأقصى المسموح من جوجل (مؤقتاً). يرجى الانتظار لمدة دقيقة والمحاولة مرة أخرى.';
        }
        
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
