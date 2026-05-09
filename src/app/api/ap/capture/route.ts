import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma, resolveTenant } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { getUserFromRequest } from '@/lib/auth';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function _GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const where: any = { tenantId };
        if (status && status !== 'ALL') where.matchStatus = status;

        const captures = await (prisma as any).invoiceCapture.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        const counts = {
            total: await (prisma as any).invoiceCapture.count({ where: { tenantId } }),
            pending: await (prisma as any).invoiceCapture.count({ where: { tenantId, matchStatus: 'PENDING' } }),
            matched: await (prisma as any).invoiceCapture.count({ where: { tenantId, matchStatus: 'MATCHED_PO' } }),
            exception: await (prisma as any).invoiceCapture.count({ where: { tenantId, matchStatus: 'EXCEPTION' } }),
            posted: await (prisma as any).invoiceCapture.count({ where: { tenantId, matchStatus: 'POSTED' } }),
        };

        return NextResponse.json({ captures, counts });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { source, fileUrl, ocrText } = await request.json();

        // Step 1: Use Gemini to extract invoice data from raw text
        let extractedData: any = {};
        let confidence = 0;

        if (ocrText) {
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const prompt = `You are an expert invoice data extractor for Saudi Arabian tax invoices.
Extract the following fields from this invoice text and return ONLY valid JSON:
{
  "vendorName": "",
  "vatNumber": "",
  "invoiceNumber": "",
  "invoiceDate": "",
  "subtotal": 0,
  "vatAmount": 0,
  "totalAmount": 0,
  "currency": "SAR",
  "poReference": "",
  "lineItems": [{"description": "", "quantity": 0, "unitPrice": 0, "total": 0, "vatRate": 15}]
}

Invoice text:
${ocrText}`;

                const result = await model.generateContent(prompt);
                const text = result.response.text();
                
                // Try to parse the JSON from the response
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    extractedData = JSON.parse(jsonMatch[0]);
                    // Calculate confidence based on how many fields were extracted
                    const fields = ['vendorName', 'vatNumber', 'invoiceNumber', 'invoiceDate', 'totalAmount'];
                    const filled = fields.filter(f => extractedData[f] && extractedData[f] !== '').length;
                    confidence = filled / fields.length;
                }
            } catch (aiErr: unknown) {
                console.error('AI extraction error:', aiErr);
                confidence = 0;
            }
        }

        // Step 2: Auto-match attempt
        let matchStatus = 'PENDING';
        let matchedPoId = null;

        if (extractedData.vatNumber && confidence > 0.5) {
            // Try to find vendor by VAT
            const vendor = await (prisma as any).customer.findFirst({
                where: { taxId: extractedData.vatNumber }
            });

            if (vendor && extractedData.poReference) {
                // Try to match PO by orderNo
                const poRef = parseInt(extractedData.poReference.replace(/\D/g, ''), 10);
                const po = poRef ? await (prisma as any).purchaseOrder.findFirst({
                    where: {
                        supplierId: vendor.id,
                        orderNo: poRef
                    }
                }) : null;

                if (po) {
                    matchedPoId = po.id.toString();
                    matchStatus = 'MATCHED_PO';
                }
            }

            if (matchStatus === 'PENDING' && confidence > 0.7) {
                matchStatus = 'EXCEPTION';
            }
        }

        // Step 3: Save capture
        const capture = await (prisma as any).invoiceCapture.create({
            data: {
                tenantId,
                source: source || 'UPLOAD',
                fileUrl: fileUrl || '',
                ocrRawText: ocrText,
                extractedData,
                matchStatus,
                matchedPoId,
                confidence,
                exceptionReason: matchStatus === 'EXCEPTION' ? 'PO not found or vendor unmatched' : null
            }
        });

        return NextResponse.json({
            success: true,
            capture,
            message: matchStatus === 'MATCHED_PO' ? 'تم المطابقة تلقائياً مع أمر الشراء!' :
                     matchStatus === 'EXCEPTION' ? 'يحتاج مراجعة يدوية' : 'تم الاستلام - بانتظار المطابقة'
        });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
