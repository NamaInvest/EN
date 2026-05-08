// @ts-nocheck
import { NextResponse } from "next/server";
import { YearEndCloseEngine } from "@/lib/year-end-engine";

export async function POST(req: Request) {

  try {
    const { fiscalYearId } = await req.json();
    const userId = "system-user"; // Replace with auth logic

    if (!fiscalYearId) {
      return NextResponse.json({ error: "fiscalYearId is required" }, { status: 400 });
    }

    const run = await YearEndCloseEngine.initiateRun(fiscalYearId, userId);
    return NextResponse.json({ success: true, run });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
