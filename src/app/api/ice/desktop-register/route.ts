import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Generate license key: XXXX-XXXX-XXXX-XXXX
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments: string[] = [];
  for (let s = 0; s < 4; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars[crypto.randomInt(chars.length)];
    }
    segments.push(seg);
  }
  return segments.join('-');
}

function toSlug(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
}

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS desktop_licenses (
      id SERIAL PRIMARY KEY,
      license_key VARCHAR(20) UNIQUE NOT NULL,
      hardware_id VARCHAR(255),
      company_name_ar VARCHAR(255) NOT NULL,
      company_name_en VARCHAR(255),
      business_domain VARCHAR(100),
      mobile VARCHAR(20),
      vat_number VARCHAR(20),
      crn_number VARCHAR(20),
      city VARCHAR(100),
      city_en VARCHAR(100),
      district VARCHAR(100),
      street_name VARCHAR(255),
      building_no VARCHAR(10),
      postal_code VARCHAR(10),
      subdomain VARCHAR(100) UNIQUE,
      status VARCHAR(20) DEFAULT 'trial',
      app_version VARCHAR(20),
      max_devices INTEGER DEFAULT 1,
      activated_devices INTEGER DEFAULT 0,
      trial_ends_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      activated_at TIMESTAMPTZ,
      last_verified_at TIMESTAMPTZ,
      device_name VARCHAR(255),
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE desktop_licenses ADD COLUMN IF NOT EXISTS device_name VARCHAR(255)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE desktop_licenses ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100) UNIQUE`);
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyNameAr, companyNameEn, businessDomain,
      mobile, vatNumber, crnNumber,
      city, cityEn, district, streetName, buildingNo, postalCode,
      hardwareId, deviceName, appVersion,
    } = body;

    if (!companyNameAr?.trim()) {
      return NextResponse.json({ success: false, message: 'اسم الشركة بالعربية مطلوب' }, { status: 400 });
    }

    // ── Sync mode: if client sends an existing licenseKey, verify or re-create it ──
    const existingLicenseKey = body.licenseKey || body.license_key;
    if (existingLicenseKey) {
      // Ensure table exists
      await ensureTable();

      const found = await prisma.$queryRawUnsafe(
        `SELECT id, license_key, status, expires_at, trial_ends_at, subdomain FROM desktop_licenses WHERE license_key = $1 LIMIT 1`,
        existingLicenseKey
      ) as any[];

      if (found.length > 0) {
        // License exists — just update heartbeat and company data
        await prisma.$executeRawUnsafe(
          `UPDATE desktop_licenses SET 
            last_verified_at = NOW(), updated_at = NOW(),
            hardware_id = COALESCE($2, hardware_id),
            device_name = COALESCE($3, device_name),
            app_version = COALESCE($4, app_version)
           WHERE license_key = $1`,
          existingLicenseKey, hardwareId || null, deviceName || null, appVersion || null
        );
        return NextResponse.json({
          success: true,
          license_key: found[0].license_key,
          status: found[0].status,
          expires_at: found[0].expires_at,
          trial_ends_at: found[0].trial_ends_at,
          subdomain: found[0].subdomain,
          message: 'تم المزامنة بنجاح',
          synced: true,
        });
      } else {
        // License was deleted from cloud — re-create it with the same key
        const trialDays = 7;
        await prisma.$executeRawUnsafe(`
          INSERT INTO desktop_licenses 
            (license_key, hardware_id, device_name, company_name_ar, company_name_en, business_domain,
             mobile, vat_number, crn_number, city, city_en, district, street_name,
             building_no, postal_code, status, app_version, trial_ends_at, last_verified_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'trial', $16, NOW() + INTERVAL '${trialDays} days', NOW())
        `,
          existingLicenseKey, hardwareId || null, deviceName || null,
          companyNameAr, companyNameEn || null, businessDomain || null,
          mobile || null, vatNumber || null, crnNumber || null,
          city || null, cityEn || null, district || null, streetName || null,
          buildingNo || null, postalCode || null, appVersion || '1.0.0'
        );
        return NextResponse.json({
          success: true,
          license_key: existingLicenseKey,
          status: 'trial',
          trial_days: trialDays,
          message: 'تم إعادة تسجيل الترخيص بنجاح',
          re_registered: true,
        });
      }
    }

    let subdomain = body.subdomain || '';
    if (!subdomain && companyNameEn) {
      subdomain = toSlug(companyNameEn);
    }
    if (!subdomain) {
      subdomain = 'dsk';
    }
    subdomain = subdomain + '-' + Math.floor(Math.random() * 100000);

    // ── Normal registration (first time — no existing key) ──
    // Check if this hardware already registered
    if (hardwareId) {
      const existing = await prisma.$queryRawUnsafe(
        `SELECT id, license_key, status FROM desktop_licenses WHERE hardware_id = $1 LIMIT 1`,
        hardwareId
      ) as any[];

      if (existing.length > 0) {
        // Update heartbeat
        await prisma.$executeRawUnsafe(
          `UPDATE desktop_licenses SET last_verified_at = NOW(), updated_at = NOW() WHERE id = $1`,
          existing[0].id
        );
        return NextResponse.json({
          success: true,
          license_key: existing[0].license_key,
          status: existing[0].status,
          subdomain: existing[0].subdomain,
          message: 'جهاز مسجّل مسبقاً',
          already_registered: true,
        });
      }
    }

    const licenseKey = generateLicenseKey();

    // Ensure table exists
    await ensureTable();

    const trialDays = 7;

    await prisma.$executeRawUnsafe(`
      INSERT INTO desktop_licenses 
        (license_key, hardware_id, device_name, company_name_ar, company_name_en, business_domain,
         mobile, vat_number, crn_number, city, city_en, district, street_name,
         building_no, postal_code, subdomain, status, app_version, trial_ends_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'trial', $17, NOW() + INTERVAL '${trialDays} days')
    `,
      licenseKey, hardwareId || null, deviceName || null,
      companyNameAr, companyNameEn || null, businessDomain || null,
      mobile || null, vatNumber || null, crnNumber || null,
      city || null, cityEn || null, district || null, streetName || null,
      buildingNo || null, postalCode || null, subdomain, appVersion || '1.0.0'
    );

    // Check if a previous registration with matching company data has backups
    let hasBackup = false;
    let backupInfo: any = null;

    if (vatNumber || crnNumber) {
      try {
        // Ensure backups table exists
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

        // Find previous license with same VAT or CRN (not the one we just created)
        const conditions: string[] = [];
        const params: any[] = [licenseKey];
        let paramIdx = 2;

        if (vatNumber) {
          conditions.push(`vat_number = $${paramIdx}`);
          params.push(vatNumber);
          paramIdx++;
        }
        if (crnNumber) {
          conditions.push(`crn_number = $${paramIdx}`);
          params.push(crnNumber);
          paramIdx++;
        }

        const prevLicenses = await prisma.$queryRawUnsafe(
          `SELECT license_key FROM desktop_licenses 
           WHERE license_key != $1 AND (${conditions.join(' OR ')})
           ORDER BY created_at DESC LIMIT 5`,
          ...params
        ) as any[];

        // Check if any of those have backups
        for (const prev of prevLicenses) {
          const backups = await prisma.$queryRawUnsafe(
            `SELECT id, filename, file_size, created_at FROM desktop_backups 
             WHERE license_key = $1 ORDER BY created_at DESC LIMIT 1`,
            prev.license_key
          ) as any[];

          if (backups.length > 0) {
            hasBackup = true;
            backupInfo = {
              backup_license_key: prev.license_key,
              backup_id: backups[0].id,
              backup_size: Number(backups[0].file_size),
              backup_date: backups[0].created_at,
            };
            break;
          }
        }
      } catch { /* backups table may not exist yet — ignore */ }
    }

    return NextResponse.json({
      success: true,
      license_key: licenseKey,
      subdomain: subdomain,
      status: 'trial',
      trial_days: trialDays,
      message: 'تم تسجيل الشركة بنجاح',
      has_backup: hasBackup,
      ...(backupInfo || {}),
    });

  } catch (err: any) {
    console.error('Desktop register error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
