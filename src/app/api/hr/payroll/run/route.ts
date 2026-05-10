import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getNextNumber } from '@/lib/numbering';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';

const log = logger.child({ service: 'hr.payroll.run' });

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const { searchParams } = new URL(req.url);
        const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

        // Fetch employees
        const employees = await prisma.employee.findMany({ take: 100,
            where: { active: true },
            select: { id: true, name: true, salary: true, housingAllowance: true, transportAllowance: true, otherAllowance: true }
        });

        // Compute preview
        const preview = employees.map(emp => {
            const basic = emp.salary || 0;
            const additions = n(emp.housingAllowance) + n(emp.transportAllowance) + n(emp.otherAllowance);
            
            // Typical Saudi GOSI for Saudis is 9.75% of basic + housing, but let's approximate 10% of basic for this example if needed, or 0.
            // In a real app we'd check if nationality == SAUDI. We'll use 9% of basic + housing as an example.
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

        // Check if config is set
        const setting = await prisma.setting.findUnique({ where: { key: 'payroll_accounting_config' } });
        const config = setting?.value ? JSON.parse(setting.value) : null;

        // Check if already processed
        const existing = await prisma.salary.findFirst({ where: { month, year } });

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

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { month, year, data } = body;

        // Check if already processed
        const existing = await prisma.salary.findFirst({ where: { month, year } });
        if (existing) {
            return NextResponse.json({ error: 'تم إصدار مسير الرواتب لهذا الشهر مسبقاً.' }, { status: 400 });
        }

        // Get config
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
                employeeId: d.employeeId,
                month,
                year,
                basicSalary: d.basic,
                additions: d.additions,
                deductions: d.gosiDeduction, // assuming only GOSI for now
                gosiDeduction: d.gosiDeduction,
                loanDeduction: 0,
                netSalary: d.netSalary,
                notes: 'مسير راتب شهري أوتوماتيكي'
            };
        });

        await prisma.$transaction(async (tx: any) => {
            // Get Journal Entry Number
            const jeNumberData = await getNextNumber(tx, 'JE');
            const jeNo = jeNumberData.formatted;

            // 1. Create Salaries
            await tx.salary.createMany({ data: salariesToCreate });

            // 2. Create Journal Entry
            const je = await tx.journalEntry.create({
                data: {
                    reference: `PAYROLL-${year}-${month}`,
                    date: new Date(),
                    description: `استحقاق مسير رواتب شهر ${month} لسنة ${year}`,
                    status: 'POSTED',
                    jeNo
                }
            });

            // 3. Create Journal Lines
            const lines = [];

            // Debits (Expenses)
            if (totalBasic > 0) lines.push({ journalEntryId: je.id, accountId: Number(config.basicSalary), debit: totalBasic, credit: 0, description: 'الراتب الأساسي' });
            if (totalHousing > 0) lines.push({ journalEntryId: je.id, accountId: Number(config.housingAllowance), debit: totalHousing, credit: 0, description: 'بدل السكن' });
            if (totalTransport > 0) lines.push({ journalEntryId: je.id, accountId: Number(config.transportAllowance), debit: totalTransport, credit: 0, description: 'بدل النقل' });
            if (totalOther > 0) lines.push({ journalEntryId: je.id, accountId: Number(config.otherAllowance), debit: totalOther, credit: 0, description: 'بدلات أخرى' });

            // Credits (Liabilities)
            if (totalGosi > 0) lines.push({ journalEntryId: je.id, accountId: Number(config.gosiDeduction), debit: 0, credit: totalGosi, description: 'استقطاع التأمينات' });
            if (totalNet > 0) lines.push({ journalEntryId: je.id, accountId: Number(config.netPayableLiability), debit: 0, credit: totalNet, description: 'صافي الرواتب المستحقة' });

            await tx.journalLine.createMany({ data: lines });
        });

        return NextResponse.json({ success: true, message: 'تم ترحيل مسير الرواتب المحاسبي وإنشاء قيد الاستحقاق بنجاح.' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
