import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const branches = await prisma.branch.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        stocks: true,
                        shifts: true,
                        salesInvoices: true,
                    }
                }
            },
            orderBy: { id: 'asc' }
        });
        // We will map salesInvoices to invoices so the UI doesn't break
        const mapped = branches.map((b: any) => ({
            ...b,
            _count: {
                users: b._count.users,
                stocks: b._count.stocks,
                shifts: b._count.shifts,
                invoices: b._count.salesInvoices
            }
        }));
        return NextResponse.json(mapped);
    } catch (error) {
        console.error('Error fetching branches:', error);
        return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const body = await request.json();
        const { name, address, phone } = body;

        if (!name) {
            return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
        }

        // Check branch limit: max 2 branches, requires Professional plan
        const branchCount = await prisma.branch.count();
        if (branchCount >= 2) {
            return NextResponse.json({ error: 'الحد الأقصى للفروع هو فرعين. يرجى الترقية إلى باقة Enterprise للمزيد.' }, { status: 403 });
        }
        if (branchCount >= 1) {
            // Need Professional plan to add 2nd branch
            try {
                const { Pool } = require('pg');
                const masterPool = new Pool({
                    connectionString: process.env.MASTER_DB_URL || 'postgresql://n11_db:n11_pass123@localhost:5432/n11_db',
                    max: 1,
                });
                const host = request.headers.get('host') || '';
                const subdomain = host.split('.')[0];
                const { rows } = await masterPool.query(
                    `SELECT plan FROM tenant_accounts WHERE subdomain = $1`, [subdomain]
                );
                await masterPool.end();
                const plan = rows[0]?.plan || 'free';
                if (!['professional', 'enterprise'].includes(plan)) {
                    return NextResponse.json({ error: 'إضافة فرع جديد تتطلب الباقة الاحترافية (Professional) أو أعلى.' }, { status: 403 });
                }
            } catch (e) {
                console.error('[Branches] Plan check error:', e);
            }
        }

        // We MUST have a company to link the branch to
        let company = await prisma.company.findFirst();
        if (!company) {
            company = await prisma.company.create({
                data: { name: 'الشركة الرئيسية' }
            });
        }

        const branch = await prisma.branch.create({
            data: {
                name,
                address: address || '',
                phone: phone || '',
                companyId: company.id,
                stocks: {
                    create: {
                        name: 'مستودع ' + name,
                        active: true
                    }
                }
            },
            include: {
                stocks: true
            }
        });

        return NextResponse.json(branch, { status: 201 });
    } catch (error: any) {
        console.error('Error creating branch:', error);
        return NextResponse.json({ error: error?.message || 'Failed to create branch' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const body = await request.json();
        const { id, name, address, phone, isActive } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const branch = await prisma.branch.update({
            where: { id: parseInt(id.toString()) },
            data: {
                name,
                address: address || '',
                phone: phone || '',
                isActive: isActive !== undefined ? isActive : true,
            }
        });

        return NextResponse.json(branch);
    } catch (error: any) {
        console.error('Error updating branch:', error);
        return NextResponse.json({ error: error?.message || 'Failed to update branch' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const prisma = getPrisma(request as any);

    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Prevent deleting the first branch
        const branch = await prisma.branch.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: { users: true, stocks: true, shifts: true, salesInvoices: true }
                }
            }
        });

        if (!branch) return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 });

        // Don't allow deleting the first/only branch
        const branchCount = await prisma.branch.count();
        if (branchCount <= 1) {
            return NextResponse.json({ error: 'لا يمكن حذف الفرع الرئيسي.' }, { status: 400 });
        }

        if (branch._count.users > 0 || branch._count.salesInvoices > 0 || branch._count.stocks > 0 || branch._count.shifts > 0) {
            return NextResponse.json({ error: 'لا يمكن حذف الفرع لارتباطه بمستخدمين، فواتير، أو مخزون.' }, { status: 400 });
        }

        await prisma.branch.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'Branch deleted successfully' });
    } catch (error) {
        console.error('Error deleting branch:', error);
        return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
    }
}
