import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const body = await request.json();
        
        const branchId = body.branchId ? parseInt(body.branchId.toString()) : null;

        const data: any = {};
        if (body.bankName !== undefined) data.bankName = body.bankName;
        if (body.accountName !== undefined) data.accountName = body.accountName;
        if (body.accountNumber !== undefined) data.accountNumber = body.accountNumber;
        if (body.iban !== undefined) data.iban = body.iban;
        if (body.currency !== undefined) data.currency = body.currency;
        if (body.isActive !== undefined) data.isActive = body.isActive;
        if (branchId !== undefined) data.branchId = branchId;

        const bank = await prisma.bankAccount.update({
            where: { id },
            data
        });

        return NextResponse.json(bank);
    } catch (error: any) { 
        console.error(error); 
        return NextResponse.json({ error: error.message }, { status: 500 }); 
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        // Check if there are transactions other than opening balance
        const transactionsCount = await prisma.bankTransaction.count({
            where: { bankAccountId: id }
        });

        if (transactionsCount > 1) {
            return NextResponse.json({ error: 'لا يمكن حذف الحساب البنكي لوجود حركات مالية عليه' }, { status: 400 });
        }

        // Delete opening balance transaction if it exists
        await prisma.bankTransaction.deleteMany({
            where: { bankAccountId: id }
        });

        await prisma.bankAccount.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) { 
        console.error(error); 
        return NextResponse.json({ error: error.message }, { status: 500 }); 
    }
}
