import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createJournalEntry } from '@/lib/auto-journal';

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
    try {
        const auth = await getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!(await hasPermission(auth.userId, 'treasury'))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const params = 'then' in context.params ? await context.params : context.params;
        const id = parseInt(params.id);

        const body = await request.json();
        const { status, settlementAmount } = body; 

        if (!status) {
             return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 });
        }

        // @ts-ignore
        const pc = await prisma.pettyCashTransaction.findUnique({ where: { id }, include: { employee: true } });
        if (!pc) return NextResponse.json({ error: 'العهدة غير موجودة' }, { status: 404 });

        let updateData: any = { status };

        let debitAccount = '';
        let creditAccount = '';
        let description = '';
        let entryAmount = pc.amount;

        // Disbursing the petty cash (paying it out to employee)
        if (pc.status === 'PENDING' && status === 'DISBURSED') {
            debitAccount = '1230'; // سلف أو عهد موظفين (Employee Advances/Petty Cash Asset)
            creditAccount = '1110'; // الصندوق (Cash in safe)
            description = `صرف عهدة للموظف ${pc.employee.name} رقم ${pc.id}`;
        } 
        // Settling the petty cash (employee brings receipts)
        else if (pc.status === 'DISBURSED' && status === 'SETTLED') {
            const expenseAmount = parseFloat(settlementAmount);
            updateData.settlementAmount = expenseAmount;
            updateData.difference = pc.amount - expenseAmount;

            debitAccount = '5200'; // مصروف (Simplification, usually you map expenses)
            creditAccount = '1230'; // عهد موظفين
            description = `تصفية عهدة موظف ${pc.employee.name} وإقفال الباقی للصندوق`;
            // Advanced: If difference > 0, cash is returned.
            // But we keep it simple for now and just journal the initial amount out of employee account.
            // If they spent less, they return cash. If they spent more, we owe them.
        }

        // @ts-ignore
        const updated = await prisma.pettyCashTransaction.update({
            where: { id },
            data: updateData
        });

        if (debitAccount && creditAccount) {
            const dAcct = await prisma.account.findFirst({ where: { code: debitAccount } });
            const cAcct = await prisma.account.findFirst({ where: { code: creditAccount } });
            
            if (dAcct && cAcct) {
                // Keep it simple for settlement: just credit the whole advance to close it out.
                // Depending on difference, debit expenses and debit/credit Cash.
                const lines = [];
                if (status === 'DISBURSED') {
                    lines.push({ accountCode: debitAccount, debit: pc.amount, credit: 0, description });
                    lines.push({ accountCode: creditAccount, debit: 0, credit: pc.amount, description });
                } else if (status === 'SETTLED') {
                    const diff = pc.amount - parseFloat(settlementAmount);
                    lines.push({ accountCode: '5200', debit: parseFloat(settlementAmount), credit: 0, description: 'مصاريف عهدة' });
                    
                    if (diff > 0) { // they return money to safe
                        lines.push({ accountCode: '1110', debit: diff, credit: 0, description: 'إرجاع باقي عهدة للصندوق' });
                    } else if (diff < 0) { // they spent more, we pay them from safe
                        lines.push({ accountCode: '1110', debit: 0, credit: Math.abs(diff), description: 'صرف تعويض زيادة للصندوق' });
                    }
                    lines.push({ accountCode: '1230', debit: 0, credit: pc.amount, description: 'إقفال العهدة من ذمة الموظف' });
                }

                await createJournalEntry({
                    description: description,
                    reference: `PC-${pc.id}`,
                    date: new Date().toISOString().split('T')[0],
                    userId: auth.userId,
                    lines: lines
                });
            }
        }

        return NextResponse.json(updated);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
