import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';

const MASTER_DB_URL = process.env.DATABASE_URL || '';

function getMasterPool() {
  return new Pool({ connectionString: MASTER_DB_URL, max: 3 });
}

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let s = 0; s < 4; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars[crypto.randomInt(chars.length)];
    }
    segments.push(seg);
  }
  return segments.join('-');
}

async function ensureTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS desktop_licenses (
      id SERIAL PRIMARY KEY,
      license_key VARCHAR(20) UNIQUE NOT NULL,
      hardware_id VARCHAR(255),
      company_name_ar VARCHAR(255),
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
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
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
    )
  `);

  // Add new columns if table existed with old schema
  const addColumnSafe = async (col: string, type: string) => {
    try {
      await pool.query(`ALTER TABLE desktop_licenses ADD COLUMN IF NOT EXISTS ${col} ${type}`);
    } catch {}
  };
  await addColumnSafe('company_name_ar', 'VARCHAR(255)');
  await addColumnSafe('company_name_en', 'VARCHAR(255)');
  await addColumnSafe('business_domain', 'VARCHAR(100)');
  await addColumnSafe('mobile', 'VARCHAR(20)');
  await addColumnSafe('vat_number', 'VARCHAR(20)');
  await addColumnSafe('crn_number', 'VARCHAR(20)');
  await addColumnSafe('city', 'VARCHAR(100)');
  await addColumnSafe('city_en', 'VARCHAR(100)');
  await addColumnSafe('district', 'VARCHAR(100)');
  await addColumnSafe('street_name', 'VARCHAR(255)');
  await addColumnSafe('building_no', 'VARCHAR(10)');
  await addColumnSafe('postal_code', 'VARCHAR(10)');
  await addColumnSafe('app_version', 'VARCHAR(20)');
  await addColumnSafe('trial_ends_at', 'TIMESTAMPTZ');
  await addColumnSafe('updated_at', 'TIMESTAMPTZ DEFAULT NOW()');
  await addColumnSafe('tenant_account_id', 'INTEGER');
}

// GET: List all licenses or verify a license key
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (process.env.DESKTOP_MODE === 'true') {
    return NextResponse.json({ valid: true, data: { company: 'Desktop Local' } });
  }

  const pool = getMasterPool();

  try {
    await ensureTable(pool);

    // Verify a license key (called by desktop app)
    if (key) {
      const result = await pool.query(
        `SELECT * FROM desktop_licenses WHERE license_key = $1`, [key]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ valid: false, error: 'مفتاح غير موجود' });
      }

      const lic = result.rows[0];

      // Check trial expiry
      if (lic.status === 'trial' && lic.trial_ends_at && new Date(lic.trial_ends_at) < new Date()) {
        return NextResponse.json({ valid: false, error: 'انتهت الفترة التجريبية', status: 'trial_expired' });
      }

      if (lic.status === 'revoked' || lic.status === 'suspended') {
        return NextResponse.json({ valid: false, error: 'الرخصة ملغية أو معلقة', status: lic.status });
      }

      if (lic.expires_at && new Date(lic.expires_at) < new Date()) {
        return NextResponse.json({ valid: false, error: 'الرخصة منتهية الصلاحية', status: 'expired' });
      }

      await pool.query(
        `UPDATE desktop_licenses SET last_verified_at = NOW() WHERE license_key = $1`, [key]
      );

      // Fetch associated feature flags
      let features: string[] = [];
      if (lic.tenant_account_id) {
          try {
              const flagsRes = await pool.query(
                  `SELECT module_name FROM tenant_feature_flags WHERE tenant_account_id = $1 AND is_enabled = true`,
                  [lic.tenant_account_id]
              );
              features = flagsRes.rows.map(r => r.module_name);
          } catch (e) {
              console.error('Error fetching feature flags:', e);
          }
      }

      return NextResponse.json({
        valid: true,
        data: {
          company_name_ar: lic.company_name_ar || lic.company_name || '',
          company_name_en: lic.company_name_en || '',
          status: lic.status,
          trial_ends_at: lic.trial_ends_at,
          expires_at: lic.expires_at,
          features, // Include features in the payload
        },
      });
    }

    const tenantId = searchParams.get('tenant_id');

    let query = `
      SELECT id, license_key, hardware_id,
              company_name_ar, company_name_en, business_domain,
              mobile, vat_number, crn_number,
              city, city_en, district, street_name, building_no, postal_code,
              contact_email, contact_phone,
              subdomain, status, app_version, max_devices, activated_devices,
              trial_ends_at, expires_at, activated_at, last_verified_at, notes,
              created_at, updated_at, tenant_account_id,
              COALESCE(company_name_ar, '') as company_name
       FROM desktop_licenses
    `;
    let params: any[] = [];

    if (tenantId) {
        query += ` WHERE tenant_account_id = $1 ORDER BY created_at DESC`;
        params.push(tenantId);
    } else {
        query += ` ORDER BY created_at DESC`;
    }

    const result = await pool.query(query, params);

    return NextResponse.json({ licenses: result.rows });
  } catch (err: any) {
    console.error('License API error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}

// POST: Create, activate, or manage licenses
export async function POST(req: NextRequest) {
  if (process.env.DESKTOP_MODE === 'true') {
    return NextResponse.json({ error: 'Not available in desktop mode' }, { status: 400 });
  }

  const pool = getMasterPool();

  try {
    await ensureTable(pool);
    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      const key = generateLicenseKey();
      const {
        company_name, company_name_ar, company_name_en,
        contact_email, contact_phone, expires_at, notes, max_devices,
        business_domain, mobile, vat_number, crn_number,
        city, city_en, district, street_name, building_no, postal_code,
        tenant_account_id,
      } = body;

      await pool.query(
        `INSERT INTO desktop_licenses 
          (license_key, company_name_ar, company_name_en, contact_email, contact_phone,
           business_domain, mobile, vat_number, crn_number,
           city, city_en, district, street_name, building_no, postal_code,
           expires_at, notes, max_devices, status, tenant_account_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'active', $19)`,
        [key, company_name_ar || company_name || '', company_name_en || '',
         contact_email || '', contact_phone || '',
         business_domain || '', mobile || '', vat_number || '', crn_number || '',
         city || '', city_en || '', district || '', street_name || '', building_no || '', postal_code || '',
         expires_at || null, notes || '', max_devices || 1, tenant_account_id || null]
      );

      return NextResponse.json({ success: true, license_key: key });
    }

    if (action === 'activate') {
      const { key, hardware_id } = body;
      const result = await pool.query(
        `SELECT * FROM desktop_licenses WHERE license_key = $1`, [key]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'مفتاح غير موجود' });
      }

      const lic = result.rows[0];
      if (lic.status === 'revoked') {
        return NextResponse.json({ success: false, error: 'الرخصة ملغية' });
      }

      await pool.query(
        `UPDATE desktop_licenses 
         SET hardware_id = $1, activated_at = NOW(), activated_devices = activated_devices + 1,
             last_verified_at = NOW(), status = 'active'
         WHERE license_key = $2`,
        [hardware_id || 'unknown', key]
      );

      return NextResponse.json({
        success: true,
        data: { company: lic.company_name_ar, status: 'active' },
      });
    }

    if (action === 'revoke') {
      await pool.query(`UPDATE desktop_licenses SET status = 'revoked', updated_at = NOW() WHERE id = $1`, [body.id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'update_status') {
      await pool.query(`UPDATE desktop_licenses SET status = $1, updated_at = NOW() WHERE id = $2`, [body.status, body.id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'reset_hardware') {
      await pool.query(`UPDATE desktop_licenses SET hardware_id = NULL, activated_devices = 0, updated_at = NOW() WHERE id = $1`, [body.id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'update_max_devices') {
      await pool.query(`UPDATE desktop_licenses SET max_devices = $1, updated_at = NOW() WHERE id = $2`, [body.max_devices, body.id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'suspend') {
      await pool.query(`UPDATE desktop_licenses SET status = 'suspended', updated_at = NOW() WHERE id = $1`, [body.id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'reactivate') {
      await pool.query(`UPDATE desktop_licenses SET status = 'active', updated_at = NOW() WHERE id = $1`, [body.id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'activate_duration') {
      const months = parseInt(body.months) || 3;
      await pool.query(
        `UPDATE desktop_licenses 
         SET status = 'active', 
             activated_at = COALESCE(activated_at, NOW()),
             expires_at = NOW() + INTERVAL '${months} months',
             trial_ends_at = NULL,
             updated_at = NOW() 
         WHERE id = $1`,
        [body.id]
      );
      return NextResponse.json({ success: true, months });
    }

    if (action === 'delete') {
      // Delete associated backups first
      try {
        const backups = await pool.query(`SELECT file_path FROM desktop_backups WHERE license_key = (SELECT license_key FROM desktop_licenses WHERE id = $1)`, [body.id]);
        for (const b of backups.rows) {
          try { require('fs').unlinkSync(b.file_path); } catch {}
        }
        await pool.query(`DELETE FROM desktop_backups WHERE license_key = (SELECT license_key FROM desktop_licenses WHERE id = $1)`, [body.id]);
      } catch {}
      // Delete the license
      await pool.query(`DELETE FROM desktop_licenses WHERE id = $1`, [body.id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('License POST error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}
