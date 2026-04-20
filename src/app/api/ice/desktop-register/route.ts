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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyNameAr, companyNameEn, businessDomain,
      mobile, vatNumber, crnNumber,
      city, cityEn, district, streetName, buildingNo, postalCode,
      hardwareId, appVersion,
    } = body;

    if (!companyNameAr?.trim()) {
      return NextResponse.json({ success: false, message: 'اسم الشركة بالعربية مطلوب' }, { status: 400 });
    }

    // Check if this hardware already registered
    if (hardwareId) {
      const existing = await prisma.$queryRawUnsafe(
        `SELECT id, license_key, status FROM desktop_licenses WHERE hardware_id = $1 LIMIT 1`,
        hardwareId
      ) as any[];

      if (existing.length > 0) {
        return NextResponse.json({
          success: true,
          license_key: existing[0].license_key,
          status: existing[0].status,
          message: 'جهاز مسجّل مسبقاً',
          already_registered: true,
        });
      }
    }

    const licenseKey = generateLicenseKey();

    // Create desktop license record with full company data
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
        status VARCHAR(20) DEFAULT 'trial',
        app_version VARCHAR(20),
        max_devices INTEGER DEFAULT 1,
        activated_devices INTEGER DEFAULT 0,
        trial_ends_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ,
        activated_at TIMESTAMPTZ,
        last_verified_at TIMESTAMPTZ,
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const trialDays = 7;

    await prisma.$executeRawUnsafe(`
      INSERT INTO desktop_licenses 
        (license_key, hardware_id, company_name_ar, company_name_en, business_domain,
         mobile, vat_number, crn_number, city, city_en, district, street_name,
         building_no, postal_code, status, app_version, trial_ends_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'trial', $15, NOW() + INTERVAL '${trialDays} days')
    `,
      licenseKey, hardwareId || null,
      companyNameAr, companyNameEn || null, businessDomain || null,
      mobile || null, vatNumber || null, crnNumber || null,
      city || null, cityEn || null, district || null, streetName || null,
      buildingNo || null, postalCode || null, appVersion || '1.0.0'
    );

    return NextResponse.json({
      success: true,
      license_key: licenseKey,
      status: 'trial',
      trial_days: trialDays,
      message: 'تم تسجيل الشركة بنجاح',
    });

  } catch (err: any) {
    console.error('Desktop register error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
