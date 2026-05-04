// @ts-nocheck
import { NextResponse } from "next/server";
import { OpenItemsEngine } from "@/lib/open-items";

export async function POST(req: Request) {
  try {
    const { paymentOpenItemId, allocations } = await req.json();
    const userId = "system-user";

    if (!paymentOpenItemId || !allocations || !Array.isArray(allocations)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const result = await OpenItemsEngine.applyPayment(paymentOpenItemId, allocations, userId);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
