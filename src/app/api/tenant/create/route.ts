import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    
    // Safety check: Fallback to body-provided email if NextAuth is mocked locally
    const body = await req.json();
    const userEmail = user?.emailAddresses[0]?.emailAddress || body.fallbackEmail;

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized. Please login with Google." }, { status: 401 });
    }

    const { orgName, vatNumber } = body;

    // Determine next subdomain
    const count = await prisma.tenantAccount.count();
    const nextIndex = count + 11; // Starts at n11
    const newSubdomain = `n${nextIndex}`;

    // Create the master tracking record
    const tenant = await prisma.tenantAccount.create({
      data: {
        userEmail,
        orgName,
        vatNumber,
        subdomain: newSubdomain,
        status: "pending"
      }
    });

    return NextResponse.json({ success: true, tenant });

  } catch (error) {
    console.error("[TENANT_CREATE_API]", error);
    return NextResponse.json({ error: "Failed to allocate tenant instance." }, { status: 500 });
  }
}
