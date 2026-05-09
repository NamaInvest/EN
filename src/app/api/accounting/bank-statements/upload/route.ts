import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { BankStatementEngine } from '@/lib/bank-statement-engine';
import { z } from 'zod';


const _POSTSchema = z.object({
  bankAccountId: z.union([z.string(), z.number()]).optional(),
  fileName: z.any().optional(),
  fileContent: z.any().optional(),
  formatHint: z.any().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { bankAccountId, fileName, fileContent, formatHint, userId } = body;

        if (!bankAccountId || !fileContent) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await BankStatementEngine.processUpload(
            bankAccountId,
            fileName || 'uploaded-statement.txt',
            fileContent,
            formatHint,
            userId || 'system'
        );

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'UPLOAD' });
