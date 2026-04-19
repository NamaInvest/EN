import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        
        if (!projectId) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });

        const tasks = await prisma.projectTask.findMany({
            where: { projectId: parseInt(projectId) },
            orderBy: { id: 'asc' },
        });

        // Calculate Project Total rollup
        const project = await prisma.project.findUnique({
            where: { id: parseInt(projectId) },
            include: { customer: { select: { name: true } } }
        });

        return NextResponse.json({ tasks, project });
    } catch (error: any) {
        console.error('Fetch Project Tasks Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects/tasks' });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();
        
        const task = await prisma.projectTask.create({
            data: {
                projectId: parseInt(data.projectId),
                name: data.taskName,
                description: data.description,
                cost: parseFloat(data.actualCost) || 0,
                status: data.status || 'PENDING'
            }
        });

        return NextResponse.json({ message: 'تم إضافة مهمة المشروع بنجاح', task });
    } catch (error: any) {
        console.error('Create Project Task Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects/tasks' });
    }
}

export async function PUT(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();
        
        if (!data.id) return NextResponse.json({ error: 'Task ID missing' }, { status: 400 });

        const updatedTask = await prisma.projectTask.update({
            where: { id: parseInt(data.id) },
            data: {
                cost: data.actualCost ? parseFloat(data.actualCost) : undefined,
                status: data.status,
                // assignedTo: data.assignedTo
            }
        });

        return NextResponse.json({ message: 'تم تحديث حالة/تكلفة المهمة', task: updatedTask });
    } catch (error: any) {
        console.error('Update Project Task Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects/tasks' });
    }
}

export async function DELETE(request: NextRequest) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request || req);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request as any);

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        await prisma.projectTask.delete({ where: { id: parseInt(id) } });

        return NextResponse.json({ message: 'تم الحذف' });
    } catch (error: any) {
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects/tasks' });
    }
}
