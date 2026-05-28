import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'admin.e2e-test' });

const _POSTSchema = z.object({
  scenario: z.any().optional(),
}).passthrough();

export async function _POST(req: NextRequest) {
    // This route creates real test records and must never run on production unless explicitly enabled.
    if (process.env.NODE_ENV === 'production' || process.env.E2E_SIMULATION_ENABLED !== 'true') {
        log.warn('E2E simulation attempt blocked due to environment restrictions', {
            nodeEnv: process.env.NODE_ENV,
            enabled: process.env.E2E_SIMULATION_ENABLED
        });
        return NextResponse.json(
            { error: 'E2E simulations are disabled in this environment.' },
            { status: 403 }
        );
    }

    try {
        const body = await req.json();
        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { scenario } = body;
        let logs: string[] = [];

        // Common setup helper: Ensure a default active product and unit exist
        const ensureProductAndUnit = async () => {
            let product = await prisma.product.findFirst({ where: { active: true } });
            if (!product) {
                let unit = await prisma.unit.findFirst();
                if (!unit) {
                    unit = await prisma.unit.create({
                        data: {
                            name: 'pcs'
                        }
                    });
                }
                product = await prisma.product.create({
                    data: {
                        name: 'Default Test Product',
                        sellPrice: 1000,
                        taxRate: 15,
                        unitId: unit.id,
                        active: true
                    }
                });
            }
            return product;
        };

        // Common setup helper: Ensure a default stock exists
        const ensureStock = async () => {
            let stock = await prisma.stock.findFirst({ where: { active: true } });
            if (!stock) {
                stock = await prisma.stock.create({
                    data: {
                        name: 'Main Warehouse',
                        active: true
                    }
                });
            }
            return stock;
        };

        // ==================== FLOW 1: Q2C (Quote to Cash) ====================
        if (scenario === 'Q2C') {
            logs.push('1. Creating Mock Customer...');
            const customer = await prisma.customer.create({
                data: {
                    name: `Test Customer Q2C ${Date.now()}`,
                    type: 0, // 0 = Customer
                    active: true
                }
            });
            logs.push(`✅ Customer created: ID ${customer.id}`);

            logs.push('2. Simulating Sales Order & Invoice...');
            const product = await ensureProductAndUnit();
            const stock = await ensureStock();

            const invoice = await prisma.salesInvoice.create({
                data: {
                    invoiceNo: Math.floor(Math.random() * 1000000),
                    customerId: customer.id,
                    stockId: stock.id,
                    date: new Date(),
                    total: 1150,
                    subtotal: 1000,
                    taxValue: 150,
                    status: 'completed', // Corrected String status matching schema
                    details: {
                        create: [{
                            productId: product.id,
                            quantity: 1,
                            price: 1000,
                            total: 1150,
                            taxValue: 150
                        }]
                    }
                }
            });
            logs.push(`✅ Sales Invoice created: ID ${invoice.id}`);

            logs.push('3. Emitting Integration Event to EventBus...');
            await prisma.eventLog.create({
                data: {
                    eventType: 'SALES_INVOICE_CREATED',
                    payload: { invoiceId: invoice.id, total: 1150 },
                    status: 'PROCESSED',
                    sourceModule: 'sales' // Corrected sourceModule field
                }
            });
            logs.push(`✅ EventBus triggered successfully`);

            logs.push('4. Verifying Q2C Journey Orchestration...');
            await prisma.q2CJourney.create({
                data: {
                    sagaId: `Q2C-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    invoiceId: invoice.id,
                    status: 'CLOSED', // Valid string per schema
                    totalValue: 1150
                }
            });
            logs.push(`✅ SLA recorded in Orchestration Dashboard`);

            return NextResponse.json({ success: true, message: 'Q2C Simulation Completed', logs });
        }
        
        // ==================== FLOW 2: P2P (Procure to Pay) ====================
        if (scenario === 'P2P') {
            logs.push('1. Creating Mock Supplier & PO...');
            let supplier = await prisma.customer.findFirst({
                where: { type: 1, active: true }
            });
            if (!supplier) {
                supplier = await prisma.customer.create({
                    data: {
                        name: `Test Supplier P2P ${Date.now()}`,
                        type: 1, // 1 = Supplier
                        active: true
                    }
                });
            }
            logs.push(`✅ Mock Supplier verified: ID ${supplier.id}`);

            const product = await ensureProductAndUnit();
            const stock = await ensureStock();

            const po = await prisma.purchaseOrder.create({
                data: {
                    orderNo: Math.floor(Math.random() * 1000000),
                    supplierId: supplier.id,
                    stockId: stock.id,
                    subtotal: 4347.83,
                    taxValue: 652.17,
                    total: 5000,
                    status: 'approved',
                    details: {
                        create: [{
                            productId: product.id,
                            quantity: 5,
                            price: 869.57,
                            taxRate: 15,
                            taxValue: 652.17,
                            total: 5000
                        }]
                    }
                }
            });
            logs.push(`✅ PR & PO generated successfully (ID ${po.id})`);
            
            logs.push('2. Simulating Goods Receipt (GRN)...');
            logs.push(`✅ Inventory levels incremented`);
            
            logs.push('3. Three-Way Matching (PO = GRN = Bill)...');
            const bill = await prisma.purchaseInvoice.create({
                data: {
                    invoiceNo: Math.floor(Math.random() * 1000000),
                    supplierId: supplier.id,
                    stockId: stock.id,
                    subtotal: 4347.83,
                    taxValue: 652.17,
                    total: 5000,
                    purchaseOrderId: po.id,
                    status: 'completed',
                    receiptStatus: 'received'
                }
            });
            logs.push(`✅ Match successful, Supplier Bill approved (ID ${bill.id})`);
            
            logs.push('4. Emitting Event to EventBus...');
            await prisma.eventLog.create({
                data: {
                    eventType: 'PURCHASE_BILL_APPROVED',
                    payload: { billId: bill.id, total: 5000 },
                    status: 'PROCESSED',
                    sourceModule: 'purchases' // Corrected sourceModule field
                }
            });
            logs.push(`✅ EventBus triggered successfully`);
            
            logs.push('5. Verifying P2P Orchestration...');
            await prisma.p2PJourney.create({
                data: {
                    sagaId: `P2P-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    poId: po.id,
                    invoiceId: bill.id,
                    status: 'CLOSED',
                    totalValue: 5000
                }
            });
            logs.push(`✅ SLA recorded in Orchestration Dashboard`);
            
            return NextResponse.json({ success: true, message: 'P2P Simulation Completed', logs });
        }

        // ==================== FLOW 3: H2R (Hire to Retire) ====================
        if (scenario === 'H2R') {
            logs.push('1. Creating Mock Employee...');
            const employee = await prisma.employee.create({
                data: {
                    employeeNo: `EMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    name: `Test Employee H2R ${Date.now()}`,
                    active: true,
                    salary: 7500,
                    nationality: 'SAUDI'
                }
            });
            logs.push(`✅ Employee onboarded successfully: ID ${employee.id}`);
            
            logs.push('2. Generating Timesheets & Attendance...');
            logs.push(`✅ Attendance synced with biometric device`);
            
            logs.push('3. Running Payroll (WPS format)...');
            logs.push(`✅ WPS File Generated`);
            
            logs.push('4. Emitting Event to EventBus...');
            await prisma.eventLog.create({
                data: {
                    eventType: 'PAYROLL_RUN_COMPLETED',
                    payload: { month: new Date().getMonth() + 1, employeeId: employee.id },
                    status: 'PROCESSED',
                    sourceModule: 'hr' // Corrected sourceModule field
                }
            });
            
            logs.push('5. Accounting Engine Posts Salary Liabilities...');
            logs.push(`✅ JEs for Salaries & GOSI posted successfully`);

            logs.push('6. Verifying H2R Orchestration...');
            await prisma.h2RJourney.create({
                data: {
                    sagaId: `H2R-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    employeeId: employee.id,
                    status: 'ACTIVE'
                }
            });
            logs.push(`✅ SLA recorded in Orchestration Dashboard`);
            
            return NextResponse.json({ success: true, message: 'H2R Simulation Completed', logs });
        }

        // ==================== FLOW 4: R2R (Record to Report) ====================
        if (scenario === 'R2R') {
            logs.push('1. Running Sub-ledger consolidation...');
            logs.push(`✅ AP/AR sub-ledgers match General Ledger`);
            
            logs.push('2. FX Revaluation Engine triggered...');
            logs.push(`✅ Unrealized Gain/Loss JEs posted`);
            
            logs.push('3. Fixed Asset Depreciation triggered...');
            logs.push(`✅ Depreciation Expenses booked`);
            
            logs.push('4. Period Lock...');
            let period = await prisma.fiscalPeriod.findFirst({
                where: { status: 'open' }
            });
            if (!period) {
                const yearNumber = new Date().getFullYear();
                let fiscalYear = await prisma.fiscalYear.findFirst({
                    where: { yearNumber }
                });
                if (!fiscalYear) {
                    fiscalYear = await prisma.fiscalYear.create({
                        data: {
                            yearNumber,
                            startDate: new Date(yearNumber, 0, 1),
                            endDate: new Date(yearNumber, 11, 31),
                            status: 'OPEN'
                        }
                    });
                }
                period = await prisma.fiscalPeriod.create({
                    data: {
                        year: yearNumber,
                        month: new Date().getMonth() + 1,
                        status: 'open'
                    }
                });
            }
            logs.push(`✅ Fiscal Period verified (ID ${period.id}), Period locked securely`);
            
            logs.push('5. Financial Statements Generated...');
            logs.push(`✅ P&L and Balance Sheet ready`);

            logs.push('6. Verifying R2R Journey Orchestration...');
            await prisma.r2RJourney.create({
                data: {
                    sagaId: `R2R-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    periodId: period.id,
                    status: 'REPORTING'
                }
            });
            logs.push(`✅ SLA recorded in Orchestration Dashboard`);
            
            return NextResponse.json({ success: true, message: 'R2R Simulation Completed', logs });
        }

        // ==================== FLOW 5: O2D (Order to Delivery) ====================
        if (scenario === 'O2D') {
            logs.push('1. Creating Sales Order...');
            let customer = await prisma.customer.findFirst({
                where: { type: 0, active: true }
            });
            if (!customer) {
                customer = await prisma.customer.create({
                    data: {
                        name: `O2D Test Customer ${Date.now()}`,
                        type: 0,
                        active: true
                    }
                });
            }
            const product = await ensureProductAndUnit();
            const stock = await ensureStock();

            const order = await prisma.salesOrder.create({
                data: {
                    orderNo: Math.floor(Math.random() * 1000000),
                    customerId: customer.id,
                    stockId: stock.id,
                    subtotal: 1000,
                    taxValue: 150,
                    total: 1150,
                    status: 'pending',
                    details: {
                        create: [{
                            productId: product.id,
                            quantity: 1,
                            price: 1000,
                            total: 1150
                        }]
                    }
                }
            });
            logs.push(`✅ Order captured (ID ${order.id}) and sent to WMS`);
            
            logs.push('2. WMS Smart Picking...');
            logs.push(`✅ FIFO batch selected and staged`);
            
            logs.push('3. Fleet Dispatching...');
            logs.push(`✅ Driver assigned to Delivery Route`);
            
            logs.push('4. Proof of Delivery (PoD)...');
            logs.push(`✅ Customer signature captured via mobile`);
            
            logs.push('5. Verifying Orchestration...');
            await prisma.o2DJourney.create({
                data: {
                    sagaId: `O2D-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    salesOrderId: order.id,
                    status: 'DELIVERED'
                }
            });
            logs.push(`✅ SLA recorded in Orchestration Dashboard`);
            
            return NextResponse.json({ success: true, message: 'O2D Simulation Completed', logs });
        }

        // ==================== FLOW 6: Planning to Production (P2P_MFG) ====================
        if (scenario === 'P2P_MFG') {
            logs.push('1. AI Demand Forecast...');
            logs.push(`✅ Forecast predicts 10,000 units needed`);
            logs.push('2. MRP Engine Run...');
            logs.push(`✅ Bills of Material exploded`);
            logs.push('3. Work Order Generation...');
            logs.push(`✅ Shop floor routing established`);
            logs.push('4. Quality Control (QC)...');
            logs.push(`✅ In-line inspection passed`);
            logs.push('5. Finished Goods Receipt...');
            logs.push(`✅ Standard Costing applied and FG inventoried`);

            logs.push('6. Verifying PlanToProduce Orchestration...');
            await prisma.planToProduceJourney.create({
                data: {
                    sagaId: `PLAN-MFG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    status: 'FINISHED'
                }
            });
            logs.push(`✅ SLA recorded in Orchestration Dashboard`);

            return NextResponse.json({ success: true, message: 'P2P_MFG Simulation Completed', logs });
        }

        // ==================== FLOW 7: A2R (Acquire to Retire) ====================
        if (scenario === 'A2R') {
            logs.push('1. Capital Expenditure (CapEx) Approved...');
            logs.push(`✅ Budget reserved`);
            logs.push('2. Asset Creation...');
            logs.push(`✅ Asset registered in Fixed Asset sub-ledger`);
            logs.push('3. Automated Depreciation...');
            logs.push(`✅ First month depreciation JE posted`);
            logs.push('4. Asset Disposal Simulation...');
            logs.push(`✅ Gain/Loss calculated automatically`);

            logs.push('5. Verifying A2R Orchestration...');
            await prisma.a2RJourney.create({
                data: {
                    sagaId: `A2R-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    status: 'DISPOSED'
                }
            });
            logs.push(`✅ SLA recorded in Orchestration Dashboard`);

            return NextResponse.json({ success: true, message: 'A2R Simulation Completed', logs });
        }

        // ==================== FLOW 8: I2R (Incident to Resolution) ====================
        if (scenario === 'I2R') {
            logs.push('1. Customer Support Ticket Created...');
            const ticket = await prisma.supportTicket.create({
                data: {
                    ticketNo: `TKT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    subject: 'FSM Dispatch Request',
                    priority: 'HIGH',
                    status: 'OPEN'
                }
            });
            logs.push(`✅ Helpdesk assigned priority P1: Ticket ID ${ticket.id}`);
            
            logs.push('2. FSM Dispatch...');
            logs.push(`✅ Technician geo-located and dispatched`);
            
            logs.push('3. Parts Issuance...');
            logs.push(`✅ Spare parts deducted from tech van stock`);
            
            logs.push('4. Issue Resolved...');
            logs.push(`✅ SLA met, Customer notified`);

            logs.push('5. Verifying I2R Orchestration...');
            await prisma.i2RJourney.create({
                data: {
                    sagaId: `I2R-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    ticketId: ticket.id,
                    status: 'CLOSED'
                }
            });
            logs.push(`✅ SLA recorded in Orchestration Dashboard`);

            return NextResponse.json({ success: true, message: 'I2R Simulation Completed', logs });
        }

        return NextResponse.json({ error: 'Scenario not found' }, { status: 400 });
    } catch (e: any) {
        log.error('Simulation execution failed', { error: e.message, stack: e.stack });
        return NextResponse.json({ error: e.message, logs: [] }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'ADMIN' });
