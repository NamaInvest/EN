import { NextResponse, NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runInventoryTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';

const log = logger.child({ service: 'pharmacy.prescriptions' });

async function _GET(req: NextRequest, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = assertTenant(auth?.tenantId);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const patientId = url.searchParams.get('patientId');
    const wasfatyRef = url.searchParams.get('wasfatyRef');
    const status = url.searchParams.get('status');

    try {
        const where: any = { ...requireTenantFilter({ tenantId }) };
        if (patientId) where.patientId = parseInt(patientId);
        if (wasfatyRef) where.wasfatyRef = wasfatyRef;
        if (status) where.status = status;

        // @ts-ignore — new pharmacy model; restart TS server to clear IDE cache
        const prescriptions = await prisma.prescription.findMany({ 
            take: 100,
            where,
            include: {
                patient: { select: { nationalId: true, name: true, phone: true, allergies: true } },
                items: { include: { drug: { select: { genericName: true, drugClass: true, isControlled: true } } } },
                pharmacist: { select: { fullName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ total: prescriptions.length, prescriptions });
    } catch (e: any) {
        log.error('pharmacy.prescriptions.GET', { error: e instanceof Error ? e.message : e, tenantId });
        return NextResponse.json({ error: 'خطأ في تحميل الوصفات' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  patientId: z.union([z.string(), z.number()]).optional(),
  wasfatyRef: z.any().optional(),
  doctorName: z.any().optional(),
  doctorLicense: z.any().optional(),
  clinicName: z.any().optional(),
  prescriptionDate: z.string().optional(),
  expiryDate: z.string().optional(),
  source: z.any().optional(),
  imageUrl: z.any().optional(),
}).passthrough();

const _PUTSchema = z.object({
  prescriptionId: z.union([z.string(), z.number()]).optional(),
  items: z.array(z.any()).optional(),
}).passthrough();

async function _POST(req: NextRequest, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = assertTenant(auth?.tenantId);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed2.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed2.error.flatten().fieldErrors }, { status: 400 });
        }

        // @ts-ignore — new pharmacy model; restart TS server to clear IDE cache
        const prescription = await prisma.prescription.create({
            data: {
                tenantId,
                patientId: parseInt(body.patientId),
                wasfatyRef: body.wasfatyRef || null,
                doctorName: body.doctorName || null,
                doctorLicense: body.doctorLicense || null,
                clinicName: body.clinicName || null,
                prescriptionDate: body.prescriptionDate || new Date().toISOString().split('T')[0],
                expiryDate: body.expiryDate || null,
                source: body.source || 'paper',
                status: 'pending',
                imageUrl: body.imageUrl || null,
                pharmacistId: auth.userId,
                notes: body.notes || null,
                items: {
                    create: (body.items || []).map((item: any) => ({
                        tenantId,
                        drugId: parseInt(item.drugId),
                        drugName: item.drugName,
                        dosage: item.dosage || null,
                        durationDays: item.durationDays ? parseInt(item.durationDays) : null,
                        quantity: parseFloat(item.quantity),
                    })),
                },
            },
            include: {
                items: { include: { drug: true } },
                patient: { select: { name: true, nationalId: true } },
            },
        });

        return NextResponse.json(prescription, { status: 201 });
    } catch (e: any) {
        log.error('pharmacy.prescriptions.POST', { error: e instanceof Error ? e.message : e, tenantId });
        return NextResponse.json({ error: 'خطأ في تسجيل الوصفة' }, { status: 500 });
    }
}

// PUT — Dispense prescription

async function _PUT(req: NextRequest, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = assertTenant(auth?.tenantId);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();
        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const { prescriptionId, items } = body;

        const result = await runInventoryTx(prisma, async (tx: any) => {
            let allDispensed = true;

            for (const item of items) {
                const qty = parseFloat(item.dispensedQty);
                await tx.prescriptionItem.update({
                    where: { id: parseInt(item.id), ...requireTenantFilter({ tenantId }) },
                    data: {
                        dispensedQty: qty,
                        status: qty >= item.quantity ? 'dispensed' : 'partial',
                    },
                });
                if (qty < item.quantity) allDispensed = false;

                // Deduct from stock
                await tx.product.update({
                    where: { id: parseInt(item.productId), ...requireTenantFilter({ tenantId }) },
                    data: { currentStock: { decrement: qty } },
                });

                // Log medication
                await tx.medicationLog.create({
                    data: {
                        tenantId,
                        patientId: parseInt(body.patientId),
                        drugName: item.drugName,
                        dosage: item.dosage || null,
                        quantity: qty,
                        pharmacistId: auth.userId,
                    },
                });

                // Controlled drug log
                if (item.isControlled) {
                    await tx.controlledDrugLog.create({
                        data: {
                            tenantId,
                            drugId: parseInt(item.drugId),
                            patientNationalId: body.patientNationalId,
                            patientName: body.patientName,
                            doctorName: body.doctorName || '',
                            doctorLicense: body.doctorLicense || '',
                            pharmacistId: auth.userId,
                            quantity: qty,
                        },
                    });
                }
            }

            // Update prescription status
            const rx = await tx.prescription.update({
                where: { id: parseInt(prescriptionId), ...requireTenantFilter({ tenantId }) },
                data: {
                    status: allDispensed ? 'dispensed' : 'partial',
                    dispensedAt: new Date(),
                    pharmacistId: auth.userId,
                },
            });

            return rx;
        }, 'PRESCRIPTION_DISPENSE');

        return NextResponse.json({ success: true, prescription: result });
    } catch (e: any) {
        log.error('pharmacy.prescriptions.PUT', { error: e instanceof Error ? e.message : e, tenantId });
        return NextResponse.json({ error: 'خطأ في صرف الوصفة' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req, auth }) => _GET(req as any, auth), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, auth }) => _POST(req as any, auth), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req, auth }) => _PUT(req as any, auth), { rateLimit: 'FINANCIAL' });

