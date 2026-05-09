import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

import { getUserFromRequest } from '@/lib/auth';
/**
 * POST /api/auth/find-tenant-by-email
 * Searches all tenant databases to find which subdomain has a user with the given email.
 * Used by auto-login to redirect users to the correct tenant subdomain.
 */
async function _POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    try {
        const { email } = await request.json();
        if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

        const { Pool } = require('pg');
        if (!process.env.MASTER_DB_URL) throw new Error('MASTER_DB_URL is required');
        const masterPool = new Pool({
            connectionString: process.env.MASTER_DB_URL,
            max: 2,
        });

        // Get all tenant subdomains
        const { rows: tenants } = await masterPool.query(
            `SELECT subdomain, user_email FROM tenant_accounts WHERE subscription_status != 'suspended'`
        );
        await masterPool.end();

        // 1. First check: does the email match the tenant's registration email?
        for (const t of tenants) {
            if (t.user_email && t.user_email.toLowerCase() === email.toLowerCase()) {
                return NextResponse.json({ found: true, subdomain: t.subdomain });
            }
        }

        // 2. Deep check: search in each tenant's users table
        for (const t of tenants) {
            const tenantConnString = process.env.MASTER_DB_URL!.replace(/\/[^/?]+(\?|$)/, `/${t.subdomain}_db$1`);
            const tenantPool = new Pool({
                connectionString: tenantConnString,
                max: 1,
            });
            try {
                const { rows } = await tenantPool.query(
                    `SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1) LIMIT 1`,
                    [email]
                );
                if (rows.length > 0) {
                    await tenantPool.end();
                    return NextResponse.json({ found: true, subdomain: t.subdomain });
                }
            } catch {
                // DB might not have email column or doesn't exist
            } finally {
                await tenantPool.end().catch(() => {});
            }
        }

        return NextResponse.json({ found: false });
    } catch (error: any) {
        console.error('[find-tenant-by-email] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
