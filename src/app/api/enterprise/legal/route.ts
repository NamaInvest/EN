import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || 'all'; // 'notes' or 'lgs'
        
        const responseData: any = {};

        if (type === 'all' || type === 'notes') {
            responseData.notes = await prisma.promissoryNote.findMany({
                where: {
                    OR: [
                        { noteNumber: { contains: search, mode: 'insensitive' } },
                        { customer: { name: { contains: search, mode: 'insensitive' } } }
                    ]
                },
                include: { customer: { select: { name: true } } },
                orderBy: { dueDate: 'asc' },
            });
        }

        if (type === 'all' || type === 'lgs') {
            responseData.lgs = await prisma.letterOfGuarantee.findMany({
                where: {
                    OR: [
                        { lgNumber: { contains: search, mode: 'insensitive' } }
                    ]
                },
                include: { bank: { select: { bankName: true, currency: true } } },
                orderBy: { expiryDate: 'asc' },
            });
        }

        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error('Legal Fetch Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/legal' });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();
        const { entityType } = data; // 'note' or 'lg'

        if (entityType === 'note') {
            const note = await prisma.promissoryNote.create({
                data: { 
                    noteNumber: data.noteNumber, 
                    customerId: parseInt(data.customerId), 
                    amount: parseFloat(data.amount) || 0,
                    dueDate: new Date(data.dueDate),
                    status: data.status || 'PENDING',
                    notes: data.notes
                }
            });
            return NextResponse.json({ message: 'تم حفظ الكمبيالة (سند لأمر) بنجاح', note });
        }
        
        if (entityType === 'lg') {
            const lg = await prisma.letterOfGuarantee.create({
                data: { 
                    lgNumber: data.lgNumber, 
                    bankId: parseInt(data.bankId), 
                    customerId: data.customerId ? parseInt(data.customerId) : null,
                    type: data.type,
                    amount: parseFloat(data.amount) || 0,
                    issueDate: new Date(data.issueDate),
                    expiryDate: new Date(data.expiryDate),
                    status: data.status || 'ACTIVE',
                    notes: data.notes
                }
            });
            return NextResponse.json({ message: 'تم إصدار خطاب الضمان', lg });
        }

        return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 });
    } catch (error: any) {
        console.error('Create Legal Entity Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/legal' });
    }
}

export async function PUT(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();
        
        if (data.entityType === 'note') {
            const note = await prisma.promissoryNote.update({
                where: { id: parseInt(data.id) },
                data: { status: data.status }
            });

            // Deep-Dive integration: Automatically create a Bank Check Transaction when collected
            if (data.status === 'COLLECTED') {
                await prisma.checkTransaction.create({
                    data: {
                        checkNumber: `PRN-${note.noteNumber}`,
                        amount: note.amount,
                        dueDate: note.dueDate,
                        type: 'RECEIVABLE',
                        status: 'PENDING', // Treasury will clear it when banked
                        bankName: 'System'
                    }
                });
            }

            return NextResponse.json({ message: 'تم تحديث السند لأمر وتوجيهه مالياً', note });
        }
        
        // ... (can handle Lg statuses similarly, e.g., EXPIRED, LIQUIDATED)
        
        return NextResponse.json({ error: 'Unsupported entity' }, { status: 400 });
    } catch (error: any) {
        console.error('Update Legal Entity Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/legal' });
    }
}
