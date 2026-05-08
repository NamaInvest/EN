import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { SalesInvoiceService, CreateInvoiceInput } from '@/services/sales/invoice.service';
import { BusinessContext } from '@/services/shared/event-bus.service';
import { getUserFromRequest } from '@/lib/auth';

/**
 * Helper to build the BusinessContext from the incoming request headers and auth
 */
async function buildBusinessContext(req: NextRequest, prisma: any): Promise<BusinessContext> {
  // In a real implementation, this would extract tenantId from headers 
  // set by the Clerk/Auth middleware as defined in 08_BACKEND_LOGIC.md
  const tenantId = req.headers.get('x-tenant-id') || 'default';
  
  const auth = getUserFromRequest(req as any);
  let userId = 'anonymous';
  let branchId = undefined;
  
  if (auth && auth.userId) {
    userId = auth.userId.toString();
    const user = await prisma.user.findUnique({ 
      where: { id: Number(auth.userId) },
      select: { branchId: true }
    });
    if (user && user.branchId) {
      branchId = user.branchId.toString();
    }
  }

  return {
    tenant: { id: tenantId },
    user: { id: userId },
    branch: branchId ? { id: branchId } : undefined,
    fiscal: { isClosed: false }, // Should query FiscalPeriod model
    requirePermission: (permission: string) => {
      // In real implementation, check roles/permissions
      // throw new Error(`Missing permission: ${permission}`);
    }
  };
}

export async function POST(req: NextRequest) {
  const prisma = getPrisma(req as any);
  
  try {
    const ctx = await buildBusinessContext(req, prisma);
    const body = await req.json();

    // The validation is simplified here but would use Zod validateRequest() in production
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Invoice must contain at least one item' }, { status: 400 });
    }

    const input: CreateInvoiceInput = {
      customerId: body.customerId ? String(body.customerId) : undefined,
      date: body.date ? new Date(body.date) : new Date(),
      items: body.items.map((item: any) => ({
        productId: String(item.productId),
        quantity: Number(item.quantity),
        price: Number(item.price),
        discount: Number(item.discount || 0),
        taxRate: Number(item.taxRate !== undefined ? item.taxRate : 15),
      }))
    };

    const service = new SalesInvoiceService(prisma as any, ctx);
    const invoice = await service.create(input);

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice created successfully via Service Layer (v2)',
      data: invoice 
    }, { status: 201 });

  } catch (error: any) {
    console.error('[v2] Sales POST error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
