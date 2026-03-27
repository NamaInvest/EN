import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { generateZATCAXml, InvoiceData } from '@/lib/zatca';
import { generateSignedXMLString } from 'zatca-xml-js/lib/zatca/signing';
import crypto from 'crypto';
const ZATCA_SIMULATION_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation';
const ZATCA_CORE_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core';

export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body;

        // 1. COMPLIANCE CSID
        if (action === 'compliance-csid') {
            const otpClean = (body.otp || '').replace(/\s/g, '');
            const settingCsr = await prisma.setting.findFirst({ where: { key: 'zatca_csr_base64' } });
            const settingEnv = await prisma.setting.findFirst({ where: { key: 'zatca_environment' } });
            
            if (!settingCsr) return NextResponse.json({ error: 'لم يتم توليد CSR مسبقاً.' }, { status: 400 });

            // Dynamically resolve target URL
            let targetUrl = `${ZATCA_SIMULATION_URL}/compliance`;
            if (settingEnv?.value === 'production') {
                targetUrl = `${ZATCA_CORE_URL}/compliance`;
            } else if (settingEnv?.value === 'sandbox') {
                targetUrl = `https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance`;
            }

            console.log(`Requesting Compliance CSID with OTP: ${otpClean} to TRUTH URL: ${targetUrl}`);
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Version': 'V2',
                    'Accept-Language': 'en',
                    'OTP': otpClean,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ csr: settingCsr.value.replace(/[\r\n\s]/g, '') })
            });

            if (!response.ok) {
                const text = await response.text();
                return NextResponse.json({ error: `تم الرفض من زكاة: ${text}`, details: text }, { status: 400 });
            }

            const data = await response.json();
            
            // Save compliance data
            if (data.binarySecurityToken) {
                await prisma.setting.upsert({ where: { key: 'zatca_compliance_token' }, update: { value: data.binarySecurityToken }, create: { key: 'zatca_compliance_token', value: data.binarySecurityToken } });
            }
            if (data.secret) {
                await prisma.setting.upsert({ where: { key: 'zatca_compliance_secret' }, update: { value: data.secret }, create: { key: 'zatca_compliance_secret', value: data.secret } });
            }
            if (data.requestID) {
                await prisma.setting.upsert({ where: { key: 'zatca_compliance_request_id' }, update: { value: String(data.requestID) }, create: { key: 'zatca_compliance_request_id', value: String(data.requestID) } });
            }

            return NextResponse.json({ success: true, requestID: data.requestID });
        }

        // 2. PRODUCTION CSID
        if (action === 'production-csid') {
            // Must have approved compliance_request_id and compliance token/secret
            const requestIdSet = await prisma.setting.findFirst({ where: { key: 'zatca_compliance_request_id' } });
            const tokenSet = await prisma.setting.findFirst({ where: { key: 'zatca_compliance_token' } });
            const secretSet = await prisma.setting.findFirst({ where: { key: 'zatca_compliance_secret' } });
            const settingEnv = await prisma.setting.findFirst({ where: { key: 'zatca_environment' } });
            
            if (!requestIdSet || !tokenSet || !secretSet) {
                return NextResponse.json({ error: 'معلومات الـ Compliance غير مكتملة، يرجى استخراجها أولاً' }, { status: 400 });
            }

            // Dynamically resolve target URL
            let targetUrl = `${ZATCA_SIMULATION_URL}/production/csids`;
            if (settingEnv?.value === 'production') targetUrl = `${ZATCA_CORE_URL}/production/csids`;
            else if (settingEnv?.value === 'sandbox') targetUrl = `https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/production/csids`;

            const basicAuth = Buffer.from(`${tokenSet.value}:${secretSet.value}`).toString('base64');

            console.log('Requesting Production CSID to:', targetUrl);
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Accept-Version': 'V2',
                    'Authorization': `Basic ${basicAuth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ compliance_request_id: requestIdSet.value })
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("ZATCA Prod CSID Failed Details:", text);
                return NextResponse.json({ error: 'ZATCA Production API Failed', details: text }, { status: response.status });
            }

            const data = await response.json();
            
            if (data.binarySecurityToken) {
                await prisma.setting.upsert({ where: { key: 'zatca_production_token' }, update: { value: data.binarySecurityToken }, create: { key: 'zatca_production_token', value: data.binarySecurityToken } });
            }
            if (data.secret) {
                await prisma.setting.upsert({ where: { key: 'zatca_production_secret' }, update: { value: data.secret }, create: { key: 'zatca_production_secret', value: data.secret } });
            }

            return NextResponse.json({ success: true, message: 'تم استخراج الشهادة الإنتاجية (Production CSID) بنجاح.' });
        }

        // 3. COMPLIANCE INVOICE (Validation)
        if (action === 'compliance-invoice') {
            const tokenSet = await prisma.setting.findFirst({ where: { key: 'zatca_compliance_token' } });
            const secretSet = await prisma.setting.findFirst({ where: { key: 'zatca_compliance_secret' } });
            const pkSet = await prisma.setting.findFirst({ where: { key: 'zatca_private_key' } });
            const settings = await prisma.setting.findMany();
            
            if (!tokenSet || !secretSet || !pkSet) {
                return NextResponse.json({ error: 'الرجاء سحب شهادة المطابقة Compliance CSID والمفتاح الخاص أولاً' }, { status: 400 });
            }

            const basicAuth = Buffer.from(`${tokenSet.value}:${secretSet.value}`).toString('base64');
            const sMap: Record<string, string> = {};
            settings.forEach((s: any) => sMap[s.key] = s.value);
            
            const buildDummyInvoice = (typeCode: string, typeName: string, amount: string): InvoiceData => ({
                profileID: 'reporting:1.0',
                id: `INV-${Date.now()}-${typeCode}`,
                uuid: crypto.randomUUID(),
                issueDate: new Date().toISOString().split('T')[0],
                issueTime: new Date().toISOString().split('T')[1].substring(0, 8),
                invoiceTypeCode: typeCode,
                invoiceTypeName: typeName,
                note: 'Test Compliance Invoice',
                currencyCode: 'SAR',
                taxCurrencyCode: 'SAR',
                supplier: {
                    companyID: sMap['zatca_crn'] || '1010010000',
                    registrationName: sMap['tax_number'] || '300000000000003',
                    address: {
                        streetName: sMap['zatca_street'] || 'Main',
                        buildingNumber: sMap['zatca_building'] || '1234',
                        citySubdivisionName: sMap['zatca_district'] || 'District',
                        cityName: sMap['zatca_city_en'] || 'Riyadh',
                        postalZone: sMap['zatca_postal_code'] || '12345',
                        countryCode: 'SA'
                    }
                },
                customer: {
                    companyID: '300000000000003',
                    registrationName: 'Customer Name',
                    address: {
                        streetName: 'Test',
                        buildingNumber: '1111',
                        citySubdivisionName: 'Test',
                        cityName: 'Riyadh',
                        postalZone: '11111',
                        countryCode: 'SA'
                    }
                },
                invoiceLines: [{ id: '1', quantity: '1', unitCode: 'PCE', lineExtensionAmount: amount, itemName: 'Test Item', taxPercent: '15.00' }],
                taxAmount: (parseFloat(amount) * 0.15).toFixed(2),
                totalAmount: (parseFloat(amount) * 1.15).toFixed(2)
            });

            // Standard, Credit, Debit Dummies
            const stdInvoice = buildDummyInvoice('388', '0100000', '100.00');
            const crnInvoice = buildDummyInvoice('381', '0100000', '50.00');
            const drnInvoice = buildDummyInvoice('383', '0100000', '20.00');

            // Generate XML
            const stdXml = generateZATCAXml(stdInvoice);
            const crnXml = generateZATCAXml(crnInvoice);
            const drnXml = generateZATCAXml(drnInvoice);

            const certParsed = Buffer.from((tokenSet?.value as string) || '', 'base64').toString('utf8');
            const pkParsed = (pkSet?.value as string) || '';
            const certPem = '-----BEGIN CERTIFICATE-----\n' + certParsed + '\n-----END CERTIFICATE-----';

            const signNode = (xml: string) => {
                const { XMLDocument } = require('zatca-xml-js/lib/parser');
                const xmlDoc = new XMLDocument(xml);
                const res = generateSignedXMLString({
                    invoice_xml: xmlDoc as any,
                    certificate_string: certPem,
                    private_key_string: pkParsed
                } as any);
                return { signedXml: (res as any).signed_invoice_string, hash: (res as any).invoice_hash };
            };

            // Sign XML using Native JS Library
            const stdSigned = signNode(stdXml);
            const crnSigned = signNode(crnXml);
            const drnSigned = signNode(drnXml);

            // Post to ZATCA (Base64 Encoded Signed XML)
            const postToZatca = async (signedXml: string, hash: string, realUuid: string) => {
                const b64xml = Buffer.from(signedXml).toString('base64');
                
                const settingEnv = sMap['zatca_environment'];
                let targetUrl = `${ZATCA_SIMULATION_URL}/compliance/invoices`;
                if (settingEnv === 'production') targetUrl = `${ZATCA_CORE_URL}/compliance/invoices`;
                else if (settingEnv === 'sandbox') targetUrl = `https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance/invoices`;

                return fetch(targetUrl, {
                    method: 'POST',
                    headers: {
                        'Accept-Version': 'V2',
                        'Authorization': `Basic ${basicAuth}`,
                        'Content-Language': 'en',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        invoiceHash: hash,
                        uuid: realUuid,
                        invoice: b64xml
                    })
                }).then(async r => {
                    const text = await r.text();
                    try { return JSON.parse(text); } catch { return { error_code: r.status, text }; }
                });
            };

            const [stdRes, crnRes, drnRes] = await Promise.all([
                postToZatca(stdSigned.signedXml, stdSigned.hash, stdInvoice.uuid),
                postToZatca(crnSigned.signedXml, crnSigned.hash, crnInvoice.uuid),
                postToZatca(drnSigned.signedXml, drnSigned.hash, drnInvoice.uuid)
            ]);

            const hasErr = (r: any) => {
                if (r.error_code && !r.validationResults) return true;
                if (r.validationResults) {
                    if (r.validationResults.errorMessages && r.validationResults.errorMessages.length > 0) {
                        // Ignore the "Submitted before" error as it just means compliance is already finished for this type.
                        const actualErrors = r.validationResults.errorMessages.filter(
                            (err: any) => err.code !== 'Submitted before'
                        );
                        if (actualErrors.length > 0) return true;
                    }
                    if (r.validationResults.status === 'ERROR') {
                        // Double check if there are no actual errors left, then status ERROR was just for Submitted before
                        const actualErrors = r.validationResults.errorMessages?.filter((err: any) => err.code !== 'Submitted before') || [];
                        if (actualErrors.length > 0) return true;
                    }
                }
                return false;
            };
            if (hasErr(stdRes) || hasErr(crnRes) || hasErr(drnRes)) {
                console.error("ZATCA Compliance Reject Full:", JSON.stringify({ standard: stdRes, credit: crnRes, debit: drnRes }, null, 2));
                return NextResponse.json({ 
                    success: false, 
                    error: 'رفضت هيئة الزكاة إحدى الفواتير! راجع السجلات أو تواصل مع الدعم الفني.',
                    results: { standard: stdRes, credit: crnRes, debit: drnRes }
                }, { status: 400 });
            }

            return NextResponse.json({ 
                success: true, 
                message: 'تم اجتياز اختبار المطابقة بنجاح (Compliance Invoices PASS).',
                results: { standard: stdRes, credit: crnRes, debit: drnRes }
            });
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });

    } catch (e: any) {
        console.error('ZATCA API Gateway Error:', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        if (type === 'status') {
            const settingsSet = await prisma.setting.findMany();
            const s: Record<string, string> = {};
            settingsSet.forEach((item: any) => s[item.key] = item.value);

            if (s['zatca_production_token']) {
                return NextResponse.json({ status: 'connected', has_production_csid: true });
            } else if (s['zatca_compliance_token'] && s['zatca_compliance_request_id']) {
                return NextResponse.json({ status: 'compliance_csid' });
            } else if (s['zatca_private_key'] && s['zatca_certificate']) {
                return NextResponse.json({ status: 'keys_generated' });
            }

            return NextResponse.json({ status: 'disconnected' });
        }

        return NextResponse.json({ error: 'Invalid type requesting ZATCA GET API' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
