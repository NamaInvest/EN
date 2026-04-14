import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiError } from '@/lib/api-error';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        
        const projects = await prisma.project.findMany({
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
            const consumedBudget = p.tasks.reduce((acc, t) => acc + t.cost, 0);
            const remainingBudget = p.budget - consumedBudget;
            return {
                ...p,
                consumedBudget,
                remainingBudget,
                budgetHealth: consumedBudget > p.budget ? 'danger' : (consumedBudget > p.budget * 0.8 ? 'warning' : 'healthy')
            };
        });

        return NextResponse.json(enrichedProjects);
    } catch (error: any) {
        console.error('Projects Fetch Error:', error);
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'enterprise/projects' });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        
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

export async function DELETE(request: Request) {
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

export async function PUT(request: Request) {
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
