import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';

async function _POST(req: Request) {

    try {
        const formData = await req.formData();
        const file = formData.get('receipt') as Blob;
        
        if (!file) {
            return NextResponse.json({ error: 'No receipt uploaded' }, { status: 400 });
        }

        // MOCK AI BANK FRAUD API (OCR & Fraud Detection)
        // In reality, this would send the image to an AI model that runs OCR, checks font consistency,
        // metadata (EXIF), and matches payment amounts/dates with bank API.

        await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate AI processing

        // Randomly simulate a fraud detection result based on file size or just randomize for demo
        const isFraud = Math.random() > 0.5;

        const mockExtractedData = {
            bankName: 'بنك الراجحي',
            amount: isFraud ? '15,000.00' : '5,000.00',
            date: new Date().toISOString().split('T')[0],
            referenceNumber: 'REF-' + Math.floor(Math.random() * 1000000000),
            accountName: 'مؤسسة نما المتقدمة'
        };

        const analysisFlags = isFraud ? [
            { type: 'DANGER', message: 'تم رصد اختلاف في نوع الخط (Font Inconsistency) في منطقة المبلغ.' },
            { type: 'WARNING', message: 'رقم الحوالة المرجعي غير متطابق مع تسلسل البنك المعتاد.' }
        ] : [
            { type: 'SUCCESS', message: 'خطوط الإيصال متطابقة ولم يتم اكتشاف أي تلاعب رقمي.' },
            { type: 'SUCCESS', message: 'هيكل الإيصال يتوافق مع النماذج الرسمية لبنك الراجحي.' }
        ];

        return NextResponse.json({ 
            success: true, 
            data: {
                isFraud,
                extractedData: mockExtractedData,
                confidenceScore: isFraud ? 0.92 : 0.98,
                flags: analysisFlags,
                message: isFraud 
                    ? '⚠️ اشتباه في تزوير الإيصال! يرجى التحقق يدوياً قبل اعتماد الدفعة.' 
                    : '✅ الإيصال سليم وموثوق.'
            } 
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AI' });
