import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const jobs = await prisma.jobPosting.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                applicants: true
            }
        });
        return NextResponse.json({ success: true, data: jobs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();
        const { action, payload } = body;

        if (action === 'CREATE_JOB') {
            const newJob = await prisma.jobPosting.create({
                data: {
                    title: payload.title,
                    department: payload.department,
                    description: payload.description,
                    requirements: payload.requirements,
                    status: 'OPEN'
                }
            });
            return NextResponse.json({ success: true, data: newJob });
        }

        if (action === 'ADD_APPLICANT') {
            const app = await prisma.jobApplicant.create({
                data: {
                    jobPostingId: Number(payload.jobPostingId),
                    name: payload.name,
                    email: payload.email,
                    phone: payload.phone,
                    resumeUrl: payload.resumeUrl,
                    status: 'APPLIED'
                }
            });
            return NextResponse.json({ success: true, data: app });
        }

        if (action === 'UPDATE_APPLICANT_STATUS') {
            const updated = await prisma.jobApplicant.update({
                where: { id: Number(payload.applicantId) },
                data: { status: payload.status }
            });
            return NextResponse.json({ success: true, data: updated });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
