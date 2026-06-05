import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { WPSGenerator } from '@/lib/wps-generator';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.wps' });

async function _GET(request: NextRequest) {
    const prisma = getPrisma(request as any);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth || !['admin', 'hr', 'hr_manager', 'payroll_admin'].includes(auth.role)) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        }
        const tenantId = requireTenantId(request as any);

        const dashboard = await WPSGenerator.getComplianceDashboard(prisma, tenantId);
        return NextResponse.json(dashboard);
    } catch (error: any) {
        log.error('WPS GET error:', error);
        return NextResponse.json({ error: 'فشل جلب ملفات حماية الأجور' }, { status: 500 });
    }
}

const _POSTSchema = z.object({
  action: z.string().optional(),
  payrollRunId: z.union([z.string(), z.number()]).optional(),
  bankCode: z.string().optional(),
  employerId: z.string().optional(),
  employerName: z.string().optional(),
  molId: z.string().optional(),
  batchId: z.union([z.string(), z.number()]).optional(),
});

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request as any);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth || !['admin', 'hr', 'hr_manager', 'payroll_admin'].includes(auth.role)) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        }
        const tenantId = requireTenantId(request as any);

        const body = await request.json();
        const parsed = _POSTSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'بيانات الطلب غير صالحة', details: parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const action = body.action || 'generate';

        if (action === 'generate') {
            const { payrollRunId, bankCode, employerId, employerName, molId } = body;
            if (!payrollRunId || !bankCode || !employerId) {
                return NextResponse.json({ error: 'يجب تحديد مسير الرواتب، البنك، ومعرف المنشأة' }, { status: 400 });
            }

            const result = await WPSGenerator.generateSIF(
                prisma,
                tenantId,
                parseInt(payrollRunId),
                bankCode,
                employerId,
                employerName || 'نما للاستثمار',
                molId || '1000000000'
            );

            return NextResponse.json({ 
                success: true, 
                batch: { 
                    id: result.batchId,
                    batchNumber: result.summary.batchNumber,
                    totalAmount: result.summary.totalNet,
                    totalEmployees: result.summary.totalEmployees,
                    fileFormat: 'SIF_V3',
                    fileContent: result.content,
                    status: 'GENERATED'
                } 
            });
        }

        if (action === 'validate_ibans' || action === 'validate-ibans') {
            const employees = await prisma.employee.findMany({
                take: 100,
                where: { active: true, tenantId }
            });
            const result = await WPSGenerator.validateIBANs(employees);
            return NextResponse.json(result);
        }

        if (action === 'submit' || action === 'mark-uploaded') {
            const batchId = parseInt(body.batchId);
            if (!batchId) {
                return NextResponse.json({ error: 'رقم الدفعة مطلوب' }, { status: 400 });
            }

            const result = await WPSGenerator.submitToBank(prisma, tenantId, batchId);
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'الإجراء غير مدعوم' }, { status: 400 });
    } catch (error: any) {
        log.error('WPS POST error:', error);
        return NextResponse.json({ error: error.message || 'فشل معالجة الطلب' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
