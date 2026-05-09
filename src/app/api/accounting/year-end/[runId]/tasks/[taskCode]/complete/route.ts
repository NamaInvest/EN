// @ts-nocheck
import { NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { YearEndCloseEngine } from "@/lib/year-end-engine";

async function _POST(req: Request, { params }: { params: Promise<{ runId: string; taskCode: string }> }) {

  const { runId } = await params;
  try {
    const runId = parseInt(params.runId);
    const { taskCode } = params;
    const userId = "system-user";
    const body = await req.json();
    const { notes, fileId } = body;

    if (isNaN(runId) || !taskCode) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await YearEndCloseEngine.completeManualTask(runId, taskCode, userId, notes, fileId);
    return NextResponse.json({ success: true, message: `Task ${taskCode} completed successfully` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'FINANCIAL' });
