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

        const allowed = await hasPermission(auth.userId, 'dashboard', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const formData = await request.formData();
        const file = formData.get('file') as Blob | null;

        if (!file) {
            return NextResponse.json({ error: 'لم يتم العثور على ملف' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const wb = xlsx.read(buffer, { type: 'buffer' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const data: any[] = xlsx.utils.sheet_to_json(ws);
        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'الملف فارغ أو لا يمكن قراءته' }, { status: 400 });
        }

        log.info(`[Import] Starting BATCH import of ${data.length} rows`);
        const startTime = Date.now();

        // ══════════════════════════════════════════════════════════════
        // STEP 1: Ensure a default unit exists (single query)
        // ══════════════════════════════════════════════════════════════
        let defaultUnitId = 1;
        try {
            const firstUnit = await prisma.unit.findFirst({});
            if (firstUnit) {
                defaultUnitId = firstUnit.id;
            } else {
                const newUnit = await prisma.unit.create({ data: { name: 'حبة' } });
                defaultUnitId = newUnit.id;
            }
        } catch (unitErr) {
            log.warn('[Import] Could not resolve default unit, using id=1');
        }

        // ══════════════════════════════════════════════════════════════
        // STEP 2: Pre-fetch ALL existing products for this tenant (ONE query)
        // ══════════════════════════════════════════════════════════════
        const existingProducts = await prisma.product.findMany({
            select: { id: true, barcode: true, name: true }
        });
        
        // Build lookup maps for O(1) access
        const barcodeMap = new Map<string, number>();
        const nameMap = new Map<string, number>();
        for (const p of existingProducts) {
            if (p.barcode) barcodeMap.set(p.barcode, p.id);
            nameMap.set(p.name, p.id);
        }
        log.info(`[Import] Pre-fetched ${existingProducts.length} existing products (barcode index: ${barcodeMap.size}, name index: ${nameMap.size})`);

        // ══════════════════════════════════════════════════════════════
        // STEP 3: Pre-fetch ALL categories (ONE query)
        // ══════════════════════════════════════════════════════════════
        const existingCategories = await prisma.category.findMany({
            select: { id: true, name: true }
        });
        const categoryMap = new Map<string, number>();
        for (const c of existingCategories) {
            categoryMap.set(c.name, c.id);
        }

        // ══════════════════════════════════════════════════════════════
        // STEP 4: Parse ALL rows into structured data
        // ══════════════════════════════════════════════════════════════
        let skipped = 0;
        let failed = 0;
        let firstError = '';
        const toCreate: any[] = [];
        const toUpdate: { id: number; data: any }[] = [];
        const categoriesToCreate = new Set<string>();

        for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
            const row = data[rowIndex];
            try {
                let id: any, name: any, nameEn: any, barcode: any, buyPrice: any, sellPrice: any;
                let taxRate: any, currentStock: any, minQuantity: any, categoryId: any;
                let categoryName: any, description: any, activeVal: any;
                let imagePath: any, brandAr: any, brandEn: any, sizeInfo: any;
                
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

                // Skip empty rows
                if (!name && !barcode && !buyPrice && !sellPrice) {
                    skipped++;
                    continue;
                }

                if (!name) {
                    failed++;
                    if (!firstError) firstError = `صف ${rowIndex + 1}: لا يحتوي على اسم منتج`;
                    continue;
                }

                // Parse values
                let parsedBarcode: string | null = (barcode || '').toString().trim();
                if (parsedBarcode === '-' || parsedBarcode === '' || parsedBarcode === '0') parsedBarcode = null;

                nameEn = (nameEn || '').toString();
                buyPrice = parseFloat(buyPrice || 0);
                sellPrice = parseFloat(sellPrice || 0);
                taxRate = parseFloat(taxRate || 15);
                currentStock = parseFloat(currentStock || 0);
                minQuantity = parseFloat(minQuantity || 0);
                categoryId = parseInt(categoryId || 0);
                categoryName = (categoryName || '').toString().trim();
                description = (description || '').toString();
                const active = activeVal === 0 || activeVal === '0' || activeVal === false ? false : true;
                imagePath = (imagePath || '').toString();
                brandAr = (brandAr || '').toString();
                brandEn = (brandEn || '').toString();
                sizeInfo = (sizeInfo || '').toString();

                // Resolve category
                let resolvedCategoryId: number | null = null;
                if (categoryId && !isNaN(categoryId) && categoryId > 0) {
                    resolvedCategoryId = categoryId;
                } else if (categoryName) {
                    if (categoryMap.has(categoryName)) {
                        resolvedCategoryId = categoryMap.get(categoryName)!;
                    } else {
                        categoriesToCreate.add(categoryName);
                        resolvedCategoryId = -1; // Placeholder — will be resolved after batch category creation
                    }
                }

                const productData = {
                    name: (name || 'منتج غير معروف').toString(),
                    nameEn,
                    brandAr,
                    brandEn,
                    sizeInfo,
                    imagePath,
                    barcode: parsedBarcode,
                    buyPrice: isNaN(buyPrice) ? 0 : buyPrice,
                    sellPrice: isNaN(sellPrice) ? 0 : sellPrice,
                    taxRate: isNaN(taxRate) ? 15 : taxRate,
                    currentStock: isNaN(currentStock) ? 0 : currentStock,
                    minQuantity: isNaN(minQuantity) ? 0 : minQuantity,
                    categoryId: resolvedCategoryId === -1 ? null : resolvedCategoryId,
                    unitId: defaultUnitId,
                    description,
                    active,
                    _categoryName: categoryName, // Temporary field for post-processing
                };

                // Determine: create or update?
                let existingId: number | null = null;
                if (id) {
                    existingId = parseInt(id);
                } else if (parsedBarcode && barcodeMap.has(parsedBarcode)) {
                    existingId = barcodeMap.get(parsedBarcode)!;
                } else if (nameMap.has(productData.name)) {
                    existingId = nameMap.get(productData.name)!;
                }

                if (existingId) {
                    const { _categoryName, ...updatePayload } = productData;
                    if (!parsedBarcode) delete (updatePayload as any).barcode;
                    toUpdate.push({ id: existingId, data: updatePayload });
                } else {
                    toCreate.push(productData);
                    // Add to maps to prevent duplicate creates within the same file
                    if (parsedBarcode) barcodeMap.set(parsedBarcode, -1);
                    nameMap.set(productData.name, -1);
                }
            } catch (e) {
                failed++;
                if (!firstError) {
                    firstError = `صف ${rowIndex + 1}: ${e instanceof Error ? e.message : String(e)}`;
                }
            }
        }

        log.info(`[Import] Parsed: ${toCreate.length} to create, ${toUpdate.length} to update, ${failed} failed, ${skipped} skipped`);

        // ══════════════════════════════════════════════════════════════
        // STEP 5: Batch-create missing categories
        // ══════════════════════════════════════════════════════════════
        if (categoriesToCreate.size > 0) {
            for (const catName of categoriesToCreate) {
                try {
                    const newCat = await prisma.category.create({ data: { name: catName } });
                    categoryMap.set(catName, newCat.id);
                } catch (e) {
                    // Category might already exist (race condition) — try to find it
                    const existing = await prisma.category.findFirst({ where: { name: catName } });
                    if (existing) categoryMap.set(catName, existing.id);
                }
            }

            // Resolve placeholder categoryIds
            for (const item of toCreate) {
                if (item._categoryName && categoryMap.has(item._categoryName)) {
                    item.categoryId = categoryMap.get(item._categoryName)!;
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // STEP 6: Batch CREATE new products using createMany
        // ══════════════════════════════════════════════════════════════
        let added = 0;
        const BATCH_SIZE = 500;

        if (toCreate.length > 0) {
            // Remove temporary _categoryName field and deduplicate barcodes
            const seenBarcodes = new Set<string>();
            const cleanedCreateData: any[] = [];

            for (const item of toCreate) {
                const { _categoryName, ...cleanItem } = item;
                // Handle duplicate barcodes within the file
                if (cleanItem.barcode) {
                    if (seenBarcodes.has(cleanItem.barcode)) {
                        cleanItem.barcode = null; // Duplicate barcode in file — set to null
                    } else {
                        seenBarcodes.add(cleanItem.barcode);
                    }
                }
                cleanedCreateData.push(cleanItem);
            }

            // Process in batches
            for (let i = 0; i < cleanedCreateData.length; i += BATCH_SIZE) {
                const batch = cleanedCreateData.slice(i, i + BATCH_SIZE);
                try {
                    const result = await prisma.product.createMany({
                        data: batch,
                        skipDuplicates: true,
                    });
                    added += result.count;
                    log.info(`[Import] Batch ${Math.floor(i / BATCH_SIZE) + 1}: created ${result.count}/${batch.length}`);
                } catch (batchErr: any) {
                    // If batch fails, fall back to individual inserts for this batch
                    log.warn(`[Import] Batch createMany failed, falling back to individual inserts: ${batchErr.message}`);
                    for (const item of batch) {
                        try {
                            await prisma.product.create({ data: item });
                            added++;
                        } catch (individualErr: any) {
                            if (individualErr.code === 'P2002') {
                                // Duplicate — skip
                            } else {
                                failed++;
                                if (!firstError) firstError = `خطأ إنشاء: ${individualErr.message}`;
                            }
                        }
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // STEP 7: Batch UPDATE existing products
        // ══════════════════════════════════════════════════════════════
        let updated = 0;

        if (toUpdate.length > 0) {
            for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
                const batch = toUpdate.slice(i, i + BATCH_SIZE);
                // Updates must be individual in Prisma (no updateMany with different data per row)
                const updatePromises = batch.map(async ({ id, data: updateData }) => {
                    try {
                        await prisma.product.update({ where: { id }, data: updateData });
                        updated++;
                    } catch (updateErr: any) {
                        if (updateErr.code === 'P2002') {
                            // Barcode collision — retry without barcode
                            try {
                                delete updateData.barcode;
                                await prisma.product.update({ where: { id }, data: updateData });
                                updated++;
                            } catch { failed++; }
                        } else if (updateErr.code === 'P2025') {
                            // Record not found — skip
                            failed++;
                        } else {
                            failed++;
                            if (!firstError) firstError = `خطأ تحديث id=${id}: ${updateErr.message}`;
                        }
                    }
                });
                
                // Run updates in parallel within each batch (max 500 concurrent)
                await Promise.all(updatePromises);
                log.info(`[Import] Update batch ${Math.floor(i / BATCH_SIZE) + 1}: processed ${batch.length}`);
            }
        }

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
        log.info(`[Import] COMPLETED in ${totalTime}s: total=${data.length}, added=${added}, updated=${updated}, failed=${failed}, skipped=${skipped}`);

        let rMsg = `تم المعالجة في ${totalTime} ثانية: تمت إضافة ${added}، وتم تحديث ${updated}، وفشل ${failed} صف.`;
        if (skipped > 0) {
            rMsg += ` (تم تخطي ${skipped} صف فارغ)`;
        }
        if (failed > 0 && firstError) {
            rMsg += ` (أول خطأ: ${firstError})`;
        }

        return NextResponse.json({ 
            success: true, 
            message: rMsg,
            stats: { total: data.length, added, updated, failed, skipped, timeSeconds: parseFloat(totalTime) }
        });

    } catch (error: any) {
        log.error('[Import] FATAL error:', error);
        return NextResponse.json({ error: `فشل في استيراد المنتجات: ${error.message}` }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'UPLOAD' });
