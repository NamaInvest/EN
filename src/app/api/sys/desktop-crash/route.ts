import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assuming standard location

export async function POST(req: Request) {

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
