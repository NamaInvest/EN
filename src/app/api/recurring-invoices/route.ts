import { NextRequest, NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'recurring-invoices' });

// Add a new Recurring Contract

const _POSTSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  frequency: z.any().optional(),
  startDate: z.string().optional(),
  items: z.array(z.any()).optional(),
  subtotal: z.number().optional(),
  taxValue: z.number().optional(),
  total: z.number().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req as any);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const {
      customerId,
      frequency,
      startDate,
      items,
      subtotal,
      taxValue,
      total,
      notes,
    } = body;

    if (!customerId || !frequency || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required contract fields" },
        { status: 400 },
      );
    }

    // Store the recurring state inside a Sales Order to avoid schema changes
    const contractPayload = {
      isRecurring: true,
      frequency: frequency, // "MONTHLY" or "YEARLY"
      nextBillingDate: startDate,
      extraNotes: notes || "",
    };

    // We get the max order no
    const maxOrder = await prisma.salesOrder.aggregate({
      _max: { orderNo: true },
    });
    const nextNo = (maxOrder._max.orderNo || 0) + 1;

    const newContract = await prisma.salesOrder.create({
      data: {
        orderNo: nextNo,
        date: new Date(startDate), // the initial start date
        customerId: Number(customerId),
        stockId: 1, // default
        subtotal: Number(subtotal),
        taxValue: Number(taxValue),
        total: Number(total),
        status: `RECURRING_${frequency}`, // Special flag!
        notes: JSON.stringify(contractPayload),
        userId: (user as any).id || 1,
        details: {
          create: items.map((item: any) => ({
            productId: Number(item.productId),
            productName: item.productName,
            quantity: Number(item.quantity),
            price: Number(item.price),
            total: Number(item.total),
            taxValue: item.taxValue ? Number(item.taxValue) : 0,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, contract: newContract });
  } catch (e: any) {
    log.error("Recurring Creation Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Get all active Recurring Contracts
async function _GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req as any);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contracts = await prisma.salesOrder.findMany({ take: 100,
      where: {
        status: {
          startsWith: "RECURRING_",
        },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        details: true,
      },
      orderBy: { id: "desc" },
    });

    const formatted = contracts.map((c: any) => {
      let meta = {
        nextBillingDate: c.date,
        frequency: c.status.replace("RECURRING_", ""),
        extraNotes: "",
      };
      try {
        if (c.notes) meta = JSON.parse(c.notes);
      } catch (e: any) {}

      return {
        id: c.id,
        orderNo: c.orderNo,
        customerName: c?.customer?.name || "Unknown",
        total: c.total,
        status: c.status,
        frequency: meta.frequency,
        nextBillingDate: meta.nextBillingDate,
        itemsCount: c.details.length,
      };
    });

    return NextResponse.json(formatted);
  } catch (e: any) {
    log.error("Get Recurring Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
