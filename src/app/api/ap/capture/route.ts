import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma, resolveTenant } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ap.capture' });

async function _GET(request: Request) {
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
        log.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { source, fileUrl, ocrText, imageBase64, mimeType, skipAI, manualData } = await request.json();

        // ── وضع الإدخال اليدوي: بدون AI ولا مطابقة ─────────────────────────────
        if (skipAI) {
            const manualExtracted = {
                vendorName:    manualData?.vendorName    || '',
                vatNumber:     manualData?.vatNumber     || '',
                invoiceNumber: manualData?.invoiceNumber || '',
                invoiceDate:   manualData?.invoiceDate   || '',
                totalAmount:   parseFloat(manualData?.totalAmount) || 0,
                vatAmount:     parseFloat(manualData?.vatAmount)   || 0,
                currency:      manualData?.currency      || 'SAR',
                lineItems:     manualData?.lineItems     || [],
            };
            let capture: any;
            try {
                capture = await (prisma as any).invoiceCapture.create({
                    data: {
                        tenantId,
                        source: source || 'MANUAL',
                        fileUrl: fileUrl || '',
                        ocrRawText: null,
                        extractedData: manualExtracted,
                        matchStatus: 'PENDING',
                        confidence: 1.0,
                        exceptionReason: null
                    }
                });
            } catch {
                const newId = `ic_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
                await (prisma as any).$executeRaw`
                    INSERT INTO invoice_captures
                        (id, tenant_id, source, file_url, ocr_raw_text, extracted_data, match_status, confidence, created_at)
                    VALUES
                        (${newId}, ${tenantId}, ${'MANUAL'}, ${fileUrl||''}, NULL,
                         ${JSON.stringify(manualExtracted)}::jsonb, ${'PENDING'}, ${1.0}, NOW())
                `;
                capture = { id: newId, tenantId, matchStatus: 'PENDING', confidence: 1.0, extractedData: manualExtracted };
            }
            return NextResponse.json({ success: true, capture, message: 'تم الحفظ اليدوي بنجاح' });
        }

        // Step 1: Use Gemini to extract invoice data from raw text
        let extractedData: any = {};
        let confidence = 0;

        if (ocrText || imageBase64) {
            try {
                // ── OCR-001: قراءة Gemini API Key من إعدادات الشركة ──────────────────
                // الأولوية:
                //   1. settings table مُفلتَرة بـ tenantId الشركة الحالية
                //   2. settings table بدون فلتر (كي مشترك للنظام)
                //   3. process.env.GEMINI_API_KEY (احتياط فقط)
                // تحذير: لا تضع هذا الكي في .env — اجعل كل شركة تضع كيها في الإعدادات
                const tenantSettingRows: any[] = await (prisma as any).$queryRaw`
                    SELECT value FROM settings 
                    WHERE key = 'gemini_api_key' AND tenant_id = ${tenantId} 
                    LIMIT 1
                `;
                const globalSettingRows: any[] = tenantSettingRows.length === 0
                    ? await (prisma as any).$queryRaw`SELECT value FROM settings WHERE key = 'gemini_api_key' LIMIT 1`
                    : [];
                
                const rawKey = (tenantSettingRows[0]?.value || globalSettingRows[0]?.value || process.env.GEMINI_API_KEY || '');
                // إزالة علامات الاقتباس المزدوجة/المفردة الزائدة (bug شائع في .env files)
                const apiKey = rawKey.replace(/^["']|["']$/g, '').trim();
                
                if (!apiKey) {
                    throw new Error('OCR-001: Gemini API Key غير مُضاف. أضفه في الإعدادات ← الذكاء الاصطناعي ← مفتاح Gemini API.');
                }
                
                const genAI = new GoogleGenerativeAI(apiKey);
                // OCR-002: gemini-1.5-flash غير متاح عبر v1beta → استخدم gemini-2.0-flash
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const prompt = `You are an expert invoice data extractor for Saudi Arabian tax invoices.
Extract the following fields from this invoice image, PDF, or text and return ONLY valid JSON:
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
}`;

                const parts: any[] = [{ text: prompt }];
                if (ocrText) {
                    parts.push({ text: `\nInvoice text:\n${ocrText}` });
                }
                if (imageBase64) {
                    parts.push({
                        inlineData: {
                            data: imageBase64.split(',').pop() || imageBase64,
                            mimeType: mimeType || 'image/jpeg'
                        }
                    });
                }

                const result = await model.generateContent(parts);
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
                const errMsg = String(aiErr);
                log.error(`AI extraction error: ${errMsg}`);
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

        // Step 3: Save capture — مع حماية من PrismaClientValidationError
        let capture: any;
        try {
            capture = await (prisma as any).invoiceCapture.create({
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
        } catch (prismaErr: any) {
            // OCR-003: Fallback to raw SQL إذا فشل Prisma model بسبب tenant middleware
            log.error(`invoiceCapture.create failed, using raw SQL fallback: ${String(prismaErr)}`);
            const newId = `ic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            await (prisma as any).$executeRaw`
                INSERT INTO invoice_captures 
                    (id, tenant_id, source, file_url, ocr_raw_text, extracted_data, match_status, matched_po_id, confidence, exception_reason, created_at)
                VALUES 
                    (${newId}, ${tenantId}, ${source || 'UPLOAD'}, ${fileUrl || ''}, ${ocrText || null},
                     ${JSON.stringify(extractedData)}::jsonb, ${matchStatus}, ${matchedPoId || null},
                     ${confidence}, ${matchStatus === 'EXCEPTION' ? 'PO not found or vendor unmatched' : null},
                     NOW())
            `;
            capture = { id: newId, tenantId, matchStatus, confidence, extractedData };
        }

        return NextResponse.json({
            success: true,
            capture,
            message: matchStatus === 'MATCHED_PO' ? 'تم المطابقة تلقائياً مع أمر الشراء!' :
                     matchStatus === 'EXCEPTION' ? 'يحتاج مراجعة يدوية' : 'تم الاستلام - بانتظار المطابقة'
        });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error', detail: e?.message }, { status: 500 });
    }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });

// ── PATCH: تعديل بيانات فاتورة (حفظ التعديلات اليدوية) ──────────────────────
async function _PATCH(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

        const body = await request.json();
        const { extractedData, matchStatus } = body;

        // تأكد أن السجل ينتمي لنفس الـ tenant
        const existing = await (prisma as any).invoiceCapture.findFirst({ where: { id, tenantId } });
        if (!existing) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

        const updated = await (prisma as any).invoiceCapture.update({
            where: { id },
            data: {
                ...(extractedData && { extractedData }),
                ...(matchStatus && { matchStatus }),
            }
        });

        return NextResponse.json({ success: true, capture: updated });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error', detail: e?.message }, { status: 500 });
    }
}

// ── DELETE: حذف فاتورة ────────────────────────────────────────────────────────
async function _DELETE(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

        // تأكد أن السجل ينتمي لنفس الـ tenant
        const existing = await (prisma as any).invoiceCapture.findFirst({ where: { id, tenantId } });
        if (!existing) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

        await (prisma as any).invoiceCapture.delete({ where: { id } });

        return NextResponse.json({ success: true, message: 'تم حذف الفاتورة' });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error', detail: e?.message }, { status: 500 });
    }
}

export const PATCH  = withRoute(async ({ req }) => _PATCH(req as any),  { rateLimit: 'DEFAULT' });
export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
