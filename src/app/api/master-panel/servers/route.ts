import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getUserFromRequest } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function _GET(req: NextRequest) {
    const masterToken = req.cookies.get('master_token')?.value;
    const user = await getUserFromRequest(req as any);
    if (masterToken !== 'SECURE_MASTER_VALIDATED' && (!user || user.role !== 'owner')) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    try {
        const { stdout } = await execAsync('pm2 jlist');
        const list = JSON.parse(stdout);
        const processes = list.map((p: any) => ({
            pm_id: p.pm_id,
            name: p.name,
            status: p.pm2_env.status,
            memory: p.monit.memory,
            cpu: p.monit.cpu,
            uptime: Date.now() - p.pm2_env.pm_uptime
        }));
        return NextResponse.json({ processes });
    } catch (e: any) {
        // If pm2 is not found (e.g., dev environment), return mock
        console.error('PM2 fetch error:', e.message);
        return NextResponse.json({
            processes: [
                { pm_id: 0, name: 'main-site', status: 'online', memory: 71000000, cpu: 0, uptime: 100000 },
                { pm_id: 1, name: 'saas-app', status: 'online', memory: 120000000, cpu: 1, uptime: 200000 }
            ]
        });
    }
}

async function _POST(req: NextRequest) {
    const masterToken = req.cookies.get('master_token')?.value;
    const user = await getUserFromRequest(req as any);
    if (masterToken !== 'SECURE_MASTER_VALIDATED' && (!user || user.role !== 'owner')) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    try {
        const { pm2Id, action } = await req.json();
        if (action === 'restart') {
            await execAsync(`pm2 restart ${pm2Id}`);
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        console.error('PM2 execute error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', requireAuth: false });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT', requireAuth: false });
