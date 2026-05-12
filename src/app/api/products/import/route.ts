import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'products.import' });

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
        let fallbackCounter = 0;

        // Removed $transaction to prevent 30-second timeouts on 10,000+ rows
        for (const row of data) {
            try {
                let id, name, nameEn, barcode, buyPrice, sellPrice, taxRate, currentStock, minQuantity, categoryId, categoryName, description, activeVal, imagePath, brandAr, brandEn, sizeInfo;
                
                // Dynamic resilient key mapping (permissive)
                for (const key of Object.keys(row)) {
                    const k = key.trim().toLowerCase();
                    const val = row[key];
                    if (k === 'id' || k.includes('المعرف')) id = val;
                    else if (k.includes('اسم المنتج') || k.includes('الاسم') || k.includes('اسم الصنف') || k === 'name' || k === 'name_ar') name = val;
                    else if (k.includes('الاسم الإنجليزي') || k.includes('الاسم الانجليزي') || k === 'nameen' || k === 'name_en') nameEn = val;
                    else if (k.includes('باركود') || k.includes('barcode') || k.includes('الرمز')) barcode = val;
                    else if (k.includes('سعر الشراء') || k === 'buyprice') buyPrice = val;
                    else if (k.includes('سعر البيع') || k.includes('sellprice') || k.includes('price')) sellPrice = val;
                    else if (k.includes('الضريبة') || k.includes('tax')) taxRate = val;
                    else if (k.includes('المخزون') || k.includes('stock') || k.includes('الكمية')) currentStock = val;
                    else if (k.includes('الحد الأدنى') || k.includes('minquantity') || k.includes('نقطة الطلب')) minQuantity = val;
                    else if (k.includes('معرف التصنيف') || k.includes('categoryid')) categoryId = val;
                    else if (k.includes('اسم القسم') || k.includes('تصنيف') || k.includes('المجموعة') || k === 'category') categoryName = val;
                    else if (k === 'الوصف' || k === 'description') description = val;
                    else if (k.includes('نشط') || k === 'active') activeVal = val;
                    else if (k.includes('صورة') || k.includes('image')) imagePath = val;
                    else if (k.includes('الماركة عربي') || k === 'brand_ar') brandAr = val;
                    else if (k.includes('الماركة إنجليزي') || k === 'brand_en') brandEn = val;
                    else if (k.includes('الحجم') || k === 'size_ar' || k === 'sizeinfo') sizeInfo = val;
                }

                // Skip completely empty rows (common in Excel)
                if (!name && !barcode && !buyPrice && !sellPrice) {
                    continue;
                }

                if (!name) { 
                    failed++; 
                    if (!firstError) firstError = 'يوجد صفوف لا تحتوي على اسم منتج';
                    continue; 
                }

                let parsedBarcode: string | undefined = (barcode || '').toString().trim();
                if (parsedBarcode === '-' || parsedBarcode === '') parsedBarcode = undefined;
                barcode = parsedBarcode;
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
                    name: (name || 'منتج غير معروف').toString(),
                    nameEn: nameEn ? nameEn.toString() : '',
                    brandAr,
                    brandEn,
                    sizeInfo,
                    imagePath,
                    barcode: barcode ? barcode : null,
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
                    const updateData = { ...productData };
                    if (!barcode) {
                        // @ts-ignore
                        updateData.barcode = undefined;
                    }
                    try {
                        await prisma.product.update({
                            where: { id: parseInt(id) },
                            data: updateData
                        });
                        updated++;
                    } catch (updateErr: any) {
                        if (updateErr.code === 'P2002') {
                            // Barcode is taken by a soft-deleted record or another tenant
                            // @ts-ignore
                            updateData.barcode = undefined;
                            await prisma.product.update({
                                where: { id: parseInt(id) },
                                data: updateData
                            });
                            updated++;
                        } else {
                            throw updateErr;
                        }
                    }
                } else {
                    let existing = null;
                    if (barcode) {
                        existing = await prisma.product.findUnique({ where: { barcode } });
                    }
                    if (!existing) {
                        existing = await prisma.product.findFirst({ where: { name } });
                    }

                    if (existing) {
                        const updateData = { ...productData };
                        if (!barcode) {
                            // @ts-ignore
                            updateData.barcode = undefined;
                        }
                        try {
                            await prisma.product.update({ where: { id: existing.id }, data: updateData });
                            updated++;
                        } catch (updateErr: any) {
                            if (updateErr.code === 'P2002') {
                                // @ts-ignore
                                updateData.barcode = undefined;
                                await prisma.product.update({ where: { id: existing.id }, data: updateData });
                                updated++;
                            } else {
                                throw updateErr;
                            }
                        }
                    } else {
                        try {
                            await prisma.product.create({ data: productData });
                            added++;
                        } catch (createErr: any) {
                            if (createErr.code === 'P2002') {
                                // Global unique constraint violation (exists in another tenant or soft-deleted)
                                // Skip silently as per user request.
                            } else {
                                throw createErr;
                            }
                        }
                    }
                }
            } catch (e) {
                log.error('Row import failed:', e);
                failed++;
                if (!firstError) {
                    const errStr = e instanceof Error ? e.message : String(e);
                    const fallbackBarcode = row['الباركود'] || row['barcode'] || row['barcodes'] || 'غير موجود';
                    firstError = `[الباركود المستهدف: ${fallbackBarcode}] ${errStr}`;
                }
            }
        }

        let rMsg = `تم المعالجة: تمت إضافة ${added}، وتم تحديث ${updated}، وفشل ${failed} صف.`;
        if (failed > 0 && firstError) {
            rMsg += ` (الخطأ الشائع: ${firstError})`;
        }

        return NextResponse.json({ 
            success: true, 
            message: rMsg
        });

    } catch (error: any) {
        log.error('Products IMPORT error:', error);
        return NextResponse.json({ error: 'فشل في استيراد المنتجات' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
