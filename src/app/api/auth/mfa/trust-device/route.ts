// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { MfaEngine } from '@/lib/mfa-engine';
import { z } from 'zod';


const _POSTSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
  code: z.any().optional(),
  deviceName: z.any().optional(),
  days: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { userId, code, deviceName, days } = body;
        if (!userId || !code || !deviceName) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        const requestInfo = {
            ipAddress: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
            browser: req.headers.get('sec-ch-ua') || 'unknown',
            os: req.headers.get('sec-ch-ua-platform') || 'unknown'
        };

        // Require MFA verification before trusting the device
        await MfaEngine.verify(userId, code, 'totp', requestInfo);

        const trustedDevice = await MfaEngine.trustDevice(userId, deviceName, days || 30, requestInfo);
        
        return NextResponse.json({ success: true, trustedDevice });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 401 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
