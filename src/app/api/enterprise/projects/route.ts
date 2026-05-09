import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        
        const projects = await prisma.project.findMany({
            take: 100,
            where: {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { customer: { name: { contains: search, mode: 'insensitive' } } }
                ]
            },
            include: {
                customer: { select: { name: true } },
                tasks: true,
                _count: {
                    select: { tasks: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Compute advanced analytics on the fly
        const enrichedProjects = projects.map(p => {
            const consumedBudget = p.tasks.reduce((acc: number, t: any) => acc + n(t.cost), 0);
            const remainingBudget = n(p.budget) - consumedBudget;
            return {
                ...p,
                consumedBudget,
                remainingBudget,
                budgetHealth: consumedBudget > n(p.budget) ? 'danger' : (consumedBudget > n(p.budget) * 0.8 ? 'warning' : 'healthy')
            };
        });

        return NextResponse.json(enrichedProjects);
    } catch (error: any) {
        console.error('Projects Fetch Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects' });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  budget: z.any().optional(),
  description: z.any().optional(),
  customerId: z.union([z.string(), z.number()]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();

        const _parsed = _PUTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
        
        // Validation
        if (!data.name || !data.budget) {
            return NextResponse.json({ error: 'اسم المشروع والميزانية مطلوبان' }, { status: 400 });
        }

        const newProject = await prisma.project.create({
            data: {
                name: data.name,
                description: data.description,
                customerId: data.customerId ? parseInt(data.customerId) : null,
                budget: parseFloat(data.budget) || 0,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
                status: data.status || 'ACTIVE'
            }
        });

        return NextResponse.json({ message: 'تم إنشاء المشروع بنجاح', project: newProject });
    } catch (error: any) {
        console.error('Create Project Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects' });
    }
}

async function _DELETE(request: NextRequest) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request as any);

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'ID is missing' }, { status: 400 });

        await prisma.project.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'تم حذف المشروع بنجاح' });
    } catch (error: any) {
        console.error('Delete Project Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects' });
    }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();
        const { id, ...updateData } = data;

        if (!id) return NextResponse.json({ error: 'ID is missing' }, { status: 400 });

        // Update Project
        const updatedProject = await prisma.project.update({
            where: { id: parseInt(id) },
            data: {
                name: updateData.name,
                description: updateData.description,
                customerId: updateData.customerId ? parseInt(updateData.customerId) : null,
                budget: parseFloat(updateData.budget) || 0,
                status: updateData.status,
                startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
                endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
            }
        });

        return NextResponse.json({ message: 'تم تحديث المشروع بنجاح', project: updatedProject });
    } catch (error: any) {
        console.error('Update Project Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects' });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
