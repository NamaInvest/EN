import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const prompts = await prisma.promptTemplate.findMany({
            take: 100,
            orderBy: [{ key: 'asc' }, { version: 'desc' }]
        });
        
        return NextResponse.json(prompts);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        
        // Find latest version
        const latest = await prisma.promptTemplate.findFirst({
            where: { key: data.key, tenantId: data.tenantId || null },
            orderBy: { version: 'desc' }
        });

        const newVersion = (latest?.version || 0) + 1;

        const newPrompt = await prisma.promptTemplate.create({
            data: {
                key: data.key,
                tenantId: data.tenantId || null,
                version: newVersion,
                systemPrompt: data.systemPrompt,
                userTemplate: data.userTemplate,
                modelHint: data.modelHint || 'gemini-2.5-flash',
                createdBy: auth.userId.toString()
            }
        });

        return NextResponse.json(newPrompt);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
