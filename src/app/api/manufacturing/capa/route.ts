import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const ncrs = await prisma.nonConformanceReport.findMany({
            include: {
                inspection: {
                    include: { product: true }
                },
                capas: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(ncrs);
    } catch (error) {
        console.error("CAPA GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch NCRs' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { inspectionId, severity, description, dispositionType, costImpact, action, actionType } = body;

        // actionType: 'CREATE_NCR' or 'CREATE_CAPA'
        
        if (actionType === 'CREATE_NCR') {
            const ncr = await prisma.nonConformanceReport.create({
                data: {
                    inspectionId: parseInt(inspectionId),
                    severity,
                    description,
                    dispositionType,
                    costImpact: parseFloat(costImpact) || 0,
                }
            });
            return NextResponse.json({ message: 'تم إنشاء تقرير عدم المطابقة (NCR)', data: ncr });
        }
        
        if (actionType === 'CREATE_CAPA') {
            const { ncrId, rootCause, correctiveAction, owner, dueDate } = body;
            const capa = await prisma.correctiveAction.create({
                data: {
                    ncrId: parseInt(ncrId),
                    rootCause,
                    action: correctiveAction,
                    owner,
                    dueDate: new Date(dueDate),
                    status: 'OPEN'
                }
            });
            return NextResponse.json({ message: 'تم فتح خطة تصحيحية (CAPA) بنجاح', data: capa });
        }

        return NextResponse.json({ error: 'Invalid actionType' }, { status: 400 });
    } catch (error) {
        console.error("CAPA POST error:", error);
        return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { capaId, status, effectivenessReview } = body;

        const capa = await prisma.correctiveAction.update({
            where: { id: parseInt(capaId) },
            data: { 
                status, 
                effectivenessReview,
                ...(status === 'CLOSED' ? { effectivenessReview: effectivenessReview || 'تم الإغلاق والتحقق' } : {})
            }
        });

        return NextResponse.json({ message: 'تم تحديث حالة الـ CAPA', data: capa });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update CAPA' }, { status: 500 });
    }
}
