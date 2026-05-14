import { NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { PrismaClient } from "@prisma/client";
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'tenant.status' });

const prisma = new PrismaClient();

async function _GET(req: Request) {

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const tenant = await prisma.tenantAccount.findUnique({
      where: { userEmail: email },
    });

    if (!tenant) {
      return NextResponse.json({ status: "none" });
    }

    return NextResponse.json({
      status: tenant.status,
      subdomain: tenant.subdomain,
    });
  } catch (error: any) {
    log.error("[TENANT_STATUS_API]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', requireAuth: false });
