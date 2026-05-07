import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { round2 } from '@/lib/money';
import { salesReturnCreateSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-handler';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const returns = await prisma.salesReturn.findMany({
            take: 100, orderBy: { id: 'desc' } });
        return NextResponse.json(returns);
    } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        // Securely extract user from authenticated token
        const auth = getUserFromRequest(request as any);
        const userId = auth?.userId || null;
        
        const rawBody = await request.json();
        // Zod validation + strip mass-assignment fields
        const body = salesReturnCreateSchema.parse(rawBody);

        let branchId = body.branchId ? Number(body.branchId) : null;
        const destinationStockId = body.destinationStockId ? Number(body.destinationStockId) : null;
        const restockingFee = body.restockingFee ? Number(body.restockingFee) : 0;
        
        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
            branchId = user?.branchId || null;
        }

        const items = body.items || [];
        if (items.length === 0) {
            return NextResponse.json({ error: 'لا يوجد أصناف للإرجاع' }, { status: 400 });
        }

        let originalInvoice = null;
        if (body.originalInvoiceId) {
            originalInvoice = await prisma.salesInvoice.findUnique({
                where: { id: Number(body.originalInvoiceId) },
                include: { details: true }
            });

            if (!originalInvoice) {
                return NextResponse.json({ error: 'الفاتورة الأصلية غير موجودة' }, { status: 404 });
            }

            // STRICT RMA VALIDATION: Ensure returned quantities don't exceed sold quantities
            for (const item of items) {
                const soldItem = originalInvoice.details.find(d => d.productId === Number(item.productId));
                if (!soldItem) {
                    return NextResponse.json({ error: `المنتج ${item.productName} غير موجود في الفاتورة الأصلية` }, { status: 400 });
                }

                if (Number(item.quantity) > soldItem.quantity) {
                    return NextResponse.json({ error: `الكمية المرتجعة للمنتج ${item.productName} تتجاوز الكمية المباعة (${soldItem.quantity})` }, { status: 400 });
                }
            }
        }

        // Recalculate totals server-side
        let calculatedSubtotal = 0;
        const processedItems = items.map((item: any) => {
            const qty = parseFloat(item.quantity) || 1;
            const price = parseFloat(item.price) || 0;
            const dRate = parseFloat(item.discountRate) || 0;
            const itemSubtotal = qty * price;
            const dValue = itemSubtotal * (dRate / 100);
            const afterD = itemSubtotal - dValue;
            const tax = afterD * 0.15;
            calculatedSubtotal += afterD;

            return {
                productId: parseInt(item.productId),
                productName: item.productName || '',
                quantity: qty,
                price: price,
                discountRate: dRate,
                discountValue: dValue,
                taxRate: 15,
                taxValue: tax,
                total: afterD + tax,
            };
        });

        const taxValue = calculatedSubtotal * 0.15;
        const totalAmount = calculatedSubtotal + taxValue;

        const last = await prisma.salesReturn.findFirst({ orderBy: { returnNo: 'desc' } });
        const returnNo = (last?.returnNo || 0) + 1;

        // Execute all DB operations in a single transaction
        let generatedFeeInvoiceNo = null;
        let generatedFeeSubtotal = 0;
        let generatedFeeTax = 0;

        const ret = await prisma.$transaction(async (tx) => {
            // Create Header AND Details
            const createdReturn = await tx.salesReturn.create({
                data: {
                    returnNo, 
                    originalInvoiceId: originalInvoice?.id || null,
                    customerId: body.customerId || null, 
                    subtotal: calculatedSubtotal, 
                    taxValue, 
                    total: totalAmount,
                    userId, 
                    branchId, 
                    notes: body.notes || null,
                    destinationStockId,
                    restockingFee,
                    details: {
                        create: processedItems
                    }
                },
                include: { details: true }
            });

            // Restock Items safely (Point 2: Destination Warehouse)
            const targetStockId = destinationStockId || originalInvoice?.stockId || 1; 
            for (const item of processedItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { currentStock: { increment: item.quantity } },
                });

                try {
                    await tx.productStock.upsert({
                        where: { productId_stockId: { productId: item.productId, stockId: targetStockId } },
                        update: { quantity: { increment: item.quantity } },
                        create: { productId: item.productId, stockId: targetStockId, quantity: item.quantity },
                    });
                    
                    // --- PHASE 1 AUTOMATION: AUDIT LOG CREATION ---
                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            stockId: targetStockId,
                            type: 'in',
                            quantity: item.quantity,
                            referenceType: 'sales_return',
                            referenceId: createdReturn.id,
                            userId: userId,
                            notes: `مرتجع مبيعات #${returnNo}`
                        }
                    });
                } catch (e) {
                    console.error('Failed to restock returned item to productStock inside tx:', e);
                }
            }

            // Treasury out (Refund to customer) - Point 3: Financial Fees
            const netRefund = createdReturn.total - restockingFee;
            if (netRefund > 0) {
                await tx.treasury.create({ 
                    data: { 
                        type: 'out', 
                        amount: netRefund, 
                        description: `مرتجع مبيعات #${returnNo} (الصافي بعد الرسوم)`, 
                        referenceType: 'sales_return', 
                        referenceId: createdReturn.id, 
                        userId, 
                        branchId 
                    } 
                });
            }

            // Create Auto-Invoice for Restocking Fee to comply with ZATCA (100% Legal Bypass)
            if (restockingFee > 0) {
                const feeSubtotal = restockingFee / 1.15;
                const feeTax = restockingFee - feeSubtotal;
                generatedFeeSubtotal = feeSubtotal;
                generatedFeeTax = feeTax;
                
                const lastSi = await tx.salesInvoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
                const newSiNo = lastSi ? lastSi.invoiceNo + 1 : 1000;
                generatedFeeInvoiceNo = newSiNo;

                await tx.salesInvoice.create({
                    data: {
                        invoiceNo: newSiNo,
                        customerId: body.customerId || null,
                        subtotal: feeSubtotal,
                        taxValue: feeTax,
                        total: restockingFee,
                        paid: restockingFee, // Auto-paid by deducting from return!
                        paymentType: 'cash',
                        notes: `فاتورة آلية: رسوم إعادة تخزين للمرتجع #${returnNo}`,
                        userId,
                        branchId,
                        details: {
                            create: [{
                                productId: processedItems[0].productId, // Fallback to first item id to satisfy FK
                                productName: 'رسوم إعادة تخزين (Restocking Fee)',
                                quantity: 1,
                                price: feeSubtotal,
                                taxRate: 15,
                                taxValue: feeTax,
                                total: restockingFee
                            }]
                        }
                    }
                });
            }

            // [STATE MACHINE AUDIT FIX] Ensure POS creations are properly logged in the audit trail
            try {
                await tx.auditLog.create({
                    data: {
                        userId: userId ?? 0,
                        action: `transition:draft→completed`, // Returns are generally completed
                        tableName: 'salesreturns',
                        recordId: createdReturn.id,
                        details: `Direct API Creation (State-Machine Bypass Handled)`,
                    },
                });
            } catch (e) {
                console.error('[document-state-machine] POS audit log failed:', e);
            }

            return createdReturn;
        });

        try {
            const { postSalesReturn, postSalesInvoice } = await import('@/lib/auto-journal');
            await postSalesReturn({
                returnNo,
                total: ret.total,
                taxValue: ret.taxValue,
                userId: userId || undefined,
                branchId: branchId || undefined,
                date: new Date().toISOString().split('T')[0],
            });

            if (generatedFeeInvoiceNo && restockingFee > 0) {
                await postSalesInvoice({
                    invoiceNo: generatedFeeInvoiceNo,
                    subtotal: generatedFeeSubtotal,
                    taxValue: generatedFeeTax,
                    total: restockingFee,
                    paymentType: 'cash',
                    userId: userId || undefined,
                    branchId: branchId || undefined,
                    date: new Date().toISOString().split('T')[0],
                });
            }
        } catch (journalErr) {
            console.warn('Auto-journal for sales return skipped:', journalErr);
        }

        // ── ZATCA Phase 2: Credit Note (إشعار دائن) ──────────────────────
        let zatcaQR = '';
        let signOutputGlobal: any = null;
        let creditNoteUuidGlobal = '';
        let zatcaSettingsObjGlobal: any = null;
        let hashFinalGlobal = '';
        let isStandardGlobal = false;
        let sGlobal: Record<string, string> = {};

        try {
            await prisma.$transaction(async (tx) => {
                await tx.$executeRaw`SELECT id FROM "settings" WHERE "key" IN ('zatca_invoice_counter', 'zatca_last_pih') FOR UPDATE`;
                const zatcaSettings = await tx.setting.findMany({
            take: 100,
                where: { key: { in: ['company_name', 'company_name_en', 'tax_number', 'zatca_crn', 'zatca_street', 'zatca_building', 'zatca_district', 'zatca_city', 'zatca_city_en', 'zatca_postal_code', 'zatca_private_key', 'zatca_certificate', 'zatca_enabled', 'zatca_production_token', 'zatca_production_secret', 'zatca_environment', 'zatca_last_pih', 'zatca_invoice_counter', 'tax_rate'] } }
            });
            const s: Record<string, string> = {};
            zatcaSettings.forEach((st: any) => { s[st.key] = st.value ?? ''; });

            if (s['zatca_enabled'] === '1' && s['company_name'] && s['tax_number']) {
                if (s['zatca_production_token'] && s['zatca_private_key']) {
                    const crypto = require('crypto');
                    const certParsed = Buffer.from(s['zatca_production_token'], 'base64').toString('ascii');

                    const counterKey = 'zatca_invoice_counter';
                    const currentCounter = parseInt(s[counterKey] || '0') + 1;
                    const prevHash = s['zatca_last_pih'] || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';

                    const nowUtc = new Date();
                    const saudiOffset = 3 * 60 * 60 * 1000;
                    const saudiNow = new Date(nowUtc.getTime() + saudiOffset);
                    const issueDate = saudiNow.toISOString().split('T')[0];
                    const issueTime = saudiNow.toISOString().split('T')[1]?.substring(0, 8) || '00:00:00';
                    const creditNoteUuid = crypto.randomUUID();
                    const taxRate = parseFloat(s['tax_rate'] || '15') / 100;

                    try {
                        const { ZatcaSigner } = await import('@/lib/zatca-signer');
                        const { decrypt } = await import('@/lib/encryption');
                        const signer = new ZatcaSigner();
                        const decryptedPrivateKey = decrypt(s['zatca_private_key']);

                        const zatcaSettingsObj = {
                            companyName: s['company_name'],
                            companyNameEn: s['company_name_en'] || s['company_name'],
                            taxNumber: s['tax_number'],
                            crn: s['zatca_crn'] || '1010010000',
                            street: s['zatca_street'] || 'Main',
                            building: s['zatca_building'] || '1234',
                            district: s['zatca_district'] || 'District',
                            city: s['zatca_city'] || 'Riyadh',
                            cityEn: s['zatca_city_en'] || 'Riyadh',
                            postalCode: s['zatca_postal_code'] || '12345',
                            privateKey: decryptedPrivateKey,
                            certificate: certParsed,
                            productionToken: s['zatca_production_token'],
                            productionSecret: s['zatca_production_secret'] || '',
                            environment: (s['zatca_environment'] as 'sandbox' | 'simulation' | 'production') || 'production',
                            lastPih: prevHash,
                            invoiceCounter: currentCounter,
                        };

                        // Map returned items to ZATCA line items
                        const mappedLines = processedItems.map((item: any) => {
                            const exclPrice = parseFloat((item.price / (1 + taxRate)).toFixed(2));
                            const qty = item.quantity;
                            return {
                                name: item.productName || 'Item',
                                quantity: qty,
                                unitPrice: exclPrice,
                                taxRate,
                                taxAmount: parseFloat((exclPrice * qty * taxRate).toFixed(2)),
                                subtotal: parseFloat((exclPrice * qty).toFixed(2)),
                                total: parseFloat((item.price * qty).toFixed(2)),
                            };
                        });

                        const cust = (originalInvoice as any)?.customer;
                        const isStandard = !!cust?.taxNumber;

                        const creditNoteData = {
                            id: `CN-${returnNo}`,
                            uuid: creditNoteUuid,
                            issueDate,
                            issueTime,
                            invoiceTypeCode: '381',      // Credit Note (إشعار دائن)
                            invoiceTypeName: isStandard ? '0100000' : '0200000',
                            currencyCode: 'SAR',
                            taxCurrencyCode: 'SAR',
                            note: `إشعار دائن - مرتجع مبيعات #${returnNo}${originalInvoice ? ` للفاتورة #${originalInvoice.invoiceNo}` : ''}`,
                            supplier: {
                                companyID: s['zatca_crn'] || '1010010000',
                                registrationName: s['company_name'] || s['tax_number'],
                                taxNumber: s['tax_number'],
                                address: {
                                    streetName: s['zatca_street'] || 'Main',
                                    buildingNumber: s['zatca_building'] || '1234',
                                    citySubdivisionName: s['zatca_district'] || 'District',
                                    cityName: s['zatca_city_en'] || s['zatca_city'] || 'Riyadh',
                                    postalZone: s['zatca_postal_code'] || '12345',
                                    countryCode: 'SA',
                                },
                            },
                            customer: isStandard ? {
                                companyID: cust?.crNo || '300000000000003',
                                registrationName: cust?.name || 'Customer',
                                taxNumber: cust?.taxNumber,
                                address: {
                                    streetName: cust?.street || 'Test', 
                                    buildingNumber: cust?.buildingNumber || '1111',
                                    citySubdivisionName: cust?.district || 'Test', 
                                    cityName: cust?.city || 'Riyadh',
                                    postalZone: cust?.postalCode || '11111', 
                                    countryCode: 'SA',
                                },
                            } : {
                                companyID: '300000000000003',
                                registrationName: cust?.name || 'Cash Customer',
                                address: {
                                    streetName: 'Test', buildingNumber: '1111',
                                    citySubdivisionName: 'Test', cityName: 'Riyadh',
                                    postalZone: '11111', countryCode: 'SA',
                                },
                            },
                            invoiceLines: mappedLines,
                            taxAmount: ret.taxValue.toFixed(2),
                            totalAmount: ret.total.toFixed(2),
                            // Reference to original invoice for ZATCA BillingReference
                            ...(originalInvoice ? {
                                cancelation: {
                                    canceled_invoice_number: originalInvoice.invoiceNo,
                                    reason: 'مرتجع مبيعات',
                                }
                            } : {}),
                        };

                        let signOutput;
                        if (isStandard && s['zatca_certificate'] && s['zatca_private_key']) {
                            const { generateZATCAXml } = await import('@/lib/zatca');
                            const { ZatcaJavaAdapter } = await import('@/lib/zatca-java');
                            
                            const mappedZatcaData = {
                                profileID: 'reporting:1.0',
                                id: creditNoteData.id,
                                uuid: creditNoteUuid,
                                issueDate: issueDate,
                                issueTime: issueTime,
                                invoiceTypeCode: creditNoteData.invoiceTypeCode,
                                invoiceTypeName: creditNoteData.invoiceTypeName,
                                note: creditNoteData.note,
                                currencyCode: creditNoteData.currencyCode,
                                taxCurrencyCode: creditNoteData.taxCurrencyCode,
                                supplier: creditNoteData.supplier,
                                customer: creditNoteData.customer,
                                taxAmount: creditNoteData.taxAmount,
                                totalAmount: creditNoteData.totalAmount,
                                previousHash: s['zatca_last_pih'] || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==',
                                cancelation: creditNoteData.cancelation,
                                invoiceLines: creditNoteData.invoiceLines.map((line: any, idx: number) => ({
                                    id: (idx + 1).toString(),
                                    quantity: line.quantity.toString(),
                                    unitCode: 'PCE',
                                    lineExtensionAmount: line.subtotal.toString(),
                                    itemName: line.name,
                                    taxPercent: (line.taxRate * 100).toString(),
                                }))
                            };

                            const rawXml = generateZATCAXml(mappedZatcaData as any);
                            const javaAdapter = new ZatcaJavaAdapter();
                            const signedData = await javaAdapter.signInvoice(
                                rawXml, 
                                s['zatca_certificate'], 
                                decryptedPrivateKey, 
                                mappedZatcaData.previousHash
                            );
                            signOutput = {
                                signedXml: signedData.signedXml,
                                hash: signedData.hash,
                                qr: signedData.qr,
                                encodedInvoice: Buffer.from(signedData.signedXml).toString('base64')
                            };
                            console.log(`✅ Standard Credit Note ${creditNoteData.id} signed (Java SDK)`);
                        } else {
                            signOutput = signer.signInvoice(creditNoteData, zatcaSettingsObj);
                            console.log(`✅ Simplified Credit Note ${creditNoteData.id} signed (Node.js SDK)`);
                        }
                        zatcaQR = signOutput.qr;
                        const hashFinal = signOutput.hash;

                        // Update ZATCA counter & hash chain
                        await tx.setting.upsert({ where: { key: 'zatca_last_pih' }, update: { value: hashFinal }, create: { key: 'zatca_last_pih', value: hashFinal, description: 'ZATCA Last PIH' } });
                        await tx.setting.upsert({ where: { key: counterKey }, update: { value: currentCounter.toString() }, create: { key: counterKey, value: currentCounter.toString(), description: 'ZATCA Counter' } });
                        await tx.salesReturn.update({ where: { id: ret.id }, data: { zatcaStatus: 'signed', zatcaHash: hashFinal, zatcaQr: zatcaQR } });
                        // Store signed XML separately
                        try { await tx.$executeRawUnsafe(`UPDATE sales_returns SET zatca_xml = $1 WHERE id = $2`, signOutput.signedXml, ret.id); } catch (_) {}

                        signOutputGlobal = signOutput;
                        creditNoteUuidGlobal = creditNoteUuid;
                        zatcaSettingsObjGlobal = zatcaSettingsObj;
                        hashFinalGlobal = hashFinal;
                        isStandardGlobal = isStandard;
                        sGlobal = s;
                        
                    } catch (signErr: any) {
                        console.error('ZATCA Credit Note Signing Error:', signErr.message, signErr.stack);
                    }
                } else {
                    // Phase 1 QR fallback
                    const { generateZatcaQRContent } = await import('@/lib/zatca');
                    const qrData = generateZatcaQRContent({
                        sellerName: s['company_name'],
                        vatNumber: s['tax_number'],
                        timestamp: new Date().toISOString(),
                        totalWithVat: ret.total,
                        vatAmount: ret.taxValue,
                    });
                    zatcaQR = qrData;
                    await tx.salesReturn.update({ where: { id: ret.id }, data: { zatcaQr: zatcaQR } });
                }
            }
            }); // End of ZATCA transaction

            // Report Credit Note to ZATCA (Outside Transaction)
            if (sGlobal['zatca_production_secret'] && signOutputGlobal) {
                try {
                    const { ZatcaSigner } = await import('@/lib/zatca-signer');
                    const signer = new ZatcaSigner();
                    const zatcaResult = isStandardGlobal
                        ? await signer.clearInvoice(signOutputGlobal.signedXml, hashFinalGlobal, creditNoteUuidGlobal, zatcaSettingsObjGlobal)
                        : await signer.reportInvoice(signOutputGlobal.signedXml, hashFinalGlobal, creditNoteUuidGlobal, zatcaSettingsObjGlobal);

                    if (zatcaResult.status === 'reported' || zatcaResult.status === 'cleared') {
                        await prisma.salesReturn.update({ 
                            where: { id: ret.id }, 
                            data: { 
                                zatcaStatus: zatcaResult.status,
                                ...((zatcaResult as any).clearedInvoice ? { zatcaXml: Buffer.from((zatcaResult as any).clearedInvoice, 'base64').toString('utf-8') } : {})
                            } 
                        });
                        console.log(`✅ Credit Note CN-${returnNo} ${zatcaResult.status} to ZATCA`);
                    } else {
                        await prisma.salesReturn.update({ where: { id: ret.id }, data: { zatcaStatus: 'failed', zatcaResponse: JSON.stringify(zatcaResult.validationResults) } });
                    }
                } catch (reportErr: any) {
                    await prisma.salesReturn.update({ where: { id: ret.id }, data: { zatcaStatus: 'failed', zatcaResponse: reportErr.message } });
                }
            }
        } catch (zatcaErr) {
            console.warn('ZATCA Credit Note process skipped/failed:', zatcaErr);
        }

        return NextResponse.json({ ...ret, zatcaQR }, { status: 201 });
    } catch (e) { 
        return handleApiError(e); 
    }
}
