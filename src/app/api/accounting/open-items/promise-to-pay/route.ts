// @ts-nocheck
import { NextResponse } from "next/server";
import { OpenItemsEngine } from "@/lib/open-items";

export async function POST(req: Request) {
  try {
    const { openItemId, amount, date } = await req.json();
    const userId = "system-user";

    if (!openItemId || !amount || !date) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const result = await OpenItemsEngine.recordPromiseToPay(openItemId, amount, new Date(date), userId);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
