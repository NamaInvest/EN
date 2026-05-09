import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma'; // Assuming standard location

async function _POST(req: Request) {

  try {
    const data = await req.json();

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
    console.error('Failed to log desktop crash:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process crash report' },
      { status: 500 }
    );
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
