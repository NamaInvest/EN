import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Client } from 'pg';

const OWNER_EMAIL = process.env.ICE_OWNER_EMAIL || 'admin@namainvist.com';

const DB_CONFIG = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.POSTGRES_ROOT_PASSWORD || 'RootPassNama123',
    database: 'postgres',
};

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify owner email via Clerk
    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
    const clerkUser = await clerkRes.json();
    const email = clerkUser?.email_addresses?.[0]?.email_address || '';

    if (email !== OWNER_EMAIL) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const client = new Client(DB_CONFIG);
    try {
        await client.connect();

        // Get all databases ending with _db (tenant databases)
        const dbListRes = await client.query(`
            SELECT datname FROM pg_database 
            WHERE datname LIKE '%_db' 
              AND datname != 'namadb' 
              AND datistemplate = false
            ORDER BY datname
        `);

        const tenants = [];

        for (const row of dbListRes.rows) {
            const dbName = row.datname as string;
            const subdomain = dbName.replace('_db', '');

            // Connect to each tenant DB to get settings
            const tenantClient = new Client({
                ...DB_CONFIG,
                database: dbName,
            });

            try {
                await tenantClient.connect();

                const settingsRes = await tenantClient.query(`
                    SELECT key, value FROM "Setting"
                    WHERE key IN (
                        'companyNameAr', 'companyNameEn', 'vatNumber',
                        'trialActive', 'trialEndsAt', 'maxTrialInvoices',
                        'hidden_modules'
                    )
                `);

                const settings: Record<string, string> = {};
                for (const s of settingsRes.rows) {
                    settings[s.key] = s.value;
                }

                // Invoice count for this tenant
                let invoiceCount = 0;
                try {
                    const invoiceRes = await tenantClient.query(`SELECT COUNT(*) as cnt FROM "SalesInvoice"`);
                    invoiceCount = parseInt(invoiceRes.rows[0]?.cnt || '0');
                } catch {
                    // Table might not exist yet
                }

                const trialEndsAt = settings['trialEndsAt'] ? parseInt(settings['trialEndsAt']) : 0;
                const daysRemaining = trialEndsAt > 0 ? Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                const maxInvoices = parseInt(settings['maxTrialInvoices'] || '30');
                const isExpired = daysRemaining <= 0 || invoiceCount >= maxInvoices;

                tenants.push({
                    subdomain,
                    dbName,
                    domainUrl: `${subdomain}.namainvist.com`,
                    companyNameAr: settings['companyNameAr'] || subdomain,
                    companyNameEn: settings['companyNameEn'] || subdomain,
                    vatNumber: settings['vatNumber'] || '—',
                    trialActive: settings['trialActive'] === 'true',
                    daysRemaining: Math.max(0, daysRemaining),
                    invoiceCount,
                    maxInvoices,
                    isExpired,
                    hiddenModules: settings['hidden_modules'] ? JSON.parse(settings['hidden_modules']) : [],
                });

                await tenantClient.end();
            } catch {
                // Tenant DB might be still initializing
                tenants.push({
                    subdomain,
                    dbName,
                    domainUrl: `${subdomain}.namainvist.com`,
                    companyNameAr: subdomain,
                    companyNameEn: subdomain,
                    vatNumber: '—',
                    trialActive: false,
                    daysRemaining: 0,
                    invoiceCount: 0,
                    maxInvoices: 30,
                    isExpired: false,
                    hiddenModules: [],
                    status: 'INITIALIZING',
                });
                try { await tenantClient.end(); } catch {}
            }
        }

        await client.end();
        return NextResponse.json({ success: true, tenants });

    } catch (err: any) {
        try { await client.end(); } catch {}
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
