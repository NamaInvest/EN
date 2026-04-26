import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { encrypt, decrypt, maskSensitive } from '@/lib/encryption';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
        const employees = await prisma.employee.findMany({ 
            where, 
            include: { branch: true },
            orderBy: { id: 'desc' } 
        });
        // فك تشفير IBAN للعرض (مع القناع)
        const result = employees.map((emp: any) => ({
            ...emp,
            iban: emp.iban ? maskSensitive(decrypt(emp.iban), 4, 4) : null,
            ibanFull: emp.iban ? decrypt(emp.iban) : null,
        }));
        return NextResponse.json(result);
    } catch (error) { console.error(error); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    // Auth guard
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request || req);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        body.salary = typeof body.salary === 'string' ? body.salary.replace(/,/g, '') : body.salary;
        const employee = await prisma.employee.create({
            data: { 
                name: body.name, 
                phone: body.phone || null, 
                position: body.position || null, 
                salary: parseFloat(body.salary) || 0, 
                housingAllowance: parseFloat(body.housingAllowance) || 0,
                transportAllowance: parseFloat(body.transportAllowance) || 0,
                otherAllowance: parseFloat(body.otherAllowance) || 0,
                bankName: body.bankName || null,
                iban: body.iban ? encrypt(body.iban) : null,
                startDate: body.startDate || null,
                branchId: body.branchId ? parseInt(body.branchId) : null 
            },
        });
        return NextResponse.json(employee, { status: 201 });
    } catch (error) { console.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

// Update Employee Biometrics (Face Descriptor)
export async function PUT(request: Request) {
    // Auth guard
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request || req);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        if (!body.employeeId || !body.faceDescriptor) {
            return NextResponse.json({ error: 'Missing employeeId or faceDescriptor' }, { status: 400 });
        }
        
        const updated = await prisma.employee.update({
            where: { id: parseInt(body.employeeId) },
            data: { faceDescriptor: body.faceDescriptor }
        });
        
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Face registration error:", error);
        return NextResponse.json({ error: 'Failed to save biometric data' }, { status: 500 });
    }
}
