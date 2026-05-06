import { NextResponse, NextRequest } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { apiError, validateAmount, requireFields } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request);
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(assets, { status: 200 });
  } catch (error: any) {
    return apiError(error, "فشل جلب الأصول", { context: "assets" });
  }
}

export async function POST(request: NextRequest) {
  const prisma = getPrisma(request);
  try {
    const body = await request.json();
    const purchaseCost = parseFloat(body.purchaseCost);

    const { getNextNumber } = require("@/lib/numbering");
    const seqResult = await getNextNumber(prisma, "AST", undefined);
    const newAsset = await prisma.asset.create({
      data: {
        barcode: seqResult.formatted,
        name: body.assetName,
        category: body.assetType || "�����",
        purchaseDate: new Date(body.purchaseDate),
        purchasePrice: purchaseCost,
        salvageValue: parseFloat(body.salvageValue) || 0,
        usefulLifeYears: parseInt(body.usefulLifeYears) || 5,
        currentValue: purchaseCost,
        location: body.location || "",
        status: "ACTIVE",
      },
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error: any) {
    return apiError(error, "Error registering Fixed Asset", {
      context: "assets",
    });
  }
}
