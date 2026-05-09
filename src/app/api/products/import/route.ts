import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';
import { getUserFromRequest, hasPermission } from '@/lib/auth';

async function _POST(request: NextRequest) {

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const allowed = await hasPermission(auth.userId, 'dashboard', prisma); // Admin or products editor
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
        let firstError = '';

        // Removed $transaction to prevent 30-second timeouts on 10,000+ rows
        for (const row of data) {
            try {
                let id, name, nameEn, barcode, buyPrice, sellPrice, taxRate, currentStock, minQuantity, categoryId, categoryName, description, activeVal, imagePath, brandAr, brandEn, sizeInfo;
                
                // Dynamic resilient key mapping
                for (const key of Object.keys(row)) {
                    const k = key.trim().toLowerCase();
                    const val = row[key];
                    if (k === 'المعرف (لا تقم بتعديله)' || k === 'id') id = val;
                    else if (k === 'اسم المنتج' || k === 'name' || k === 'name_ar') name = val;
                    else if (k === 'الاسم الإنجليزي' || k === 'nameen' || k === 'name_en') nameEn = val;
                    else if (k === 'الباركود' || k === 'barcode' || k === 'barcodes') barcode = val;
                    else if (k === 'سعر الشراء' || k === 'buyprice') buyPrice = val;
                    else if (k === 'سعر البيع' || k === 'sellprice' || k === 'price (sar)' || k === 'price') sellPrice = val;
                    else if (k === 'نسبة الضريبة' || k === 'taxrate') taxRate = val;
                    else if (k === 'المخزون الحالي' || k === 'currentstock') currentStock = val;
                    else if (k === 'الحد الأدنى' || k === 'minquantity') minQuantity = val;
                    else if (k === 'معرف التصنيف' || k === 'categoryid') categoryId = val;
                    else if (k === 'category1_ar' || k === 'category' || k === 'تصنيف') categoryName = val;
                    else if (k === 'الوصف' || k === 'description') description = val;
                    else if (k === 'نشط (1/0)' || k === 'active') activeVal = val;
                    else if (k === 'صورة' || k === 'imagelink1' || k === 'imagepath') imagePath = val;
                    else if (k === 'brand_ar') brandAr = val;
                    else if (k === 'brand_en') brandEn = val;
                    else if (k === 'size_ar' || k === 'الحجم') sizeInfo = val;
                }

                if (!name) { 
                    failed++; 
                    if (!firstError) firstError = 'يوجد صفوف لا تحتوي على اسم منتج';
                    continue; 
                }

                barcode = (barcode || '').toString();
                nameEn = (nameEn || '').toString();
                buyPrice = parseFloat(buyPrice || 0);
                sellPrice = parseFloat(sellPrice || 0);
                taxRate = parseFloat(taxRate || 15);
                currentStock = parseFloat(currentStock || 0);
                minQuantity = parseFloat(minQuantity || 0);
                categoryId = parseInt(categoryId || 0);
                categoryName = (categoryName || '').toString();
                description = (description || '').toString();
                const active = activeVal === 0 || activeVal === '0' || activeVal === false ? false : true;
                
                imagePath = (imagePath || '').toString();
                brandAr = (brandAr || '').toString();
                brandEn = (brandEn || '').toString();
                sizeInfo = (sizeInfo || '').toString();

                if ((!categoryId || isNaN(categoryId)) && categoryName) {
                    let existingCat = await prisma.category.findFirst({ where: { name: categoryName } });
                    if (!existingCat) {
                        existingCat = await prisma.category.create({ data: { name: categoryName } });
                    }
                    categoryId = existingCat.id;
                }

                const productData = {
                    name,
                    nameEn,
                    brandAr,
                    brandEn,
                    sizeInfo,
                    imagePath,
                    barcode: barcode ? barcode : undefined,
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
                    await prisma.product.update({
                        where: { id: parseInt(id) },
                        data: productData
                    });
                    updated++;
                } else if (barcode) {
                    const existing = await prisma.product.findUnique({ where: { barcode } });
                    if (existing) {
                        await prisma.product.update({ where: { barcode }, data: productData });
                        updated++;
                    } else {
                        await prisma.product.create({ data: productData });
                        added++;
                    }
                } else {
                    await prisma.product.create({ data: productData });
                    added++;
                }
            } catch (e: any) {
                console.error('Row import failed:', e);
                failed++;
                if (!firstError) firstError = (e && e.message) ? e.message : String(e);
            }
        }

        let rMsg = `تم المعالجة: تمت إضافة ${added}، وتم تحديث ${updated}، وفشل ${failed} صف.`;
        if (failed > 0 && firstError) {
            rMsg += ` (الخطأ الشائع: ${firstError.substring(0, 80)}...)`;
        }

        return NextResponse.json({ 
            success: true, 
            message: rMsg
        });

    } catch (error: any) {
        console.error('Products IMPORT error:', error);
        return NextResponse.json({ error: 'فشل في استيراد المنتجات' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
