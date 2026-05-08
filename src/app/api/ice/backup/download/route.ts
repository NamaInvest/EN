import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {

  try {
    const { searchParams } = new URL(req.url);
    const licenseKey = searchParams.get('license_key');
    const backupId = searchParams.get('id');

    if (!licenseKey && !backupId) {
      return NextResponse.json(
        { success: false, message: 'license_key or id required' },
        { status: 400 }
      );
    }

    let backup: any;

    if (backupId) {
      const results = await prisma.$queryRawUnsafe(
        `SELECT * FROM desktop_backups WHERE id = $1 LIMIT 1`,
        parseInt(backupId)
      ) as any[];
      backup = results[0];
    } else {
      // Get latest backup for this license
      const _results_dup30 = await prisma.$queryRawUnsafe(
        `SELECT * FROM desktop_backups WHERE license_key = $1 ORDER BY created_at DESC LIMIT 1`,
        licenseKey
      ) as any[];
      // @ts-expect-error [TS2304] Cannot find name
      backup = results[0];
    }

    if (!backup) {
      return NextResponse.json(
        { success: false, message: 'No backup found' },
        { status: 404 }
      );
    }

    // Check file exists
    if (!fs.existsSync(backup.file_path)) {
      return NextResponse.json(
        { success: false, message: 'Backup file missing from storage' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(backup.file_path);
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${backup.filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (err: any) {
    console.error('Backup download error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
