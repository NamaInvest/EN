import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// Auth mock

export async function GET(req: Request) {
    try {
        // In a real app, you'd get the user from session:
        // const session = await getServerSession(authOptions);
        // const userId = session?.user?.id;
        
        // For demonstration, we'll fetch all pending requests (or you can filter by approverId)
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'pending';
        
        const requests = await prisma.approvalRequest.findMany({
            where: {
                status: status,
                // In reality: steps: { some: { approverId: userId, status: 'pending' } }
            },
            include: {
                requester: { select: { id: true, fullName: true, username: true } },
                steps: true
            },
            orderBy: { requestedAt: 'desc' }
        });

        return NextResponse.json(requests);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
