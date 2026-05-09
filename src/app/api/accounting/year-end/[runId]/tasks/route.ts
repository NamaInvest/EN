// @ts-nocheck
import { NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { prisma } from "@/lib/prisma";

async function _GET(req: Request, { params }: { params: Promise<{ runId: string }> }) {

  const { runId } = await params;
  try {
    const runId = parseInt(params.runId);
    if (isNaN(runId)) {
      return NextResponse.json({ error: "Invalid runId" }, { status: 400 });
    }

    const tasks = await prisma.yearEndCloseTask.findMany({
            take: 100,
      where: { runId },
      orderBy: { sequenceNumber: "asc" },
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
