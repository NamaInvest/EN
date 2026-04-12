import { PrismaClient } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Check if user exists by username (email)
    let dbUser = await prisma.user.findUnique({
      where: { username: email },
    });

    if (!dbUser) {
      // Auto-create user if they login with Google
      dbUser = await prisma.user.create({
        data: {
          username: email,
          fullName: user.firstName ? `${user.firstName} ${user.lastName || ''}` : email.split('@')[0],
          passwordHash: "clerk_managed",
          role: "cashier", // Default fallback role
          active: true,
        },
      });
    }

    return NextResponse.json({ success: true, user: dbUser });
  } catch (error) {
    console.error("Sync user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
