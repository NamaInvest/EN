import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || 'all';

    try {
        const query = role === 'all' ? {} : { where: { role } };
        const courses = await prisma.trainingVideo.findMany(query);

        return NextResponse.json(courses);
    } catch (error) {
        console.error('Failed to fetch courses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
