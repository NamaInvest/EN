import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';


const _POSTSchema = z.object({
  to: z.any().optional(),
  subject: z.any().optional(),
  body: z.any().optional(),
  attachPdf: z.any().optional(),
  customerId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { to, subject, body: emailBody, attachPdf, customerId } = body;

        if (!to) {
            return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
        }

        // Mock SendGrid dispatch
        console.log(`Sending email to ${to} with subject: ${subject}`);

        // Mock log entry update
        return NextResponse.json({
            message: 'Email dispatched successfully',
            status: 'SENT',
            messageId: `msg_${Date.now()}`
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
