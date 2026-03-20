import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import * as xlsx from 'xlsx';

export async function POST(request: NextRequest) {
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const allowed = await hasPermission(auth.userId, 'dashboard'); // Admin or products editor
        if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, branchId: true } });

        const formData = await request.formData();
        const file = formData.get('file') as Blob | null;

        if (!file) {
            return NextResponse.json({ error: 'لم يتم العثور على ملف' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const wb = xlsx.read(buffer, { type: 'buffer' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to JSON
        const data: any[] = xlsx.utils.sheet_to_json(ws);
        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'الملف فارغ أو لا يمكن قراءته' }, { status: 400 });
        }

        let added = 0;
        let updated = 0;
        let failed = 0;

        await prisma.$transaction(async (tx) => {
            for (const row of data) {
                try {
                    const id = row['المعرف (لا تقم بتعديله)'];
                    const name = row['اسم المنتج'] || row['name'] || row['Name'];
                    if (!name) { failed++; continue; }

                    const barcode = (row['الباركود'] || row['barcode'] || row['Barcode'] || '').toString();
                    const nameEn = (row['الاسم الإنجليزي'] || row['nameEn'] || '').toString();
                    const buyPrice = parseFloat(row['سعر الشراء'] || row['buyPrice'] || 0);
                    const sellPrice = parseFloat(row['سعر البيع'] || row['sellPrice'] || 0);
                    const taxRate = parseFloat(row['نسبة الضريبة'] || row['taxRate'] || 15);
                    const currentStock = parseFloat(row['المخزون الحالي'] || row['currentStock'] || 0);
                    const minQuantity = parseFloat(row['الحد الأدنى'] || row['minQuantity'] || 0);
                    const categoryId = parseInt(row['معرف التصنيف'] || row['categoryId'] || 0);
                    const description = (row['الوصف'] || row['description'] || '').toString();
                    const activeVal = row['نشط (1/0)'] || row['active'];
                    const active = activeVal === 0 || activeVal === '0' || activeVal === false ? false : true;

                    const productData = {
                        name,
                        nameEn,
                        barcode: barcode ? barcode : undefined, // If empty, undefined allows Prisma to drop it if unique is needed
                        buyPrice: isNaN(buyPrice) ? 0 : buyPrice,
                        sellPrice: isNaN(sellPrice) ? 0 : sellPrice,
                        taxRate: isNaN(taxRate) ? 15 : taxRate,
                        currentStock: isNaN(currentStock) ? 0 : currentStock,
                        minQuantity: isNaN(minQuantity) ? 0 : minQuantity,
                        categoryId: isNaN(categoryId) || categoryId === 0 ? null : categoryId,
                        description,
                        active
                    };

                    if (id) {
                        // Update existing product
                        await tx.product.update({
                            where: { id: parseInt(id) },
                            data: productData
                        });
                        updated++;
                    } else if (barcode) {
                        // Upsert by barcode if ID is missing
                        const existing = await tx.product.findUnique({ where: { barcode } });
                        if (existing) {
                            await tx.product.update({ where: { barcode }, data: productData });
                            updated++;
                        } else {
                            await tx.product.create({ data: productData });
                            added++;
                        }
                    } else {
                        // Create completely new without barcode constraints
                        await tx.product.create({ data: productData });
                        added++;
                    }
                } catch (e) {
                    console.error('Row import failed:', e);
                    failed++;
                }
            }
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        return NextResponse.json({ 
            success: true, 
            message: `تم المعالجة: تمت إضافة ${added}، وتم تحديث ${updated}، وفشل ${failed} صف.`
        });

    } catch (error) {
        console.error('Products IMPORT error:', error);
        return NextResponse.json({ error: 'فشل في استيراد المنتجات' }, { status: 500 });
    }
}
