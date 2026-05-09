import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    
    try {
        // 1. Digital Twin Nodes (Machines & Work Centers)
        const baseMachines = await prisma.machine.findMany({
            take: 100,
            orderBy: { id: 'asc' }
        });

        // Fetch telemetry separately to bypass IDE TS cache issues
        const allTelemetry = await (prisma as any).machineTelemetry.findMany({
            take: 100,
            orderBy: { id: 'desc' }
        });

        const machines = baseMachines.map(m => ({
            ...m,
            telemetry: allTelemetry.filter((t: any) => t.machineId === m.id).slice(0, 1)
        }));

        // 2. Autonomous Agents Logs (Simulated)
        const autonomousAgents = [
            { id: 1, type: 'procurement', action: 'Negotiated Wood Price with Supplier X (-3%)', status: 'completed', time: new Date().toISOString() },
            { id: 2, type: 'routing', action: 'Re-routed Order #WO-002 from Machine A to Machine B due to heat spike', status: 'active', time: new Date().toISOString() },
            { id: 3, type: 'accounting', action: 'Auto-journal entry for 120 pieces produced (Zero-Touch)', status: 'completed', time: new Date().toISOString() }
        ];

        // 3. Blockchain Ledger (Simulated)
        const blockchain = [
            { hash: '0x8f2a...19e2', block: 104291, action: 'Smart Contract: Payment Released for Batch #RAW-WOOD-001', verified: true },
            { hash: '0x9b1c...44d1', block: 104290, action: 'QC Passed & Hashed: Product #FG-TBL-101', verified: true }
        ];

        return NextResponse.json({ machines, autonomousAgents, blockchain });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch Digital Twin data' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
