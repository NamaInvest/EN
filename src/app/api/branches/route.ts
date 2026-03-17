import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
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
        const mapped = branches.map(b => ({
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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, address, phone } = body;

        if (!name) {
            return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
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
                companyId: company.id
            }
        });

        return NextResponse.json(branch, { status: 201 });
    } catch (error: any) {
        console.error('Error creating branch:', error);
        return NextResponse.json({ error: error?.message || 'Failed to create branch' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
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

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Check for related data
        const related = await prisma.branch.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: { users: true, stocks: true, shifts: true, salesInvoices: true }
                }
            }
        });

        if (related && (related._count.users > 0 || related._count.salesInvoices > 0 || related._count.stocks > 0 || related._count.shifts > 0)) {
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
