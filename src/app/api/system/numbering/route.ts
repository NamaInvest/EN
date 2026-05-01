import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { peekNextNumber, resetSequence, NUMBERING_DEFAULTS } from '@/lib/numbering';

// GET /api/system/numbering — قائمة كل التكوينات
// GET /api/system/numbering?code=WO&branchId=1 — تكوين محدد
// GET /api/system/numbering?peek=WO — معاينة الرقم التالي بدون استهلاك
export async function GET(request: Request) {
    const prisma = getPrisma(request);
    const user = getUserFromRequest(request as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const peekCode = searchParams.get('peek');

        if (peekCode) {
            const branchId = searchParams.get('branchId') ? parseInt(searchParams.get('branchId')!) : null;
            const next = await peekNextNumber(prisma, peekCode, { branchId });
            return NextResponse.json({ code: peekCode, next });
        }

        const code = searchParams.get('code');
        const where: Record<string, unknown> = {};
        if (code) where.code = code;
        if (searchParams.get('branchId')) where.branchId = parseInt(searchParams.get('branchId')!);

        const sequences = await prisma.numberingSequence.findMany({
            where,
            orderBy: [{ code: 'asc' }, { fiscalYear: 'desc' }, { fiscalMonth: 'desc' }],
        });

        return NextResponse.json({
            sequences: sequences.map((s: { current: bigint } & Record<string, unknown>) => ({
                ...s,
                current: s.current.toString(),
            })),
            availableDefaults: NUMBERING_DEFAULTS,
        });
    } catch (error: any) {
        console.error('Numbering GET error:', error);
        return NextResponse.json({ error: error.message || 'فشل جلب التكوينات' }, { status: 500 });
    }
}

// POST /api/system/numbering — إنشاء/تحديث تكوين سلسلة
// body: { code, prefix?, suffix?, padLength?, resetFrequency?, branchId?, isActive?, name? }
export async function POST(request: Request) {
    const prisma = getPrisma(request);
    const user = getUserFromRequest(request as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'صلاحية المسؤول مطلوبة' }, { status: 403 });

    try {
        const body = await request.json();
        const { code, prefix, suffix, padLength, resetFrequency, branchId, isActive, name } = body;

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ error: 'حقل code مطلوب' }, { status: 400 });
        }
        if (resetFrequency && !['never', 'yearly', 'monthly'].includes(resetFrequency)) {
            return NextResponse.json({ error: 'resetFrequency يجب أن يكون never أو yearly أو monthly' }, { status: 400 });
        }

        // التكوين السلسلة "الرئيسي" هو السطر بدون fiscalYear/fiscalMonth (يُستخدم كقالب)
        const existing = await prisma.numberingSequence.findFirst({
            where: { code, branchId: branchId ?? null, fiscalYear: null, fiscalMonth: null },
        });

        const data = {
            code,
            name: name ?? null,
            prefix: prefix ?? `${code}-`,
            suffix: suffix ?? '',
            padLength: padLength ?? 6,
            resetFrequency: resetFrequency ?? 'never',
            branchId: branchId ?? null,
            isActive: isActive ?? true,
        };

        const result = existing
            ? await prisma.numberingSequence.update({ where: { id: existing.id }, data })
            : await prisma.numberingSequence.create({ data: { ...data, current: BigInt(0) } });

        return NextResponse.json({ success: true, sequence: { ...result, current: result.current.toString() } });
    } catch (error: any) {
        console.error('Numbering POST error:', error);
        return NextResponse.json({ error: error.message || 'فشل حفظ التكوين' }, { status: 500 });
    }
}

// DELETE /api/system/numbering?id=123 — تعطيل سلسلة (soft delete)
export async function DELETE(request: Request) {
    const prisma = getPrisma(request);
    const user = getUserFromRequest(request as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'صلاحية المسؤول مطلوبة' }, { status: 403 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

        await prisma.numberingSequence.update({
            where: { id: parseInt(id) },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Numbering DELETE error:', error);
        return NextResponse.json({ error: error.message || 'فشل التعطيل' }, { status: 500 });
    }
}

// PATCH /api/system/numbering?action=reset&code=WO&branchId=1
export async function PATCH(request: Request) {
    const prisma = getPrisma(request);
    const user = getUserFromRequest(request as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'صلاحية المسؤول مطلوبة' }, { status: 403 });

    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        if (action !== 'reset') return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });

        const code = searchParams.get('code');
        if (!code) return NextResponse.json({ error: 'code مطلوب' }, { status: 400 });

        const branchId = searchParams.get('branchId') ? parseInt(searchParams.get('branchId')!) : null;
        const fiscalYear = searchParams.get('fiscalYear') ? parseInt(searchParams.get('fiscalYear')!) : null;
        const fiscalMonth = searchParams.get('fiscalMonth') ? parseInt(searchParams.get('fiscalMonth')!) : null;

        await resetSequence(prisma, code, branchId, fiscalYear, fiscalMonth);
        return NextResponse.json({ success: true, message: `تم إعادة تعيين سلسلة ${code}` });
    } catch (error: any) {
        console.error('Numbering PATCH error:', error);
        return NextResponse.json({ error: error.message || 'فشل التنفيذ' }, { status: 500 });
    }
}
