// @ts-nocheck
import { NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { OpenItemsEngine } from "@/lib/open-items";
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.open-items.disputes' });

async function _POST(req: Request) {

  try {
    const { openItemId, amount, reasonCode, description } = await req.json();
    const userId = "system-user";

    if (!openItemId || !amount || !reasonCode || !description) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const result = await OpenItemsEngine.markAsDisputed(openItemId, amount, reasonCode, description, userId);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
