import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
    let tempPath = '';
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 });
        }

        // Prioritize GEMINI_API_KEY from Database settings, fallback to ENV
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
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

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: promptText },
                        { inline_data: { mime_type: mimeType, data: base64Image } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    response_mime_type: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('Gemini API Error:', errBody);
            return NextResponse.json({ error: 'خطأ في معالجة الفاتورة مع الذكاء الاصطناعي' }, { status: 500 });
        }

        const geminiData = await response.json();
        const extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
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
    } catch (error) {
        console.error('OCR Error:', error);
        return NextResponse.json({ error: 'فشل في قراءة الملف' }, { status: 500 });
    }
}
