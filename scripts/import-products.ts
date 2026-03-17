import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

async function main() {
    console.log('📦 بدء استيراد المنتجات من ملف Excel...\n');

    // 1. Read Excel
    const wb = XLSX.readFile('C:\\Users\\1\\Desktop\\Supermarket-Products (2).xlsx');
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws);
    console.log(`📊 عدد المنتجات في الملف: ${rows.length}`);

    // 2. Extract unique categories from Type_ar (main category)
    const categoryNames = [...new Set(rows.map(r => (r['Type_ar'] || '').trim()).filter(Boolean))];
    console.log(`📂 التصنيفات الرئيسية: ${categoryNames.length}`);

    const categoryMap: Record<string, number> = {};
    for (const name of categoryNames) {
        const cat = await prisma.category.upsert({
            where: { id: categoryNames.indexOf(name) + 100 },
            update: { name },
            create: { name },
        });
        categoryMap[name] = cat.id;
    }
    console.log('✅ تم إنشاء التصنيفات\n');

    // 3. Import products in batches
    const BATCH = 500;
    let imported = 0;
    let skipped = 0;
    const seenBarcodes = new Set<string>();

    for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);

        for (const row of batch) {
            try {
                const name = (row['Name_ar'] || '').trim();
                if (!name) { skipped++; continue; }

                const nameEn = (row['Name_en'] || '').trim();
                const typeAr = (row['Type_ar'] || '').trim();
                const priceStr = (row['Price (SAR)'] || '0').toString().replace(/[^\d.]/g, '');
                const price = parseFloat(priceStr) || 0;
                const barcodeRaw = (row['Barcodes'] || '').toString().trim();
                const barcodes = barcodeRaw.split(',').map((b: string) => b.trim()).filter(Boolean);
                const barcode = barcodes[0] || null;
                const sizeAr = (row['Size_ar'] || '').trim();
                const brandAr = (row['Brand_ar'] || '').trim();
                const brandEn = (row['Brand_en'] || '').trim();
                const imageUrl = (row['ImageLink1'] || '').trim();
                const categoryId = categoryMap[typeAr] || null;

                // Skip duplicate barcodes
                if (barcode && seenBarcodes.has(barcode)) {
                    skipped++;
                    continue;
                }
                if (barcode) seenBarcodes.add(barcode);

                await prisma.product.create({
                    data: {
                        name,
                        nameEn,
                        barcode: barcode || null,
                        categoryId,
                        unitId: 1, // حبة
                        buyPrice: price * 0.7, // تقدير سعر الشراء 70% من البيع
                        sellPrice: price,
                        taxRate: 15,
                        minQuantity: 5,
                        currentStock: 50, // مخزون افتراضي
                        sizeInfo: sizeAr,
                        brandAr,
                        brandEn,
                        imagePath: imageUrl,
                        active: true,
                    },
                });
                imported++;
            } catch (err: unknown) {
                skipped++;
                const msg = err instanceof Error ? err.message : '';
                if (!msg.includes('Unique constraint')) {
                    // Only log non-duplicate errors
                    // console.error(`⚠️ ${(row['Name_ar'] || '').substring(0, 30)}: ${msg.substring(0, 60)}`);
                }
            }
        }

        const pct = Math.round(((i + batch.length) / rows.length) * 100);
        process.stdout.write(`\r⏳ تقدم: ${pct}% | تم استيراد: ${imported} | تخطي: ${skipped}`);
    }

    console.log(`\n\n🎉 تم الاستيراد بنجاح!`);
    console.log(`✅ منتجات مستوردة: ${imported}`);
    console.log(`⏩ تم تخطي: ${skipped}`);
    console.log(`📂 تصنيفات: ${categoryNames.length}`);
}

main()
    .catch((e) => { console.error('\n❌ خطأ:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
