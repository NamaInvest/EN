import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { Pool } from 'pg';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ice.license.verify' });

// ──────────────────────────────────────────────────────────────────────────────
// License Verify — Public endpoint called by desktop app
// ──────────────────────────────────────────────────────────────────────────────

async function _GET(req: NextRequest) {

  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ valid: false, error: 'مفتاح مفقود' });
  }

  // Desktop mode — always valid
  if (process.env.DESKTOP_MODE === 'true') {
    return NextResponse.json({ valid: true, data: { company: 'Local Desktop' } });
  }

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });

    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS desktop_licenses (
        id SERIAL PRIMARY KEY,
        license_key VARCHAR(20) UNIQUE NOT NULL,
        company_name VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        expires_at TIMESTAMP,
        last_verified_at TIMESTAMP
      )
    `).catch(() => {});

    const result = await pool.query(
      `SELECT * FROM desktop_licenses WHERE license_key = $1`,
      [key]
    );

    await pool.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ valid: false, error: 'مفتاح غير موجود' });
    }

    const license = result.rows[0];

    if (license.status !== 'active') {
      return NextResponse.json({ valid: false, error: 'الرخصة ملغية' });
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'الرخصة منتهية' });
    }

    return NextResponse.json({
      valid: true,
      data: {
        company: license.company_name,
        status: license.status,
        expiresAt: license.expires_at,
      },
    });
  } catch (err: any) {
    log.error('src/app/api/ice/license/verify/route.ts', { error: err instanceof Error ? err.message : err });

    // If DB connection fails, allow offline grace period
    return NextResponse.json({ valid: false, offline: true, error: 'لا يمكن التحقق حالياً' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
