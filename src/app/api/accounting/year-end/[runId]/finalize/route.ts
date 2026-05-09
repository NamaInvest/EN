// @ts-nocheck
import { NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { YearEndCloseEngine } from "@/lib/year-end-engine";

async function _POST(req: Request, { params }: { params: Promise<{ runId: string }> }) {

  const { runId } = await params;
  try {
    const runId = parseInt(params.runId);
    const userId = "system-user";

    if (isNaN(runId)) {
      return NextResponse.json({ error: "Invalid runId" }, { status: 400 });
    }

    const result = await YearEndCloseEngine.finalizeClose(runId, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'FINANCIAL' });
