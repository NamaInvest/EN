import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma'; // Assuming standard location
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sys.desktop-crash' });


const _POSTSchema = z.object({
  osPlatform: z.any().optional(),
  osRelease: z.any().optional(),
  appVersion: z.any().optional(),
  errorMessage: z.any().optional(),
  stackTrace: z.any().optional(),
  tenantInfo: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

  try {
    const data = await req.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

    const report = await prisma.desktopCrashReport.create({
      data: {
        osPlatform: data.osPlatform || 'Unknown',
        osRelease: data.osRelease || 'Unknown',
        appVersion: data.appVersion || 'Unknown',
        errorMessage: data.errorMessage || 'No error message provided',
        stackTrace: data.stackTrace || '',
        tenantInfo: data.tenantInfo || '',
        notes: data.notes || '',
      },
    });

    return NextResponse.json({ success: true, id: report.id });
  } catch (error: any) {
    log.error('Failed to log desktop crash:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process crash report' },
      { status: 500 }
    );
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
