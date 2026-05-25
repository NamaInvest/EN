import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Master Enterprise Seeder (dummy data for all modules).
 * This script uses a fixed demo tenant to avoid touching production tenant data.
 */
async function main() {
    const TEST_TENANT = 'demo_tenant_01';
    console.log(`Starting Master Enterprise Seeder for Tenant: ${TEST_TENANT}`);

    // 1. Core setup: clear existing demo data in dependency order.
    console.log('Cleaning up old demo data...');
    try {
        await prisma.salesInvoice.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.journalEntry.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.employee.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.productStock.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.product.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.customer.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.account.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.category.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.unit.deleteMany({ where: { tenantId: TEST_TENANT } });
        await prisma.stock.deleteMany({ where: { tenantId: TEST_TENANT } });
    } catch {
        console.log('Info: Cleanup skipped or partially failed (expected on first run).');
    }

    // 2. Accounting module (chart of accounts).
    console.log('Seeding Accounting Module...');
    await prisma.account.create({
        data: {
            tenantId: TEST_TENANT,
            code: '1001',
            name: 'Main Cash Box',
            nameEn: 'Main Cash Box',
            type: 'asset',
            isActive: true,
            balance: 500000.00
        }
    });

    await prisma.account.create({
        data: {
            tenantId: TEST_TENANT,
            code: '4001',
            name: 'Sales Revenue',
            nameEn: 'Sales Revenue',
            type: 'revenue',
            isActive: true,
            balance: 0.00
        }
    });

    // 3. Inventory and POS products.
    console.log('Seeding Inventory and POS Products...');
    const category = await prisma.category.create({
        data: {
            tenantId: TEST_TENANT,
            name: 'Electronics'
        }
    });

    const unit = await prisma.unit.create({
        data: {
            tenantId: TEST_TENANT,
            name: 'Piece'
        }
    });

    const stock = await prisma.stock.create({
        data: {
            tenantId: TEST_TENANT,
            name: 'Main Warehouse',
            active: true
        }
    });

    const product = await prisma.product.create({
        data: {
            tenantId: TEST_TENANT,
            barcode: 'ITM-001',
            name: 'Dell Pro Laptop',
            nameEn: 'Dell Pro Laptop',
            buyPrice: 2800.00,
            sellPrice: 3500.00,
            taxRate: 15.0,
            categoryId: category.id,
            unitId: unit.id,
            active: true,
            currentStock: 10
        }
    });

    await prisma.productStock.create({
        data: {
            tenantId: TEST_TENANT,
            productId: product.id,
            stockId: stock.id,
            quantity: 10
        }
    });

    // 4. Sales and customers.
    console.log('Seeding Sales and Customers...');
    const customer = await prisma.customer.create({
        data: {
            tenantId: TEST_TENANT,
            customerNo: 'CUST-101',
            name: 'Modern Tech Corp',
            email: 'info@moderntech.sa',
            phone: '+966500000001',
            taxNumber: '310000000000003'
        }
    });

    await prisma.salesInvoice.create({
        data: {
            tenantId: TEST_TENANT,
            invoiceNo: 2026001,
            customerId: customer.id,
            stockId: stock.id,
            status: 'completed',
            date: new Date(),
            subtotal: 3500.00,
            taxValue: 525.00,
            total: 4025.00,
            paid: 4025.00,
            remaining: 0.00,
            details: {
                create: [
                    {
                        tenantId: TEST_TENANT,
                        productId: product.id,
                        productName: product.name,
                        quantity: 1,
                        price: 3500.00,
                        taxRate: 15.0,
                        taxValue: 525.00,
                        total: 4025.00
                    }
                ]
            }
        }
    });

    // 5. HR and payroll.
    console.log('Seeding HR and Payroll Module...');
    await prisma.employee.create({
        data: {
            tenantId: TEST_TENANT,
            employeeNo: 'EMP-001',
            name: 'Ahmed Abdullah',
            idNumber: '1000000001',
            position: 'Sales Manager',
            salary: 8000.00,
            housingAllowance: 2000.00,
            startDate: '2024-01-01',
            active: true
        }
    });

    console.log('Master Seed Completed Successfully for all Departments.');
}

main()
    .catch((error) => {
        console.error('Seeding Failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
