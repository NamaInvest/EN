import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Client } from 'pg';

const OWNER_EMAIL = process.env.ICE_OWNER_EMAIL || 'admin@namainvist.com';

const DB_BASE_CONFIG = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.POSTGRES_ROOT_PASSWORD || 'RootPassNama123',
};

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify owner
    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
    const clerkUser = await clerkRes.json();
    const email = clerkUser?.email_addresses?.[0]?.email_address || '';

    if (email !== OWNER_EMAIL) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { subdomain, moduleName, enabled } = body;

    if (!subdomain || !moduleName) {
        return NextResponse.json({ error: 'subdomain and moduleName are required' }, { status: 400 });
    }

    const dbName = `${subdomain}_db`;
    const client = new Client({ ...DB_BASE_CONFIG, database: dbName });

    try {
        await client.connect();

        // Get current hidden_modules
        const current = await client.query(
            `SELECT value FROM "Setting" WHERE key = 'hidden_modules'`
        );

        let hiddenModules: string[] = [];
        if (current.rows.length > 0) {
            try { hiddenModules = JSON.parse(current.rows[0].value); } catch {}
        }

        if (enabled) {
            // Remove from hidden list (enable the module)
            hiddenModules = hiddenModules.filter((m: string) => m !== moduleName);
        } else {
            // Add to hidden list (disable the module)
            if (!hiddenModules.includes(moduleName)) {
                hiddenModules.push(moduleName);
            }
        }

        const newValue = JSON.stringify(hiddenModules);

        await client.query(`
            INSERT INTO "Setting" (key, value)
            VALUES ('hidden_modules', $1)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [newValue]);

        await client.end();
        return NextResponse.json({ success: true, hiddenModules });

    } catch (err: any) {
        try { await client.end(); } catch {}
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// Extend trial for a tenant
export async function PATCH(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
    const clerkUser = await clerkRes.json();
    const email = clerkUser?.email_addresses?.[0]?.email_address || '';

    if (email !== OWNER_EMAIL) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { subdomain, action } = body; // action: 'extend' | 'activate_paid'

    const dbName = `${subdomain}_db`;
    const client = new Client({ ...DB_BASE_CONFIG, database: dbName });

    try {
        await client.connect();

        if (action === 'activate_paid') {
            await client.query(`
                INSERT INTO "Setting" (key, value) VALUES ('trialActive', 'false')
                ON CONFLICT (key) DO UPDATE SET value = 'false'
            `);
        } else if (action === 'extend') {
            const newEndMs = Date.now() + (30 * 24 * 60 * 60 * 1000); // +30 days
            await client.query(`
                INSERT INTO "Setting" (key, value) VALUES ('trialEndsAt', $1)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            `, [newEndMs.toString()]);
            await client.query(`
                INSERT INTO "Setting" (key, value) VALUES ('maxTrialInvoices', '999')
                ON CONFLICT (key) DO UPDATE SET value = '999'
            `);
        }

        await client.end();
        return NextResponse.json({ success: true, action });

    } catch (err: any) {
        try { await client.end(); } catch {}
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
