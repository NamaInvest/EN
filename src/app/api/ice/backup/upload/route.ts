import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const MAX_BACKUPS_PER_LICENSE = 3;
const BACKUP_DIR = process.env.BACKUP_STORAGE_PATH || '/tmp/nama-backups';

export async function POST(req: NextRequest) {

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const licenseKey = formData.get('license_key') as string | null;
    const hardwareId = formData.get('hardware_id') as string | null;

    if (!file || !licenseKey) {
      return NextResponse.json(
        { success: false, message: 'file and license_key are required' },
        { status: 400 }
      );
    }

    // Verify license exists
    const license = await prisma.$queryRawUnsafe(
      `SELECT id, company_name_ar FROM desktop_licenses WHERE license_key = $1 LIMIT 1`,
      licenseKey
    ) as any[];

    if (license.length === 0) {
      return NextResponse.json(
        { success: false, message: 'License not found' },
        { status: 404 }
      );
    }

    // Ensure backup directory exists
    const licenseDir = path.join(BACKUP_DIR, licenseKey.replace(/[^A-Z0-9-]/gi, ''));
    fs.mkdirSync(licenseDir, { recursive: true });

    // Save file
    const timestamp = Date.now();
    const filename = `backup_${timestamp}.sql.gz`;
    const filePath = path.join(licenseDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

    // Create backups table if not exists
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

    // Insert backup record
    await prisma.$executeRawUnsafe(
      `INSERT INTO desktop_backups (license_key, hardware_id, filename, file_path, file_size)
       VALUES ($1, $2, $3, $4, $5)`,
      licenseKey, hardwareId || null, filename, filePath, file.size
    );

    // Update license with last backup info
    await prisma.$executeRawUnsafe(
      `UPDATE desktop_licenses SET last_verified_at = NOW(), updated_at = NOW() WHERE license_key = $1`,
      licenseKey
    );

    // Cleanup: keep only last N backups
    const allBackups = await prisma.$queryRawUnsafe(
      `SELECT id, file_path FROM desktop_backups WHERE license_key = $1 ORDER BY created_at DESC`,
      licenseKey
    ) as any[];

    if (allBackups.length > MAX_BACKUPS_PER_LICENSE) {
      const toDelete = allBackups.slice(MAX_BACKUPS_PER_LICENSE);
      for (const old of toDelete) {
        try { fs.unlinkSync(old.file_path); } catch {}
        await prisma.$executeRawUnsafe(`DELETE FROM desktop_backups WHERE id = $1`, old.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم رفع النسخة الاحتياطية بنجاح',
      backup_id: timestamp,
      file_size: file.size,
    });

  } catch (err: any) {
    console.error('Backup upload error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
