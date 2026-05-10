import { NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from "@/lib/prisma";

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'customers' });
async function _GET(request: Request) {
  const prisma = getPrisma(request);
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }
    if (type !== null && type !== undefined && type !== "") {
      where.type = parseInt(type);
    }

    const customers = await prisma.customer.findMany({ take: 100,
      where,
      orderBy: { id: "desc" },
    });
    return NextResponse.json(customers);
  } catch (error: any) {
    log.error("Customers GET error:", error);
    return NextResponse.json([], { status: 500 });
  }
}


const _POSTSchema = z.object({
  type: z.any().optional(),
  name: z.any().optional(),
  phone: z.string().optional(),
  address: z.any().optional(),
  street: z.any().optional(),
  buildingNumber: z.any().optional(),
  district: z.any().optional(),
  city: z.any().optional(),
  postalCode: z.any().optional(),
  creditLimit: z.any().optional(),
  taxNumber: z.number().optional(),
}).passthrough();

async function _POST(request: Request) {
  const prisma = getPrisma(request);
  try {
    const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const { getNextNumber } = require("@/lib/numbering");
    const seqResult = await getNextNumber(
      prisma,
      parseInt(body.type) === 1 ? "VEND" : "CUST",
      undefined,
    );
    const customer = await prisma.customer.create({
      data: {
        customerNo: seqResult.formatted,
        name: body.name,
        phone: body.phone || null,
        address: body.address || null,
        street: body.street || null,
        buildingNumber: body.buildingNumber || null,
        district: body.district || null,
        city: body.city || null,
        postalCode: body.postalCode || null,
        type: parseInt(body.type) || 0,
        creditLimit: parseFloat(body.creditLimit) || 0,
        taxNumber: body.taxNumber || null,
        // @ts-ignore: VS Code cache issue
        crNo: body.crNo || null,
        notes: body.notes || null,
        routeId: body.routeId ? parseInt(body.routeId) : null,
      },
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    log.error("Customer create error:", error);
    return NextResponse.json({ error: "فشل في الإنشاء" }, { status: 500 });
  }
}

async function _DELETE(request: Request) {
  const prisma = getPrisma(request);
  try {
    // Auth check — only admin/owner can delete all customers
    const { getUserFromRequest } = require("@/lib/auth");
    const auth = getUserFromRequest(request as any);
    if (!auth || !["admin", "owner", "system_admin"].includes(auth.role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    await prisma.customer.deleteMany();
    return NextResponse.json({ message: "تم حذف الكل" });
  } catch (error: any) {
    log.error("Customers delete all error:", error);
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
