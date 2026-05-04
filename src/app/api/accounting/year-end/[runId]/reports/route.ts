// @ts-nocheck
import { NextResponse } from "next/server";
import { YearEndCloseEngine } from "@/lib/year-end-engine";

export async function POST(req: Request, { params }: { params: { runId: string } }) {
  try {
    const runId = parseInt(params.runId);
    const userId = "system-user";

    if (isNaN(runId)) {
      return NextResponse.json({ error: "Invalid runId" }, { status: 400 });
    }

    await YearEndCloseEngine.generateImmutableReports(runId, userId);
    return NextResponse.json({ success: true, message: "Reports generated and signed successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
