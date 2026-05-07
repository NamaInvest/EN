/**
 * Qiwa Contracts API
 * GET  /api/saudi/qiwa/contracts/[employeeId] — Get employee contracts
 * POST /api/saudi/qiwa/contracts/[employeeId] — Create/sync contract
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getEmployeeContracts } from '@/lib/qiwa-engine';

const db = (p: any) => p as any;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ employeeId: string }> }
) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { employeeId } = await params;
    const prisma = getPrisma(req);

    try {
        const contracts = await getEmployeeContracts(prisma, parseInt(employeeId));
        return NextResponse.json(contracts);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ employeeId: string }> }
) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { employeeId } = await params;
    const prisma = getPrisma(req);

    try {
        const body = await req.json();
        if (!body.contractNo || !body.contractType || !body.startDate) {
            return NextResponse.json({ error: 'مطلوب: contractNo, contractType, startDate' }, { status: 400 });
        }

        const contract = await db(prisma).qiwaContract.create({
            data: {
                employeeId: parseInt(employeeId),
                contractNo: body.contractNo,
                contractType: body.contractType,
                qiwaStatus: body.qiwaStatus || 'ACTIVE',
                startDate: new Date(body.startDate),
                endDate: body.endDate ? new Date(body.endDate) : null,
                position: body.position || null,
                wageAmount: body.wageAmount || null,
            },
        });
        return NextResponse.json(contract, { status: 201 });
    } catch (e: any) {
        if (e.code === 'P2002') return NextResponse.json({ error: 'رقم العقد مستخدم مسبقاً' }, { status: 409 });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
