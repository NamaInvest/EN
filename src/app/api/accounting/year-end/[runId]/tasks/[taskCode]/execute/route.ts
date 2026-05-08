// @ts-nocheck
import { NextResponse } from "next/server";
import { YearEndCloseEngine } from "@/lib/year-end-engine";

export async function POST(req: Request, { params }: { params: Promise<{ runId: string; taskCode: string }> }) {

  const { runId } = await params;
  try {
    const runId = parseInt(params.runId);
    const { taskCode } = params;
    const userId = "system-user";

    if (isNaN(runId) || !taskCode) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await YearEndCloseEngine.executeAutoTask(runId, taskCode, userId);
    return NextResponse.json({ success: true, message: `Task ${taskCode} executed successfully` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
