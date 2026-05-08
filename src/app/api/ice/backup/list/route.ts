import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {

  try {
    const { searchParams } = new URL(req.url);
    const licenseKey = searchParams.get('license_key');

    if (!licenseKey) {
      return NextResponse.json(
        { success: false, message: 'license_key required' },
        { status: 400 }
      );
    }

    // Ensure table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS desktop_backups (
        id SERIAL PRIMARY KEY,
        license_key VARCHAR(20) NOT NULL,
        hardware_id VARCHAR(255),
        filename VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const backups = await prisma.$queryRawUnsafe(
      `SELECT id, license_key, filename, file_size, created_at 
       FROM desktop_backups 
       WHERE license_key = $1 
       ORDER BY created_at DESC`,
      licenseKey
    ) as any[];

    return NextResponse.json({
      success: true,
      backups: backups.map((b: any) => ({
        id: b.id,
        filename: b.filename,
        size: Number(b.file_size),
        sizeFormatted: formatSize(Number(b.file_size)),
        createdAt: b.created_at,
      })),
    });

  } catch (err: any) {
    console.error('Backup list error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
