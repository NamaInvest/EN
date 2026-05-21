import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Master Enterprise Seeder (Dummy Data for All Modules)
 * This script strictly uses a test tenant to avoid polluting real production data.
 */
async function main() {
    const TEST_TENANT = 'demo_tenant_01';
    console.log(`🌱 Starting Master Enterprise Seeder for Tenant: ${TEST_TENANT}`);

    // 1. Core Setup: Clear existing demo data (safely scoped)
    console.log('🧹 Cleaning up old demo data...');
    try {
        await prisma.invoice.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.journalEntry.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.employee.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.item.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.customer.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.account.deleteMany({ where: { tenantId: TEST_TENANT } });
    } catch (e) {
        console.log('Info: Cleanup skipped or partially failed (expected on first run).');
    }

    // 2. Accounting Module (Chart of Accounts)
    console.log('💰 Seeding Accounting Module...');
    const cashAccount = await prisma.account.create({
        data: {
            tenantId: TEST_TENANT,
            code: '1001',
            nameAr: 'صندوق النقد الرئيسي',
            nameEn: 'Main Cash Box',
            type: 'ASSET',
            category: 'CASH',
            isActive: true,
            balance: 500000.00
        }
    });

    const salesRevenueAccount = await prisma.account.create({
        data: {
            tenantId: TEST_TENANT,
            code: '4001',
            nameAr: 'إيرادات المبيعات',
            nameEn: 'Sales Revenue',
            type: 'REVENUE',
            category: 'SALES',
            isActive: true,
            balance: 0.00
        }
    });

    // 3. Inventory & Items (POS / Sales)
    console.log('📦 Seeding Inventory & POS Items...');
    const cat1 = await prisma.category.create({
        data: {
            tenantId: TEST_TENANT,
            nameAr: 'إلكترونيات',
            nameEn: 'Electronics',
            type: 'PRODUCT'
        }
    });

    const item1 = await prisma.item.create({
        data: {
            tenantId: TEST_TENANT,
            code: 'ITM-001',
            nameAr: 'لابتوب ديل برو',
            nameEn: 'Dell Pro Laptop',
            type: 'PRODUCT',
            price: 3500.00,
            cost: 2800.00,
            categoryId: cat1.id,
            isActive: true,
            hasVat: true,
            vatRate: 15.0
        }
    });

    // 4. Sales & Customers
    console.log('🛒 Seeding Sales & Customers...');
    const customer = await prisma.customer.create({
        data: {
            tenantId: TEST_TENANT,
            code: 'CUST-101',
            nameAr: 'شركة التقنية الحديثة',
            nameEn: 'Modern Tech Corp',
            email: 'info@moderntech.sa',
            phone: '+966500000001',
            vatNumber: '310000000000003'
        }
    });

    await prisma.invoice.create({
        data: {
            tenantId: TEST_TENANT,
            invoiceNo: 'INV-2026-001',
            customerId: customer.id,
            type: 'SALES',
            status: 'PAID',
            date: new Date(),
            dueDate: new Date(),
            subTotal: 3500.00,
            vatAmount: 525.00,
            totalAmount: 4025.00,
            items: {
                create: [
                    {
                        itemId: item1.id,
                        quantity: 1,
                        unitPrice: 3500.00,
                        totalPrice: 4025.00,
                        vatAmount: 525.00,
                        vatRate: 15.0
                    }
                ]
            }
        }
    });

    // 5. HR & Payroll
    console.log('👥 Seeding HR & Payroll Module...');
    await prisma.employee.create({
        data: {
            tenantId: TEST_TENANT,
            code: 'EMP-001',
            nameAr: 'أحمد عبدالله',
            nameEn: 'Ahmed Abdullah',
            email: 'ahmed@demo.com',
            nationalId: '1000000001',
            position: 'Sales Manager',
            basicSalary: 8000.00,
            housingAllowance: 2000.00,
            joinDate: new Date('2024-01-01'),
            isActive: true
        }
    });

    // 6. Medical/Clinics Module (Optional)
    console.log('🏥 Seeding Medical Clinics Module...');
    try {
        await prisma.clinic.create({
            data: {
                tenantId: TEST_TENANT,
                nameAr: 'عيادة الأسنان',
                nameEn: 'Dental Clinic',
                isActive: true
            }
        });
    } catch(e) {
         console.log('Info: Medical schema not active, skipping clinic seed.');
    }

    console.log('✅ Master Seed Completed Successfully for all Departments!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding Failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
