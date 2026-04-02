import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Safety lock - this API only reacts to localhost/root processes if needed
        // but since we rely on the frontend password "namamaster", we will process commands here
        
        if (body.action === 'status') {
            try {
                // Execute PM2 jlist to get all daemon statuses
                const { stdout, stderr } = await execAsync('pm2 jlist');
                const plist = JSON.parse(stdout);
                
                const nodes = plist.map((p: any) => ({
                    id: p.name,
                    status: p.pm2_env.status,
                    pm2_env: {
                        restart_time: p.pm2_env.restart_time,
                        cpu: p.monit?.cpu,
                        memory: p.monit?.memory,
                    }
                })).filter((n: any) => n.id.startsWith('n') && !isNaN(parseInt(n.id.replace('n',''))));
                
                return NextResponse.json({ success: true, nodes });
            } catch (e: any) {
                return NextResponse.json({ success: false, error: 'PM2 is not accessible. ' + e.message });
            }
        }
        
        if (body.action === 'restart' || body.action === 'stop' || body.action === 'start') {
            const target = body.target; // e.g., 'n1'
            if (!target.match(/^n\d+$/)) {
                return NextResponse.json({ success: false, error: 'Invalid target node' });
            }
            try {
                const { stdout } = await execAsync(`pm2 ${body.action} ${target} --update-env`);
                return NextResponse.json({ success: true, output: `Successfully executed ${body.action} on ${target}` });
            } catch (e: any) {
                // If the node doesn't exist, we could return a specific error
                return NextResponse.json({ success: false, error: e.message });
            }
        }

        return NextResponse.json({ success: false, error: 'Unknown Action' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
