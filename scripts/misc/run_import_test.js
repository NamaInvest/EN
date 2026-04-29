const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const row = {
      Name_ar: 'سائل غسيل العناية بالملابس الأصلي - 1.85 لتر',
      Name_en: 'Liquid Laundry Detergent - Original 1.85L',
      Type_ar: 'مستلزمات المنزل',
      Type_en: 'House Hold',
      'Price (SAR)': 34.95,
      Barcodes: 87002164050,
      Category1_ar: 'منظفات غسيل',
      ImageLink1: 'https://raw.githubusercontent.com/barngaa/supersalman/main/images/Image1.png'
    };

    try {
        const name = row['Name_ar'];
        const barcode = row['Barcodes'].toString();
        const nameEn = row['Name_en'];
        const sellPrice = row['Price (SAR)'];
        const categoryName = row['Category1_ar'];
        const imagePath = row['ImageLink1'];

        let categoryId = 0;
        
        let existingCat = await prisma.category.findFirst({ where: { name: categoryName } });
        if (!existingCat) existingCat = await prisma.category.create({ data: { name: categoryName } });
        categoryId = existingCat.id;

        const productData = {
            name,
            nameEn,
            brandAr: '',
            brandEn: '',
            sizeInfo: '',
            imagePath,
            barcode,
            buyPrice: 0,
            sellPrice,
            taxRate: 15,
            currentStock: 0,
            minQuantity: 0,
            categoryId,
            description: '',
            active: true
        };

        const result = await prisma.product.create({ data: productData });
        console.log('Success:', result);
    } catch (e) {
        console.error('ERROR OCCURRED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
