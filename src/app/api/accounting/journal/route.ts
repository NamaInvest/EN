import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createJournalEntry } from '@/lib/auto-journal';

// GET - القيود اليومية
export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const status = searchParams.get('status');

        const where: Record<string, unknown> = {};
        if (from) where.entryDate = { ...(where.entryDate as object || {}), gte: from };
        if (to) where.entryDate = { ...(where.entryDate as object || {}), lte: to };
        if (status) where.status = status;

        const entries = await prisma.journalEntry.findMany({
            where,
            include: {
                lines: {
                    include: { 
                        account: { select: { code: true, name: true, type: true } },
                        costCenter: { select: { name: true } }
                    },
                },
            },
            orderBy: { id: 'desc' },
            take: 200,
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error('Journal GET error:', error);
        return NextResponse.json({ error: 'فشل في جلب القيود' }, { status: 500 });
    }
}

// POST - إضافة قيد يدوي
export async function POST(request: Request) {
    // Auth guard
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request || req);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { description, reference, date, lines, userId } = body;

        if (!description || !lines || lines.length < 2) {
            return NextResponse.json({ error: 'الوصف وسطرين على الأقل مطلوبين' }, { status: 400 });
        }

        // Validate balance
        const totalDebit = lines.reduce((s: number, l: { debit: number }) => s + (l.debit || 0), 0);
        const totalCredit = lines.reduce((s: number, l: { credit: number }) => s + (l.credit || 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return NextResponse.json({ error: `القيد غير متوازن: مدين ${totalDebit} ≠ دائن ${totalCredit}` }, { status: 400 });
        }

        const result = await createJournalEntry({
            description,
            reference,
            date,
            lines: lines.map((l: { accountCode: string; costCenterId?: number; debit: number; credit: number; description?: string }) => ({
                accountCode: l.accountCode,
                costCenterId: l.costCenterId,
                debit: l.debit || 0,
                credit: l.credit || 0,
                description: l.description,
            })),
            userId,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, entryId: result.entryId }, { status: 201 });
    } catch (error) {
        console.error('Journal create error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء القيد' }, { status: 500 });
    }
}
