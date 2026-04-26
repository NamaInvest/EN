/**
 * MRP Engine — محرك تخطيط الموارد المادية
 * يحسب النقص في المواد الخام ويولد طلبات شراء تلقائياً
 */

import prisma from '@/lib/prisma';

interface MaterialRequirement {
  productId: number;
  productName: string;
  requiredQty: number;
  availableQty: number;
  shortageQty: number;
  unitCost: number;
  totalCost: number;
}

interface MRPResult {
  orderId: number;
  finishedProduct: string;
  orderQuantity: number;
  materials: {
    available: MaterialRequirement[];
    shortage: MaterialRequirement[];
  };
  totalMaterialCost: number;
  generatedPRs: number[];
}

/**
 * تشغيل MRP لأمر إنتاج معين
 * 1. يقرأ BOM (الوصفة + المكونات)
 * 2. يضرب في الكمية المطلوبة
 * 3. يقارن بالمخزون المتاح
 * 4. ينشئ طلب شراء (PR) للمواد الناقصة
 */
export async function runMRP(manufacturingOrderId: number): Promise<MRPResult> {
  // 1. جلب أمر الإنتاج
  const order = await (prisma as any).manufacturingOrder.findUnique({
    where: { id: manufacturingOrderId },
    include: {
      recipe: {
        include: {
          ingredients: {
            include: { rawProduct: true },
          },
        },
      },
    },
  });

  if (!order || !order.recipe) {
    throw new Error('أمر الإنتاج أو الوصفة غير موجود');
  }

  const available: MaterialRequirement[] = [];
  const shortage: MaterialRequirement[] = [];
  let totalMaterialCost = 0;

  // 2. حساب الاحتياج لكل مادة خام
  for (const ingredient of order.recipe.ingredients) {
    const requiredQty = ingredient.quantity * order.quantity;

    // جلب المخزون المتاح
    const stockData = await prisma.product.findUnique({
      where: { id: ingredient.rawProductId },
      select: { currentStock: true, name: true, buyPrice: true },
    });

    const availableQty = stockData?.currentStock || 0;
    const shortageQty = Math.max(0, requiredQty - availableQty);
    const unitCost = stockData?.buyPrice || 0;

    const item: MaterialRequirement = {
      productId: ingredient.rawProductId,
      productName: stockData?.name || `منتج #${ingredient.rawProductId}`,
      requiredQty,
      availableQty,
      shortageQty,
      unitCost,
      totalCost: requiredQty * unitCost,
    };

    totalMaterialCost += item.totalCost;

    if (shortageQty > 0) {
      shortage.push(item);
    } else {
      available.push(item);
    }
  }

  // 3. توليد طلبات شراء للمواد الناقصة
  const generatedPRs: number[] = [];

  if (shortage.length > 0) {
    try {
      // الحصول على آخر رقم PR
      const lastPR = await (prisma as any).purchaseRequisition.findFirst({
        orderBy: { reqNo: 'desc' },
        select: { reqNo: true },
      });
      const nextReqNo = (lastPR?.reqNo || 0) + 1;

      // إنشاء طلب شراء واحد يجمع كل المواد الناقصة
      const pr = await (prisma as any).purchaseRequisition.create({
        data: {
          reqNo: nextReqNo,
          date: new Date(),
          status: 'pending',
          notes: `تم التوليد تلقائياً من MRP — أمر إنتاج #${manufacturingOrderId}`,
          total: shortage.reduce((sum, s) => sum + s.shortageQty * s.unitCost, 0),
          details: {
            create: shortage.map((s) => ({
              productId: s.productId,
              productName: s.productName,
              quantity: s.shortageQty,
              price: s.unitCost,
              total: s.shortageQty * s.unitCost,
            })),
          },
        },
      });

      generatedPRs.push(pr.id);
    } catch (e) {
      // إذا فشل إنشاء PR — لا نوقف العملية
      console.error('MRP: فشل إنشاء طلب الشراء التلقائي:', e);
    }
  }

  return {
    orderId: manufacturingOrderId,
    finishedProduct: order.recipe.finishedProduct?.name || `منتج #${order.recipe.finishedProductId}`,
    orderQuantity: order.quantity,
    materials: { available, shortage },
    totalMaterialCost,
    generatedPRs,
  };
}
