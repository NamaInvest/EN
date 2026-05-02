import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const batches = await prisma.wPSBatch.findMany({
            include: {
                payrollRun: { select: { year: true, month: true } }
            },
            orderBy: { id: 'desc' }
        });

        const acceptedCount = batches.filter(b => b.status === 'ACCEPTED').length;
        const pendingCount = batches.filter(b => b.status === 'GENERATED' || b.status === 'PENDING').length;

        return NextResponse.json({
            batches,
            summary: {
                totalBatches: batches.length,
                acceptedCount,
                pendingCount,
                ibanErrors: batches.filter(b => b.status === 'REJECTED').length,
            }
        });
    } catch (error) {
        console.error('WPS GET error:', error);
        return NextResponse.json({ error: 'فشل جلب ملفات حماية الأجور' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const body = await request.json();
        const { payrollRunId, bankCode } = body;

        if (!payrollRunId || !bankCode) {
            return NextResponse.json({ error: 'يجب تحديد مسير الرواتب والبنك' }, { status: 400 });
        }

        const payrollRun = await prisma.payrollRun.findUnique({
            where: { id: payrollRunId },
            include: { items: { include: { employee: true } } }
        });

        if (!payrollRun) return NextResponse.json({ error: 'مسير الرواتب غير موجود' }, { status: 404 });

        const totalAmount = payrollRun.items.reduce((sum, item) => sum + Number(item.netSalary), 0);
        
        // Generate SIF Content Mock
        const sifContent = `1,${payrollRun.year}${String(payrollRun.month).padStart(2,'0')}01,${payrollRun.items.length},${totalAmount}\n` +
                           payrollRun.items.map(i => `${i.employee.id},${i.employee.name},${i.netSalary}`).join('\n');

        const batch = await prisma.wPSBatch.create({
            data: {
                payrollRunId,
                bankCode,
                batchNumber: `WPS-${payrollRun.year}-${String(payrollRun.month).padStart(2,'0')}-${Math.floor(Math.random() * 10000)}`,
                totalAmount,
                totalEmployees: payrollRun.items.length,
                fileFormat: 'SIF_V2',
                fileContent: sifContent,
                fileGeneratedAt: new Date(),
                status: 'GENERATED'
            }
        });

        return NextResponse.json({ success: true, batch });
    } catch (error: any) {
        console.error('WPS POST error:', error);
        return NextResponse.json({ error: error.message || 'فشل توليد ملف SIF' }, { status: 500 });
    }
}
