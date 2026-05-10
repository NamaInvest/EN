// @ts-nocheck
import { NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { YearEndCloseEngine } from "@/lib/year-end-engine";
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.year-end.runId.tasks.taskCode' });


const _POSTSchema = z.object({
  notes: z.any().optional(),
  fileId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request, { params }: { params: Promise<{ runId: string; taskCode: string }> }) {

  const { runId } = await params;
  try {
    const runId = parseInt(params.runId);
    const { taskCode } = params;
    const userId = "system-user";
    const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
