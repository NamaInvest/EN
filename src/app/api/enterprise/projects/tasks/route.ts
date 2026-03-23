import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        
        if (!projectId) return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });

        const tasks = await prisma.projectTask.findMany({
            where: { projectId: parseInt(projectId) },
            orderBy: { createdAt: 'asc' },
        });

        // Calculate Project Total rollup
        const project = await prisma.project.findUnique({
            where: { id: parseInt(projectId) },
            include: { customer: { select: { name: true } } }
        });

        return NextResponse.json({ tasks, project });
    } catch (error: any) {
        console.error('Fetch Project Tasks Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        
        const task = await prisma.projectTask.create({
            data: {
                projectId: parseInt(data.projectId),
                taskName: data.taskName,
                description: data.description,
                assignedTo: data.assignedTo,
                budget: parseFloat(data.budget) || 0,
                actualCost: parseFloat(data.actualCost) || 0,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                status: data.status || 'PENDING'
            }
        });

        return NextResponse.json({ message: 'تم إضافة مهمة المشروع بنجاح', task });
    } catch (error: any) {
        console.error('Create Project Task Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json();
        
        if (!data.id) return NextResponse.json({ error: 'Task ID missing' }, { status: 400 });

        const updatedTask = await prisma.projectTask.update({
            where: { id: parseInt(data.id) },
            data: {
                actualCost: data.actualCost ? parseFloat(data.actualCost) : undefined,
                status: data.status,
                assignedTo: data.assignedTo
            }
        });

        return NextResponse.json({ message: 'تم تحديث حالة/تكلفة المهمة', task: updatedTask });
    } catch (error: any) {
        console.error('Update Project Task Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        await prisma.projectTask.delete({ where: { id: parseInt(id) } });

        return NextResponse.json({ message: 'تم الحذف' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
