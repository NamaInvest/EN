import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        const testRun = await prisma.testRun.create({
            data: {
                testName: body.testName,
                status: body.status,
                duration: body.duration,
                storyId: body.storyId,
            }
        });

        return NextResponse.json(testRun, { status: 201 });
    } catch (error) {
        console.error('Failed to create test run:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const testRuns = await prisma.testRun.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        return NextResponse.json(testRuns);
    } catch (error) {
        console.error('Failed to fetch test runs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
