import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { postSalesInvoice } from '@/lib/auto-journal';
import { initializeZatca, generateZatcaQR, getQrCodeContent, generateZATCAXml, generateZatcaQRContent } from '@/lib/zatca';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const branchQuery = searchParams.get('branchId');
        const invoiceNoQuery = searchParams.get('invoiceNo');

        const auth = getUserFromRequest(request);
        const user = auth?.userId ? await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, branchId: true } }) : null;

        const where: Record<string, unknown> = {};
        if (from || to) {
            where.date = {};
            if (from) (where.date as Record<string, unknown>).gte = new Date(from);
            if (to) (where.date as Record<string, unknown>).lte = new Date(to + 'T23:59:59');
        }

        if (invoiceNoQuery) {
            where.invoiceNo = parseInt(invoiceNoQuery);
        }

        // Branch Isolation Logic
        if (user && user.role !== 'admin' && user.branchId) {
            where.branchId = user.branchId;
        } else if (branchQuery) {
            where.branchId = parseInt(branchQuery);
        }

        const invoices = await prisma.salesInvoice.findMany({
            where,
            include: { customer: true, details: true, user: { select: { id: true, username: true, fullName: true, role: true, phone: true } } },
            orderBy: { id: 'desc' },
        });
        return NextResponse.json(invoices);
    } catch (error) {
        console.error('Sales GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Received sales payload:', { manualDate: body.manualDate, manualInvoiceNo: body.manualInvoiceNo });

        // Get next invoice number
        const lastInvoice = await prisma.salesInvoice.findFirst({
            orderBy: { invoiceNo: 'desc' },
        });
        const invoiceNo = body.manualInvoiceNo ? parseInt(body.manualInvoiceNo) : ((lastInvoice?.invoiceNo || 0) + 1);
        const invoiceDate = body.manualDate ? new Date(body.manualDate) : new Date();

        // Calculate totals
        let subtotal = 0;
        const items = body.items || [];
        for (const item of items) {
            const itemTotal = (item.quantity || 1) * (item.price || 0);
            const itemDiscount = itemTotal * ((item.discountRate || 0) / 100);
            subtotal += itemTotal - itemDiscount;
        }

        const discountRate = parseFloat(body.discountRate) || 0;
        const discountValue = subtotal * (discountRate / 100);
        const afterDiscount = subtotal - discountValue;
        const taxValue = afterDiscount * 0.15;
        const total = afterDiscount + taxValue;
        const paid = parseFloat(body.paid) || total;
        const remaining = total - paid;

        const userId = body.userId ? parseInt(body.userId) : null;
        let branchId = body.branchId ? parseInt(body.branchId) : null;
        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
            branchId = user?.branchId || null;
        }

        const invoice = await prisma.$transaction(async (tx) => {
            const createdInvoice = await tx.salesInvoice.create({
                data: {
                    date: invoiceDate,
                    branchId,
                    invoiceNo,
                    customerId: body.customerId ? parseInt(body.customerId) : null,
                    stockId: body.stockId ? parseInt(body.stockId) : 1,
                    subtotal,
                    discountRate,
                    discountValue,
                    taxValue,
                    total,
                    paid,
                    remaining,
                    paymentType: body.paymentType || 'cash',
                    splitCash: body.splitCash ? parseFloat(body.splitCash) : 0,
                    splitCard: body.splitCard ? parseFloat(body.splitCard) : 0,
                    status: remaining > 0 ? 'pending' : 'completed',
                    userId: body.userId || null,
                    notes: body.notes || null,
                    details: {
                        create: items.map((item: Record<string, unknown>) => {
                            const qty = parseFloat(item.quantity as string) || 1;
                            const price = parseFloat(item.price as string) || 0;
                            const dRate = parseFloat(item.discountRate as string) || 0;
                            const itemSubtotal = qty * price;
                            const dValue = itemSubtotal * (dRate / 100);
                            const afterD = itemSubtotal - dValue;
                            const tax = afterD * 0.15;
                            return {
                                productId: parseInt(item.productId as string),
                                productName: item.productName as string || '',
                                quantity: qty,
                                price,
                                discountRate: dRate,
                                discountValue: dValue,
                                taxRate: 15,
                                taxValue: tax,
                                total: afterD + tax,
                            };
                        }),
                    },
                },
                include: { details: true, customer: true },
            });

            // Update stock (safely within transaction)
            for (const item of items) {
                const qty = parseFloat(item.quantity) || 1;
                await tx.product.update({
                    where: { id: parseInt(item.productId) },
                    data: { currentStock: { decrement: qty } },
                });
                
                // Also update ProductStock for the specific warehouse
                try {
                    await tx.productStock.upsert({
                        where: { productId_stockId: { productId: parseInt(item.productId), stockId: createdInvoice.stockId } },
                        update: { quantity: { decrement: qty } },
                        create: { productId: parseInt(item.productId), stockId: createdInvoice.stockId, quantity: -qty },
                    });
                } catch (e) {
                    console.error('Failed to update productStock for sale inside tx:', e);
                }
            }

            // Treasury entry (safely within transaction)
            if (paid > 0) {
                if (body.paymentType === 'split') {
                    const sCash = parseFloat(body.splitCash) || 0;
                    const sCard = parseFloat(body.splitCard) || 0;
                    if (sCash > 0) {
                        await tx.treasury.create({
                            data: { type: 'in', amount: sCash, description: `تحصيل نقدي - فاتورة مبيعات #${invoiceNo}`, referenceType: 'sale', referenceId: createdInvoice.id, userId, branchId },
                        });
                    }
                    if (sCard > 0) {
                        await tx.treasury.create({
                            data: { type: 'in', amount: sCard, description: `مسدد بالشبكة - فاتورة مبيعات #${invoiceNo}`, referenceType: 'sale', referenceId: createdInvoice.id, userId, branchId },
                        });
                    }
                } else {
                    await tx.treasury.create({
                        data: {
                            type: 'in',
                            amount: paid,
                            description: `فاتورة مبيعات #${invoiceNo}`,
                            referenceType: 'sale',
                            referenceId: createdInvoice.id,
                            userId,
                            branchId,
                        },
                    });
                }
            }

            return createdInvoice;
        });

        // Auto-journal entry (double-entry accounting)
        try {
            await postSalesInvoice({
                invoiceNo,
                subtotal: afterDiscount,
                taxValue,
                total,
                paymentType: body.paymentType || 'cash',
                splitCash: body.splitCash ? parseFloat(body.splitCash) : 0,
                splitCard: body.splitCard ? parseFloat(body.splitCard) : 0,
                userId: userId || undefined,
                branchId: branchId || undefined,
                discountValue,
                date: new Date().toISOString().split('T')[0],
            });
        } catch (journalErr) {
            console.warn('Auto-journal for sale skipped:', journalErr);
        }

        // ZATCA Phase 2 QR code generation
        let zatcaQR = '';
        try {
            const zatcaSettings = await prisma.setting.findMany({
                where: { key: { in: ['company_name', 'company_name_en', 'tax_number', 'zatca_crn', 'zatca_street', 'zatca_building', 'zatca_district', 'zatca_city', 'zatca_city_en', 'zatca_postal_code', 'zatca_private_key', 'zatca_certificate', 'zatca_enabled', 'zatca_production_token', 'zatca_production_secret', 'zatca_environment', 'zatca_last_pih', 'zatca_invoice_counter', 'tax_rate'] } }
            });
            const s: Record<string, string> = {};
            zatcaSettings.forEach((st: any) => { s[st.key] = st.value ?? ''; });

            if (s['zatca_enabled'] === '1' && s['company_name'] && s['tax_number']) {
                if (s['zatca_production_token'] && s['zatca_private_key']) {
                    // Phase 2: Cryptographic Stamp
                    const { execSync } = require('child_process');
                    const fs = require('fs');
                    const path = require('path');
                    const os = require('os');
                    const crypto = require('crypto');
                    
                    const wrapBase64 = (b64: string) => b64.replace(/(.{64})/g, '$1\n').trim();
                    const certPemBody = Buffer.from(s['zatca_production_token'], 'base64').toString('ascii');
                    const certificate = `-----BEGIN CERTIFICATE-----\n${wrapBase64(certPemBody)}\n-----END CERTIFICATE-----`;
                    const privateKey = `-----BEGIN EC PRIVATE KEY-----\n${wrapBase64(s['zatca_private_key'])}\n-----END EC PRIVATE KEY-----`;
                    
                    const counterKey = 'zatca_invoice_counter';
                    const currentCounter = parseInt(s[counterKey] || '0') + 1;
                    const prevHash = s['zatca_last_pih'] || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';
                    
                    const issueDate = invoice.date.toISOString().split('T')[0];
                    const issueTime = invoice.date.toISOString().split('T')[1]?.substring(0, 8) || '00:00:00';
                    const invoiceUuid = crypto.randomUUID();
                    const taxRate = parseFloat(s['tax_rate'] || '15') / 100;
                    
                    const lineItems = items.map((item: any, idx: number) => ({
                        id: (idx + 1).toString(),
                        name: item.productName || `Product ${item.productId}`,
                        quantity: parseFloat(item.quantity) || 1,
                        tax_exclusive_price: parseFloat(item.price) || 0,
                        VAT_percent: taxRate,
                        other_taxes: [],
                        discounts: [],
                    }));
                    
                    const signInput = {
                        certificate, privateKey,
                        egsInfo: {
                            uuid: invoiceUuid,
                            CRN_number: s['zatca_crn'] || '',
                            VAT_name: s['company_name_en'] || s['company_name'] || 'Company',
                            VAT_number: s['tax_number'],
                            location: {
                                city: s['zatca_city_en'] || s['zatca_city'] || 'Riyadh',
                                city_subdivision: s['zatca_district'] || 'District',
                                street: s['zatca_street'] || 'Main',
                                plot_identification: '0000',
                                building: s['zatca_building'] || '0000',
                                postal_zone: s['zatca_postal_code'] || '00000',
                            },
                            branch_name: 'Main',
                            branch_industry: s['zatca_industry'] || 'Technology',
                        },
                        invoiceCounterNumber: currentCounter,
                        invoiceSerialNumber: `INV${invoice.invoiceNo.toString().padStart(6, '0')}`,
                        issueDate, issueTime, previousInvoiceHash: prevHash, lineItems,
                    };
                    
                    const ts = Date.now();
                    const inputFile = path.join(os.tmpdir(), `zatca_qr_input_sales_${ts}.json`);
                    const outputFile = path.join(os.tmpdir(), `zatca_qr_output_sales_${ts}.json`);
                    const scriptFile = path.join(process.cwd(), 'src/scripts/zatca-sign-invoice.js');
                    
                    try {
                        fs.writeFileSync(inputFile, JSON.stringify(signInput));
                        execSync(`node "${scriptFile}" "${inputFile}" "${outputFile}"`, { encoding: 'utf-8', timeout: 30000 });
                        const signOutput = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

                        
                        zatcaQR = signOutput.qr;
                        const xmlString = signOutput.signed_invoice_string;
                        
                        // Save Phase 2 Database Updates
                        await prisma.setting.upsert({ where: { key: 'zatca_last_pih' }, update: { value: signOutput.invoice_hash }, create: { key: 'zatca_last_pih', value: signOutput.invoice_hash, description: 'ZATCA Last PIH' } });
                        await prisma.setting.upsert({ where: { key: counterKey }, update: { value: currentCounter.toString() }, create: { key: counterKey, value: currentCounter.toString(), description: 'ZATCA Counter' } });
                        
                        await prisma.salesInvoice.update({
                            where: { id: invoice.id },
                            data: { zatcaStatus: 'signed', zatcaHash: signOutput.invoice_hash, zatcaQr: zatcaQR }
                        });
                        
                        // Fatoora Reporting
                        if (s['zatca_production_secret']) {
                            try {
                                const { reportInvoice: fatooraReport } = await import('@/lib/zatca-fatoora');
                                const env = (s['zatca_environment'] as 'simulation' | 'production') || 'production';
                                await fatooraReport({
                                    binarySecurityToken: s['zatca_production_token'],
                                    secret: s['zatca_production_secret'],
                                    invoiceHash: signOutput.invoice_hash,
                                    uuid: invoiceUuid,
                                    invoiceBase64: Buffer.from(xmlString).toString('base64'),
                                    environment: env,
                                });
                                await prisma.salesInvoice.update({ where: { id: invoice.id }, data: { zatcaStatus: 'reported' } });
                                console.log(`✅ Invoice ${invoice.invoiceNo} Phase 2 reported to Fatoora`);
                            } catch (fatooraErr: any) {
                                await prisma.salesInvoice.update({ where: { id: invoice.id }, data: { zatcaStatus: 'failed', zatcaResponse: fatooraErr.message } });
                                console.warn('Fatoora Phase 2 reporting failed:', fatooraErr.message);
                            }
                        }
                    } finally {
                        try { fs.unlinkSync(inputFile); } catch { }
                        try { fs.unlinkSync(outputFile); } catch { }
                    }
                } else {
                    // Phase 1 QR
                    const qrData = generateZatcaQRContent({
                        sellerName: s['company_name'],
                        vatNumber: s['tax_number'],
                        timestamp: invoice.date.toISOString(),
                        totalWithVat: total,
                        vatAmount: taxValue,
                    });
                    zatcaQR = qrData;
                    await prisma.salesInvoice.update({ where: { id: invoice.id }, data: { zatcaQr: zatcaQR } });
                }
            }
        } catch (zatcaErr) {
            console.warn('ZATCA process skipped/failed:', zatcaErr);
        }

        return NextResponse.json({ ...invoice, zatcaQR }, { status: 201 });
    } catch (error) {
        console.error('Sales create error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء الفاتورة' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const id = Number(searchParams.get('id'));

        // Bulk delete all sales invoices
        if (action === 'delete_all') {
            const allowed = await hasPermission(auth.userId, 'delete_all_sales');
            if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف كل الفواتير' }, { status: 403 });

            // Delete all details, treasury entries, then invoices safely
            const result = await prisma.$transaction(async (tx) => {
                await tx.salesInvoiceDetail.deleteMany({});
                await tx.treasury.deleteMany({ where: { referenceType: 'sale' } });
                return await tx.salesInvoice.deleteMany({});
            });
            return NextResponse.json({ success: true, message: `تم حذف ${result.count} فاتورة مبيعات` });
        }

        // Single invoice delete
        const allowed = await hasPermission(auth.userId, 'delete_invoices');
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف الفواتير' }, { status: 403 });

        if (!id) return NextResponse.json({ error: 'معرف الفاتورة مطلوب' }, { status: 400 });

        const invoice = await prisma.salesInvoice.findUnique({ where: { id }, include: { details: true } });
        if (!invoice) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

        await prisma.$transaction(async (tx) => {
            // Reverse stock (re-increment what was sold) safely for both global and warehouse stock
            for (const detail of invoice.details) {
                await tx.product.update({
                    where: { id: detail.productId },
                    data: { currentStock: { increment: detail.quantity } },
                });
                
                try {
                    await tx.productStock.upsert({
                        where: { productId_stockId: { productId: detail.productId, stockId: invoice.stockId } },
                        update: { quantity: { increment: detail.quantity } },
                        create: { productId: detail.productId, stockId: invoice.stockId, quantity: detail.quantity },
                    });
                } catch (e) {
                     console.error('Failed to reverse productStock for sales delete inside tx:', e);
                }
            }

            // Remove related treasury entries
            await tx.treasury.deleteMany({ where: { referenceType: 'sale', referenceId: id } });

            // Delete invoice (cascade deletes details)
            await tx.salesInvoice.delete({ where: { id } });
        });

        return NextResponse.json({ success: true, message: 'تم حذف الفاتورة بنجاح' });
    } catch (error) {
        console.error('Sales DELETE error:', error);
        return NextResponse.json({ error: 'فشل في حذف الفاتورة' }, { status: 500 });
    }
}
