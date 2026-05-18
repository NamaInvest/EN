import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getNextNumber } from '@/lib/numbering';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { EnterpriseLogger } from '@/lib/observability/logger';
import { OutboxService } from '@/lib/services/outbox.service';
import { FinancialPeriodService } from '@/services/accounting/financial-period.service';

const log = logger.child({ service: 'hr.payroll.run' });

async function _GET(req: Request, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = requireTenantId(req as any);

    try {
        const { searchParams } = new URL(req.url);
        const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

        const employees = await prisma.employee.findMany({ take: 100,
            where: { tenantId, active: true },
            select: { id: true, name: true, salary: true, housingAllowance: true, transportAllowance: true, otherAllowance: true }
        });

        const preview = employees.map(emp => {
            const basic = emp.salary || 0;
            const additions = n(emp.housingAllowance) + n(emp.transportAllowance) + n(emp.otherAllowance);
            
            const subjectToGosi = n(basic) + n(emp.housingAllowance);
            const gosiDeduction = subjectToGosi * 0.09; 
            
            const netSalary = n(basic) + additions - gosiDeduction;

            return {
                employeeId: emp.id,
                name: emp.name,
                basic,
                additions,
                gosiDeduction,
                netSalary
            };
        });

        const setting = await prisma.setting.findUnique({ where: { key: 'payroll_accounting_config' } });
        const config = setting?.value ? JSON.parse(setting.value) : null;

        const existing = await prisma.salary.findFirst({ where: { tenantId, month, year } });

        return NextResponse.json({ 
            success: true, 
            data: { 
                preview, 
                configReady: !!config?.basicSalary, 
                alreadyProcessed: !!existing 
            } 
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  month: z.union([z.string(), z.number()]).optional(),
  year: z.union([z.string(), z.number()]).optional(),
  data: z.any().optional(),
}).passthrough();

async function _POST(req: Request, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = requireTenantId(req as any);

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { month, year, data } = body;

        const setting = await prisma.setting.findUnique({ where: { key: 'payroll_accounting_config' } });
        if (!setting || !setting.value) {
            return NextResponse.json({ error: 'إعدادات المحاسبة غير مكتملة. يرجى تهيئتها أولاً.' }, { status: 400 });
        }
        const config = JSON.parse(setting.value);

        let totalBasic = 0, totalHousing = 0, totalTransport = 0, totalOther = 0;
        let totalGosi = 0, totalNet = 0;

        const salariesToCreate = data.map((d: any) => {
            totalBasic += d.basic;
            totalHousing += d.housingAllowance || 0;
            totalTransport += d.transportAllowance || 0;
            totalOther += d.otherAllowance || 0;
            totalGosi += d.gosiDeduction;
            totalNet += d.netSalary;

            return {
                tenantId,
                employeeId: d.employeeId,
                month,
                year,
                basicSalary: d.basic,
                additions: d.additions,
                deductions: d.gosiDeduction, 
                gosiDeduction: d.gosiDeduction,
                loanDeduction: 0,
                netSalary: d.netSalary,
                notes: 'مسير راتب شهري أوتوماتيكي'
            };
        });

        await runFinancialTx(prisma, async (tx: any) => {
            // Phase 4: Period Lock Enforcement inside transaction
            const payrollDate = new Date(year, month, 0); // Last day of the payroll month
            const periodService = new FinancialPeriodService(tx, { tenant: { id: tenantId } } as any);
            await periodService.requireOpenPeriod(payrollDate);

            const txExisting = await tx.salary.findFirst({ where: { tenantId, month, year } });
            if (txExisting) {
                throw new Error('تم إصدار مسير الرواتب لهذا الشهر مسبقاً.');
            }

            const jeNumberData = await getNextNumber(tx, 'JE');
            const jeNo = jeNumberData.formatted;

            await tx.salary.createMany({ data: salariesToCreate });

            const je = await tx.journalEntry.create({
                data: {
                    tenantId,
                    reference: `PAYROLL-${year}-${month}`,
                    date: payrollDate,
                    description: `استحقاق مسير رواتب شهر ${month} لسنة ${year}`,
                    status: 'POSTED',
                    jeNo
                }
            });

            const lines = [];
            if (totalBasic > 0) lines.push({ tenantId, journalEntryId: je.id, accountId: Number(config.basicSalary), debit: totalBasic, credit: 0, description: 'الراتب الأساسي' });
            if (totalHousing > 0) lines.push({ tenantId, journalEntryId: je.id, accountId: Number(config.housingAllowance), debit: totalHousing, credit: 0, description: 'بدل السكن' });
            if (totalTransport > 0) lines.push({ tenantId, journalEntryId: je.id, accountId: Number(config.transportAllowance), debit: totalTransport, credit: 0, description: 'بدل النقل' });
            if (totalOther > 0) lines.push({ tenantId, journalEntryId: je.id, accountId: Number(config.otherAllowance), debit: totalOther, credit: 0, description: 'بدلات أخرى' });

            if (totalGosi > 0) lines.push({ tenantId, journalEntryId: je.id, accountId: Number(config.gosiDeduction), debit: 0, credit: totalGosi, description: 'استقطاع التأمينات' });
            if (totalNet > 0) lines.push({ tenantId, journalEntryId: je.id, accountId: Number(config.netPayableLiability), debit: 0, credit: totalNet, description: 'صافي الرواتب المستحقة' });

            await tx.journalLine.createMany({ data: lines });

            EnterpriseLogger.traceFinancialTx(
                `PAYROLL_RUN_${year}_${month}`,
                'PAYROLL_GENERATED_POSTED',
                tenantId,
                { month, year, totalNet }
            );

            await OutboxService.emit(tx, {
                tenantId,
                aggregateId: `${year}-${month}`,
                aggregateType: 'PayrollRun',
                eventType: 'HR_PAYROLL_RUN_COMPLETED',
                payload: {
                    tenantId,
                    month,
                    year,
                    salaryCount: salariesToCreate.length,
                    totalAmount: totalNet
                },
                idempotencyKey: `hr-payroll-run:${tenantId}:${year}:${month}`
            });

        }, 'PAYROLL_RUN');

        return NextResponse.json({ success: true, message: 'تم ترحيل مسير الرواتب المحاسبي وإنشاء قيد الاستحقاق بنجاح.' });
    } catch (e: any) {
        EnterpriseLogger.error("Payroll run error", { tenantId }, e);
        if (e.message === 'تم إصدار مسير الرواتب لهذا الشهر مسبقاً.') {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req, auth }) => _GET(req as any, auth), { rateLimit: 'DEFAULT', roles: ['admin', 'owner', 'hr'] });

export const POST = withRoute(async ({ req, auth }) => _POST(req as any, auth), { rateLimit: 'FINANCIAL', roles: ['admin', 'owner', 'hr'] });
