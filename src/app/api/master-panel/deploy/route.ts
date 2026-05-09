import { NextRequest, NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { exec } from "child_process";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from 'zod';


const _POSTSchema = z.object({
  tenantId: z.union([z.string(), z.number()]).optional(),
  port: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req as any);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify Super Admin
        const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
        if (!dbUser || dbUser.role !== 'admin') {
            return NextResponse.json({ error: "لا تملك صلاحيات لدخول محرك الشركات" }, { status: 403 });
        }

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { tenantId, port } = body;

        if (!tenantId || !port) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const cmd = `node create_tenant.js ${tenantId} ${port}`;

        // We run the command and wait for the synchronous part (SSH + DB config + SFTP) to finish
        // The rest of the build is always sent to background nohup by create_tenant.js
        return new Promise<NextResponse>((resolve) => {
            exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
                const logs = stdout.split('\n').filter(Boolean);
                if (stderr) {
                    logs.push(`[stderr] ${stderr}`);
                }
                
                if (error) {
                    console.error("Deploy Script Error:", error);
                    resolve(NextResponse.json({ error: error.message, logs }, { status: 500 }));
                } else {
                    resolve(NextResponse.json({ success: true, logs }));
                }
            });
        });

    } catch (err: any) {
        console.error("Master Panel Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
