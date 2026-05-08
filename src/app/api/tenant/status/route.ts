import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {

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
    console.error("[TENANT_STATUS_API]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
