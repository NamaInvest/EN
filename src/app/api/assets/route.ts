import { NextResponse, NextRequest } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from "@/lib/prisma";
import { apiError, validateAmount, requireFields } from "@/lib/api-error";

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'assets' });
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request);
  try {
    const assets = await prisma.asset.findMany({ take: 100,
      orderBy: { id: "desc" },
    });
    return NextResponse.json(assets, { status: 200 });
  } catch (error: any) {
    log.error('src/app/api/assets/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, "فشل جلب الأصول", { context: "assets" });
  }
}


const _POSTSchema = z.object({
  purchaseCost: z.number().optional(),
  assetName: z.any().optional(),
  assetType: z.any().optional(),
  purchaseDate: z.string().optional(),
  salvageValue: z.any().optional(),
  usefulLifeYears: z.union([z.string(), z.number()]).optional(),
  location: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
  const prisma = getPrisma(request);
  try {
    const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const purchaseCost = parseFloat(body.purchaseCost);

    const { getNextNumber } = require("@/lib/numbering");
    const seqResult = await getNextNumber(prisma, "AST", undefined);
    const newAsset = await prisma.asset.create({
      data: {
        barcode: seqResult.formatted,
        name: body.assetName,
        category: body.assetType || "UnauthorizedUnauthorizedUnauthorizedUnauthorizedUnauthorized",
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
    log.error('src/app/api/assets/route.ts', { error: error instanceof Error ? error.message : error });

    return apiError(error, "Error registering Fixed Asset", {
      context: "assets",
    });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
