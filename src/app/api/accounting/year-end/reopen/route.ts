// @ts-nocheck
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {

  try {
    const { fiscalYearId, reason, justification, externalAuditorEmail } = await req.json();
    const userId = "system-user"; // Replace with actual auth

    if (!fiscalYearId || !reason || !justification) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const fy = await prisma.fiscalYear.findUnique({
      where: { id: fiscalYearId },
    });
    if (!fy || fy.status !== "LOCKED") {
      return NextResponse.json({ error: "Only locked fiscal years can be reopened" }, { status: 400 });
    }

    const request = await prisma.fiscalYearReopenRequest.create({
      data: {
        fiscalYearId,
        requestedByUserId: userId,
        reason,
        justification,
        externalAuditorEmail,
        approvalChain: [],
      },
    });

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
