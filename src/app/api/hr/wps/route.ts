import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.wps' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const tenantId = requireTenantId(request as any);

        const batches = await prisma.wPSBatch.findMany({ take: 100,
            where: { tenantId },
            include: {
                payrollRun: { select: { year: true, month: true } }
            },
            orderBy: { id: 'desc' }
        });

        const acceptedCount = batches.filter(b => b.status === 'ACCEPTED').length;
        const pendingCount = batches.filter(b => b.status === 'GENERATED' || b.status === 'PENDING').length;

        return NextResponse.json({
            batches,
            summary: {
                totalBatches: batches.length,
                acceptedCount,
                pendingCount,
                ibanErrors: batches.filter(b => b.status === 'REJECTED').length,
            }
        });
    } catch (error: any) {
        log.error('WPS GET error:', error);
        return NextResponse.json({ error: 'فشل جلب ملفات حماية الأجور' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  payrollRunId: z.union([z.string(), z.number()]).optional(),
  bankCode: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const tenantId = requireTenantId(request as any);

        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { payrollRunId, bankCode } = body;

        if (!payrollRunId || !bankCode) {
            return NextResponse.json({ error: 'يجب تحديد مسير الرواتب والبنك' }, { status: 400 });
        }

        const payrollRun = await prisma.payrollRun.findUnique({
            where: { id: payrollRunId, tenantId }
        });

        if (!payrollRun) return NextResponse.json({ error: 'مسير الرواتب غير موجود' }, { status: 404 });

        const employees = await prisma.employee.findMany({ take: 100, where: { tenantId } });
        const totalAmount = employees.reduce((sum: number, emp: any) => sum + Number(emp.basicSalary || 0), 0);
        
        // Generate SIF Content Mock
        const sifContent = `1,${payrollRun.year}${String(payrollRun.month).padStart(2,'0')}01,${employees.length},${totalAmount}\n` +
                           employees.map((e: any) => `${e.id},${e.name},${e.basicSalary || 0}`).join('\n');

        const batch = await prisma.wPSBatch.create({
            data: {
                tenantId,
                payrollRunId,
                bankCode,
                batchNumber: `WPS-${payrollRun.year}-${String(payrollRun.month).padStart(2,'0')}-${Math.floor(Math.random() * 10000)}`,
                totalAmount,
                totalEmployees: employees.length,
                fileFormat: 'SIF_V2',
                fileContent: sifContent,
                fileGeneratedAt: new Date(),
                status: 'GENERATED'
            }
        });

        return NextResponse.json({ success: true, batch });
    } catch (error: any) {
        log.error('WPS POST error:', error);
        return NextResponse.json({ error: error.message || 'فشل توليد ملف SIF' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
