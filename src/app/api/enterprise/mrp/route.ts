/**
 * Rewrites enterprise/mrp route.ts:
 * - Native withRoute pattern (no _GET/_POST delegates)
 * - Proper Zod validation on POST
 * - Fixed encoding (Arabic text was garbled)
 * - Cleaned @ts-ignore directives
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRoute } from '@/lib/api/with-route';

const CreateMachineSchema = z.object({
  type:        z.literal('machine'),
  name:        z.string().min(1, 'اسم الماكينة مطلوب'),
  machineType: z.string().min(1),
  capacity:    z.number().min(0).default(0),
});

const CreateOrderSchema = z.object({
  type:              z.literal('order'),
  recipeId:          z.number().int().positive(),
  machineId:         z.number().int().positive().optional().nullable(),
  stockId:           z.number().int().positive(),
  quantity:          z.number().positive('الكمية مطلوبة'),
  startDate:         z.string().optional(),
  endDate:           z.string().optional().nullable(),
});

const UpdateOrderSchema = z.object({
  id:     z.number().int().positive(),
  action: z.enum(['START', 'COMPLETE', 'CANCEL']),
});

const PostBody = z.discriminatedUnion('type', [CreateMachineSchema, CreateOrderSchema]);

export const GET = withRoute(async ({ req, prisma }) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  const [orders, machines, recipesCount] = await Promise.all([
    prisma.manufacturingOrder.findMany({
      take: 100,
      where: { OR: [{ orderNumber: { contains: search, mode: 'insensitive' } }] },
      include: {
        recipe: {
          include: {
            finishedProduct: { select: { name: true, barcode: true } },
            ingredients: { include: { rawProduct: { select: { name: true } } } },
          },
        },
        // machine is not in Prisma schema yet — accessed via raw
      },
      orderBy: { id: 'desc' },
    }),
    (prisma as any).machine.findMany().catch(() => []),
    prisma.recipe.count(),
  ]);

  return NextResponse.json({ orders, machines, recipesCount });
});

export const POST = withRoute(async ({ req, prisma }) => {
  const raw = await req.json().catch(() => ({}));
  const parsed = PostBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.type === 'machine') {
    const m = await (prisma as any).machine.create({
      data: {
        name:     data.name,
        type:     data.machineType,
        capacity: data.capacity,
        status:   'IDLE',
      },
    });
    return NextResponse.json({ message: 'تم أرشفة محطة العمل', machine: m }, { status: 201 });
  }

  if (data.type === 'order') {
    const order = await prisma.manufacturingOrder.create({
      data: {
        orderNumber:       `MO-${Date.now()}`,
        recipeId:          data.recipeId,
        machineId:         data.machineId ?? null,
        stockId:           data.stockId,
        quantityToProduce: data.quantity,
        status:            'PLANNED',
        startDate:         data.startDate ? new Date(data.startDate) : new Date(),
        endDate:           data.endDate   ? new Date(data.endDate)   : null,
        totalCost:         0,
      } as any,
    });
    return NextResponse.json({ message: 'تم تخطيط أمر التصنيع', order }, { status: 201 });
  }

  return NextResponse.json({ error: 'نوع العملية غير معروف' }, { status: 400 });
}, { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req, prisma }) => {
  const raw = await req.json().catch(() => ({}));
  const parsed = UpdateOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { id, action } = parsed.data;

  const order = await prisma.manufacturingOrder.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const statusMap: Record<string, string> = {
    START:    'IN_PROGRESS',
    COMPLETE: 'COMPLETED',
    CANCEL:   'CANCELLED',
  };
  const newStatus = statusMap[action] || order.status;

  const updated = await prisma.manufacturingOrder.update({
    where: { id },
    data:  { status: newStatus },
  });

  // Update machine status (non-fatal)
  const machineId = (order as any).machineId;
  if (machineId) {
    const machineStatus = action === 'START' ? 'RUNNING' : action === 'COMPLETE' ? 'IDLE' : null;
    if (machineStatus) {
      await (prisma as any).machine.update({ where: { id: machineId }, data: { status: machineStatus } }).catch(() => {});
    }
  }

  return NextResponse.json({ message: `تم تحديث حالة الأمر إلى ${newStatus}`, order: updated });
}, { rateLimit: 'DEFAULT' });
