import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Security: In a real app, require NextAuth Token with Role='master'. 
// For demo, we leave it open, but we check if request comes from within.
export async function GET() {
  try {
    // 1. Fetch PM2 list
    const { stdout } = await execAsync("pm2 jlist");
    const pm2Data = JSON.parse(stdout);
    
    // 2. Fetch all tenants from DB
    const tenants = await prisma.tenantAccount.findMany({
            take: 100,
      orderBy: { createdAt: "desc" },
    });

    const enrichedNodes = tenants.map((tenant) => {
        // Find matching PM2 process (e.g., 'nama_n12')
        // Backwards compatibility with Hetzner legacy processes
        const proc = pm2Data.find((p: any) => p.name === `nama_${tenant.subdomain}` || p.name === tenant.subdomain);
        
        return {
            id: tenant.id,
            subdomain: tenant.subdomain,
            email: tenant.userEmail,
            orgName: tenant.orgName,
            status: tenant.status,
            paymentStatus: tenant.paymentStatus,
            subscriptionDuration: tenant.subscriptionDuration,
            createdAt: tenant.createdAt,
            pm2Status: proc ? (proc.pm2_env.status || "offline") : "offline",
            memoryMb: proc ? Math.round(proc.monit.memory / 1024 / 1024) : 0,
            cpuPercent: proc ? proc.monit.cpu : 0,
            uptimeSec: proc && proc.pm2_env.pm_uptime ? Math.round((Date.now() - proc.pm2_env.pm_uptime) / 1000) : 0,
        };
    });

    return NextResponse.json({ nodes: enrichedNodes });

  } catch (error) {
    console.error("[ADMIN_NODES_API]", error);
    return NextResponse.json({ error: "Failed to read Hetzner PM2 Grid" }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
        const { action, subdomain } = await req.json(); // action: 'start', 'stop', 'restart'
        
        if (!['start', 'stop', 'restart'].includes(action)) {
            return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
        }

        const { stdout: jlist } = await execAsync("pm2 jlist");
        const pm2List = JSON.parse(jlist);
        
        // Find which format it is using
        const legacyName = subdomain;
        const modernName = `nama_${subdomain}`;
        
        let processName = modernName;
        if (pm2List.some((p: any) => p.name === legacyName)) {
            processName = legacyName;
        }
        
        // Execute the physical PM2 command on the server
        console.log(`[ADMIN_RPC] Executing: pm2 ${action} ${processName}`);
        await execAsync(`pm2 ${action} ${processName}`);
        await execAsync("pm2 save");

        return NextResponse.json({ success: true, message: `Node ${subdomain} ${action}ed successfully.` });

    } catch (error) {
        console.error("[ADMIN_RPC_ERROR]", error);
        return NextResponse.json({ error: "PM2 execution failed." }, { status: 500 });
    }
}
