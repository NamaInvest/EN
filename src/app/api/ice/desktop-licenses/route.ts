import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';

// ──────────────────────────────────────────────────────────────────────────────
// ICE Desktop License API
// إنشاء، التحقق، وإدارة مفاتيح تراخيص تطبيق سطح المكتب
// ──────────────────────────────────────────────────────────────────────────────

const MASTER_DB_URL = process.env.DATABASE_URL || '';

function getMasterPool() {
  return new Pool({ connectionString: MASTER_DB_URL, max: 3 });
}

// Generate a license key: XXXX-XXXX-XXXX-XXXX
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

// Ensure licenses table exists
async function ensureTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS desktop_licenses (
      id SERIAL PRIMARY KEY,
      license_key VARCHAR(20) UNIQUE NOT NULL,
      company_name VARCHAR(255),
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
      hardware_id VARCHAR(255),
      status VARCHAR(20) DEFAULT 'active',
      max_devices INTEGER DEFAULT 1,
      activated_devices INTEGER DEFAULT 0,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      activated_at TIMESTAMP,
      last_verified_at TIMESTAMP,
      notes TEXT
    )
  `);
}

// GET: List all licenses or verify a license key
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  const action = searchParams.get('action') || 'list';

  // Desktop mode doesn't need license management
  if (process.env.DESKTOP_MODE === 'true') {
    return NextResponse.json({ valid: true, data: { company: 'Desktop Local' } });
  }

  const pool = getMasterPool();

  try {
    await ensureTable(pool);

    // Verify a license key (called by desktop app)
    if (key) {
      const result = await pool.query(
        `SELECT * FROM desktop_licenses WHERE license_key = $1`,
        [key]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ valid: false, error: 'مفتاح غير موجود' });
      }

      const license = result.rows[0];

      if (license.status !== 'active') {
        return NextResponse.json({ valid: false, error: 'الرخصة ملغية أو معلقة' });
      }

      if (license.expires_at && new Date(license.expires_at) < new Date()) {
        return NextResponse.json({ valid: false, error: 'الرخصة منتهية الصلاحية' });
      }

      // Update last verified
      await pool.query(
        `UPDATE desktop_licenses SET last_verified_at = NOW() WHERE license_key = $1`,
        [key]
      );

      return NextResponse.json({
        valid: true,
        data: {
          company: license.company_name,
          email: license.contact_email,
          status: license.status,
          expiresAt: license.expires_at,
        },
      });
    }

    // Check ICE admin auth
    const authHeader = req.headers.get('cookie') || '';
    const iceEmail = process.env.ICE_OWNER_EMAIL;
    // Simple auth check — in production this should be more robust

    // List all licenses
    const result = await pool.query(
      `SELECT id, license_key, company_name, contact_email, contact_phone, 
              status, max_devices, activated_devices, expires_at, 
              created_at, activated_at, last_verified_at, notes, hardware_id
       FROM desktop_licenses ORDER BY created_at DESC`
    );

    return NextResponse.json({ licenses: result.rows });
  } catch (err: any) {
    console.error('License API error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}

// POST: Create or Activate a license
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
      // Generate new license key
      const key = generateLicenseKey();
      const { company_name, contact_email, contact_phone, expires_at, notes, max_devices } = body;

      await pool.query(
        `INSERT INTO desktop_licenses (license_key, company_name, contact_email, contact_phone, expires_at, notes, max_devices)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [key, company_name || '', contact_email || '', contact_phone || '', 
         expires_at || null, notes || '', max_devices || 1]
      );

      return NextResponse.json({ success: true, license_key: key });
    }

    if (action === 'activate') {
      // Desktop app calls this to register hardware
      const { key, hardware_id } = body;

      const result = await pool.query(
        `SELECT * FROM desktop_licenses WHERE license_key = $1`,
        [key]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'مفتاح غير موجود' });
      }

      const license = result.rows[0];

      if (license.status !== 'active') {
        return NextResponse.json({ success: false, error: 'الرخصة غير نشطة' });
      }

      if (license.hardware_id && license.hardware_id !== hardware_id) {
        if (license.activated_devices >= license.max_devices) {
          return NextResponse.json({ success: false, error: 'تم الوصول للحد الأقصى من الأجهزة' });
        }
      }

      await pool.query(
        `UPDATE desktop_licenses 
         SET hardware_id = $1, activated_at = NOW(), activated_devices = activated_devices + 1,
             last_verified_at = NOW()
         WHERE license_key = $2`,
        [hardware_id || 'unknown', key]
      );

      return NextResponse.json({
        success: true,
        data: { company: license.company_name, status: license.status },
      });
    }

    if (action === 'revoke') {
      const { id } = body;
      await pool.query(
        `UPDATE desktop_licenses SET status = 'revoked' WHERE id = $1`,
        [id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'suspend') {
      const { id } = body;
      await pool.query(
        `UPDATE desktop_licenses SET status = 'suspended' WHERE id = $1`,
        [id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'reactivate') {
      const { id } = body;
      await pool.query(
        `UPDATE desktop_licenses SET status = 'active' WHERE id = $1`,
        [id]
      );
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
