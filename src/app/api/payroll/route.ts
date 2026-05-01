import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resolveTenant } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        // 1. Tenant Authentication & Isolation
        const tenantString = resolveTenant(req as any);
        if (!tenantString) {
            return NextResponse.json({ error: "Missing or invalid Tenant ID" }, { status: 401 });
        }

        // 2. Parse Payload
        const body = await req.json();
        const {
            employeeId,
            period, // e.g. "2026-05"
            details, // Array of { description, amount, type: 'addition' | 'deduction', loanId?: number }
        } = body;

        if (!employeeId || !details || details.length === 0) {
            return NextResponse.json({ error: "Employee ID and payroll details are required." }, { status: 400 });
        }

        // Calculate Net Salary & Summarize Deductions
        let totalAddition = 0;
        let totalDeduction = 0;
        let loanDeductionsAmount = 0;
        let absenceDeductionsAmount = 0;

        for (const item of details) {
            if (item.type === 'addition') {
                totalAddition += Number(item.amount);
            } else if (item.type === 'deduction') {
                totalDeduction += Number(item.amount);
                if (item.loanId) {
                    loanDeductionsAmount += Number(item.amount);
                } else if (item.description.includes('غياب')) {
                    absenceDeductionsAmount += Number(item.amount);
                }
            }
        }
        const netTotal = totalAddition - totalDeduction;

        // 3. Database Transaction (Atomic Payroll Processing)
        const result = await prisma.$transaction(async (tx: any) => {
            // A. Create the Payroll Invoice Header
            const invoice = await tx.payrollInvoice.create({
                data: {
                    invoiceNo: `PR-${Math.floor(Math.random() * 1000000)}`,
                    period: period,
                    total: netTotal,
                    employeeId: employeeId,
                    status: "approved",
                }
            });

            // B. Persist Line Items (Additions / Deductions) & Update Loans
            const lineItems = await Promise.all(details.map(async (item: any) => {
                
                // If it's a loan deduction, update the EmployeeLoan remaining balance
                if (item.type === 'deduction' && item.loanId) {
                    const loan = await tx.employeeLoan.findUnique({ where: { id: item.loanId } });
                    if (loan) {
                        const newBalance = loan.remainingAmount - Number(item.amount);
                        await tx.employeeLoan.update({
                            where: { id: item.loanId },
                            data: {
                                remainingAmount: Math.max(0, newBalance),
                                status: newBalance <= 0 ? 'paid' : 'active'
                            }
                        });
                    }
                }

                return tx.payrollInvoiceDetail.create({
                    data: {
                        invoiceId: invoice.id,
                        description: item.description,
                        amount: Number(item.amount),
                        type: item.type,
                    }
                });
            }));

            // C. Register ZATCA Compliance Record (if local tax laws require payroll reporting)
            const zatcaRecord = await tx.zATCARecord.create({
                data: {
                    invoiceId: invoice.id,
                    invoiceType: "PAYROLL",
                    status: "pending", 
                }
            });

            return { invoice, lineItems, zatcaRecord };
        });

        // 4. Generate Notification Message
        let msg = `تم صرف الراتب بنجاح! الصافي المستحق: ${netTotal.toFixed(2)} ريال.`;
        if (loanDeductionsAmount > 0 || absenceDeductionsAmount > 0) {
            msg += ` (تم خصم:`;
            if (loanDeductionsAmount > 0) msg += ` ${loanDeductionsAmount.toFixed(2)} سداد سلفة`;
            if (absenceDeductionsAmount > 0) msg += `${loanDeductionsAmount > 0 ? ' و' : ''} ${absenceDeductionsAmount.toFixed(2)} غياب`;
            msg += `)`;
        }

        return NextResponse.json({
            success: true,
            message: msg,
            data: result
        }, { status: 201 });

    } catch (error: any) {
        console.error("Payroll API Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to process payroll",
            details: error.message
        }, { status: 500 });
    }
}
