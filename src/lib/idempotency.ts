import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getTenantPrisma, resolveTenant } from '@/lib/prisma';
import { IdempotencyStatus } from '@prisma/client';

export async function withIdempotency(
    req: NextRequest,
    endpoint: string,
    handler: () => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        const tenantId = resolveTenant(req);
        const prisma = getTenantPrisma(req);

        // 1. Read key from header or body
        let idempotencyKey = req.headers.get('Idempotency-Key') || req.headers.get('idempotency-key');
        
        let bodyText = '';
        let bodyJson: any = null;
        
        try {
            bodyText = await req.clone().text();
            bodyJson = bodyText ? JSON.parse(bodyText) : null;
        } catch (e) {
            // Ignore parse errors, body might be empty
        }

        if (!idempotencyKey && bodyJson && bodyJson.idempotencyKey) {
            idempotencyKey = String(bodyJson.idempotencyKey);
        }

        // If no key provided, skip idempotency entirely
        if (!idempotencyKey) {
            return await handler();
        }

        // 2. Hash request body (normalized)
        const hashPayload = bodyJson ? JSON.stringify(bodyJson) : bodyText;
        const requestHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

        // 3. Check or Create Idempotency Record
        let record;
        try {
            record = await prisma.idempotencyRecord.create({
                data: {
                    tenantId,
                    endpoint,
                    key: idempotencyKey,
                    requestHash,
                    status: 'IN_PROGRESS',
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // TTL: 24h
                }
            });
        } catch (error: any) {
            // P2002: Unique constraint violation (Race Condition or Duplicate)
            if (error.code === 'P2002') {
                record = await prisma.idempotencyRecord.findUnique({
                    where: {
                        tenantId_endpoint_key: {
                            tenantId,
                            endpoint,
                            key: idempotencyKey
                        }
                    }
                });

                if (!record) {
                    // Extremely rare edge case where create failed but findUnique returned null
                    throw new Error('Idempotency conflict resolution failed.');
                }
            } else {
                throw error;
            }
        }

        // 4. Handle Existing Record Status
        if (record.status === 'IN_PROGRESS') {
            return NextResponse.json(
                { success: false, message: 'طلب مكرر تحت المعالجة (IN_PROGRESS).' },
                { status: 409 }
            );
        }

        if (record.status === 'COMPLETED') {
            if (record.requestHash !== requestHash) {
                return NextResponse.json(
                    { success: false, message: 'مفتاح Idempotency مكرر مع بيانات طلب مختلفة.' },
                    { status: 400 }
                );
            }
            return NextResponse.json(record.responseBody, { status: record.responseCode || 200 });
        }

        if (record.status === 'FAILED') {
            if (record.requestHash !== requestHash) {
                return NextResponse.json(
                    { success: false, message: 'مفتاح Idempotency مكرر لطلب فاشل مع بيانات مختلفة.' },
                    { status: 400 }
                );
            }
            // Update back to IN_PROGRESS for retry
            await prisma.idempotencyRecord.update({
                where: { id: record.id },
                data: { status: 'IN_PROGRESS', lockedAt: new Date() }
            });
        }

        // 5. Execute Original Handler
        let response: NextResponse;
        try {
            response = await handler();
        } catch (handlerError: any) {
            // Handler threw an unhandled exception
            await prisma.idempotencyRecord.update({
                where: { id: record.id },
                data: { status: 'FAILED' }
            });
            throw handlerError; // Re-throw to be handled by global error catcher
        }

        // 6. Inspect Response
        if (response.status >= 200 && response.status < 400) {
            // Success
            const clonedRes = response.clone();
            const responseData = await clonedRes.json().catch(() => null);
            
            await prisma.idempotencyRecord.update({
                where: { id: record.id },
                data: {
                    status: 'COMPLETED',
                    responseCode: response.status,
                    responseBody: responseData || undefined
                }
            });
        } else {
            // Business logic failure (e.g., 400, 422) returned via NextResponse
            await prisma.idempotencyRecord.update({
                where: { id: record.id },
                data: { status: 'FAILED' }
            });
        }

        return response;
    } catch (e: any) {
        // Fallback for fatal errors outside the handler
        console.error('[Idempotency System] Fatal error:', e);
        return NextResponse.json({ success: false, message: 'خطأ في نظام المعالجة.' }, { status: 500 });
    }
}
