import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const ncrs = await prisma.nonConformanceReport.findMany({
            take: 100,
            include: {
                inspection: {
                    include: { product: true }
                },
                capas: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(ncrs);
    } catch (error: any) {
        console.error("CAPA GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch NCRs' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  inspectionId: z.union([z.string(), z.number()]).optional(),
  severity: z.any().optional(),
  description: z.any().optional(),
  dispositionType: z.any().optional(),
  costImpact: z.number().optional(),
  action: z.any().optional(),
  actionType: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
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
    } catch (error: any) {
        console.error("CAPA POST error:", error);
        return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
    }
}


const _PUTSchema = z.object({
  capaId: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
  effectivenessReview: z.any().optional(),
}).passthrough();

async function _PUT(request: Request) {
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
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update CAPA' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
