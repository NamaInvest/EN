// @ts-nocheck
import { NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { YearEndCloseEngine } from "@/lib/year-end-engine";
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.year-end.initiate' });

async function _POST(req: Request) {

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

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
