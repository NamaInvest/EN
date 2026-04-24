import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { generateZATCAXml, InvoiceData } from '@/lib/zatca';
import { generateSignedXMLString } from 'zatca-xml-js/lib/zatca/signing';
import crypto from 'crypto';
import * as os from 'os';
import * as fs from 'fs';
const ZATCA_SIMULATION_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation';
const ZATCA_CORE_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core';

export async function POST(req: NextRequest) {
    const prisma = getPrisma(req);
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
            if (!otpClean || otpClean.length !== 6) {
                return NextResponse.json({ error: 'رمز OTP يجب أن يكون 6 أرقام' }, { status: 400 });
            }

            // ── Auto-generate CSR with latest company data ──────────────
            const allSettings = await prisma.setting.findMany();
            const sDict: Record<string, string> = {};
            allSettings.forEach((s: any) => sDict[s.key] = s.value);

            const taxNumber = sDict['tax_number'];
            if (!taxNumber || taxNumber.length !== 15 || !taxNumber.startsWith('3') || !taxNumber.endsWith('3')) {
                return NextResponse.json({ error: 'الرقم الضريبي غير صالح. يجب أن يكون 15 رقماً ويبدأ وينتهي بـ 3' }, { status: 400 });
            }

            const companyNameEn = sDict['company_name_en'] || 'Unknown Company';
            const crn = sDict['zatca_crn'] || '1010010000';
            const branchName = sDict['branch_name_en'] || 'HeadOffice';
            const cityEn = sDict['zatca_city_en'] || 'Riyadh';
            const industryCategory = sDict['zatca_industry'] || 'Retail';

            // Arabic to English transliteration
            const arToEnMap: Record<string, string> = { 'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': '', 'ئ': 'e', 'ؤ': 'w', 'لا': 'la', ' ': ' ', 'ـ': '' };
            const arabicToEnglish = (text: string) => {
                if (!text) return '';
                const engPart = text.replace(/[^\x00-\x7F]/g, '').trim();
                if (engPart.length > 3) return engPart;
                let result = '';
                for (let i = 0; i < text.length; i++) {
                    const ch = text[i];
                    if (/[\x00-\x7F]/.test(ch)) { result += ch; }
                    else if (arToEnMap[ch]) { result += arToEnMap[ch]; }
                }
                return result.replace(/\s+/g, ' ').trim().replace(/\b\w/g, l => l.toUpperCase()) || 'NamaCompany';
            };

            const orgName = arabicToEnglish(companyNameEn);
            const EGS_Name = orgName.replace(/\s+/g, '').substring(0, 15) || 'NAMA';
            const uuid = crypto.randomUUID();
            const serialNumber = `1-${EGS_Name}|2-${branchName.replace(/\s+/g, '')}|3-${uuid}`;

            const tmpDir = require('path').join(require('os').tmpdir(), 'zatca_' + Date.now());
            let csrBase64 = '';
            let privateKeyClean = '';

            try {
                const { execSync } = require('child_process');
                const fs = require('fs');
                fs.mkdirSync(tmpDir, { recursive: true });

                const csrConfig = `csr.common.name=PRE-${taxNumber}
csr.serial.number=${serialNumber}
csr.organization.identifier=${taxNumber}
csr.organization.unit.name=${branchName}
csr.organization.name=${orgName}
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=${cityEn}
csr.industry.business.category=${industryCategory}`;

                fs.writeFileSync(`${tmpDir}/csr-config.properties`, csrConfig);

                // Generate ECDSA key pair
                const cryptoInstance = require('crypto');
                const { privateKey } = cryptoInstance.generateKeyPairSync('ec', {
                    namedCurve: 'secp256k1',
                    publicKeyEncoding: { type: 'spki', format: 'pem' },
                    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
                });
                fs.writeFileSync(`${tmpDir}/private.key`, privateKey);

                // Use ZATCA Fatoora SDK to generate CSR
                try {
                    execSync(`fatoora -csr -csrConfig ${tmpDir}/csr-config.properties -privateKey ${tmpDir}/private.key -generatedCsr ${tmpDir}/csr.txt`);
                } catch (fatooraErr: any) {
                    console.error("ZATCA Fatoora CSR Gen Error:", fatooraErr.message);
                    return NextResponse.json({ error: 'فشل توليد CSR: ' + (fatooraErr.stderr?.toString() || fatooraErr.message) }, { status: 500 });
                }

                privateKeyClean = fs.readFileSync(`${tmpDir}/private.key`, 'utf-8');
                csrBase64 = fs.readFileSync(`${tmpDir}/csr.txt`, 'utf-8').trim();
            } finally {
                try { require('fs').rmSync(tmpDir, { recursive: true, force: true }); } catch { }
            }

            // Save CSR and private key
            await Promise.all([
                prisma.setting.upsert({ where: { key: 'zatca_private_key' }, update: { value: privateKeyClean }, create: { key: 'zatca_private_key', value: privateKeyClean } }),
                prisma.setting.upsert({ where: { key: 'zatca_csr_base64' }, update: { value: csrBase64 }, create: { key: 'zatca_csr_base64', value: csrBase64 } }),
            ]);

            console.log('✅ CSR generated successfully, proceeding to compliance CSID...');

            // ── Now request Compliance CSID from ZATCA ──────────────
            const settingEnv = sDict['zatca_environment'];
            let targetUrl = `${ZATCA_SIMULATION_URL}/compliance`;
            if (settingEnv === 'production') {
                targetUrl = `${ZATCA_CORE_URL}/compliance`;
            } else if (settingEnv === 'sandbox') {
                targetUrl = `https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance`;
            }

            console.log(`Requesting Compliance CSID with OTP: ${otpClean} to URL: ${targetUrl}`);
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Version': 'V2',
                    'Accept-Language': 'en',
                    'OTP': otpClean,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ csr: csrBase64.replace(/[\r\n\s]/g, '') })
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

            return NextResponse.json({ success: true, message: '✅ تم توليد CSR واستخراج شهادة المطابقة بنجاح', requestID: data.requestID });
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

            // ── Auto-enable ZATCA reporting after successful Production CSID ──
            if (data.binarySecurityToken && data.secret) {
                await prisma.setting.upsert({ where: { key: 'zatca_enabled' }, update: { value: '1' }, create: { key: 'zatca_enabled', value: '1' } });
                console.log('✅ ZATCA auto-enabled after Production CSID success');
            }

            return NextResponse.json({ success: true, message: '✅ تم استخراج الشهادة الإنتاجية وتفعيل الإرسال التلقائي بنجاح' });
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
            
            // Saudi Arabia timezone (UTC+3)
            const saudiNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
            const saudiDate = saudiNow.toISOString().split('T')[0];
            const saudiTime = saudiNow.toISOString().split('T')[1].substring(0, 8);

            const buildDummyInvoice = (typeCode: string, typeName: string, amount: string): InvoiceData => ({
                profileID: 'reporting:1.0',
                id: `INV-${Date.now()}-${crypto.randomUUID().substring(0,5)}-${typeCode}`,
                uuid: crypto.randomUUID(),
                issueDate: saudiDate,
                issueTime: saudiTime,
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

            // Simplified Dummies
            const simplInvoice = buildDummyInvoice('388', '0200000', '100.00');
            const simplCrnInvoice = buildDummyInvoice('381', '0200000', '50.00');
            const simplDrnInvoice = buildDummyInvoice('383', '0200000', '20.00');

            // Generate XML
            const stdXml = generateZATCAXml(stdInvoice);
            const crnXml = generateZATCAXml(crnInvoice);
            const drnXml = generateZATCAXml(drnInvoice);
            
            const simplXml = generateZATCAXml(simplInvoice);
            const simplCrnXml = generateZATCAXml(simplCrnInvoice);
            const simplDrnXml = generateZATCAXml(simplDrnInvoice);

            let certParsed = Buffer.from((tokenSet?.value as string) || '', 'base64').toString('ascii');
            
            // If the cert was double base64, decoding it gives the PEM body. If it was already a PEM body, it might look odd, but actually zatca returns pure base64.
            // Let's strip any PEM headers if they exist by accident, and put them cleanly.
            certParsed = certParsed.replace(/-----[^-]+-----/g, '').replace(/\r?\n/g, '').trim();
            const certPem = '-----BEGIN CERTIFICATE-----\n' + certParsed + '\n-----END CERTIFICATE-----';

            let pkParsed = (pkSet?.value as string) || '';
            pkParsed = pkParsed.replace(/-----[^-]+-----/g, '').replace(/\r?\n/g, '').trim();
            const pkPem = '-----BEGIN EC PRIVATE KEY-----\n' + pkParsed + '\n-----END EC PRIVATE KEY-----';

            const signNode = (xml: string) => {
                const { XMLDocument } = require('zatca-xml-js/lib/parser');
                const xmlDoc = new XMLDocument(xml);
                const res = generateSignedXMLString({
                    invoice_xml: xmlDoc as any,
                    certificate_string: certPem,
                    private_key_string: pkPem
                } as any);
                return { signedXml: (res as any).signed_invoice_string, hash: (res as any).invoice_hash };
            };

            // Sign XML using Native JS Library
            const stdSigned = signNode(stdXml);
            const crnSigned = signNode(crnXml);
            const drnSigned = signNode(drnXml);

            const simplSigned = signNode(simplXml);
            const simplCrnSigned = signNode(simplCrnXml);
            const simplDrnSigned = signNode(simplDrnXml);

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

            // Submit sequentially to avoid ZATCA gateway 429 rate limits or silent payload drops
            const stdRes = await postToZatca(stdSigned.signedXml, stdSigned.hash, stdInvoice.uuid);
            const crnRes = await postToZatca(crnSigned.signedXml, crnSigned.hash, crnInvoice.uuid);
            const drnRes = await postToZatca(drnSigned.signedXml, drnSigned.hash, drnInvoice.uuid);
            const simplRes = await postToZatca(simplSigned.signedXml, simplSigned.hash, simplInvoice.uuid);
            const simplCrnRes = await postToZatca(simplCrnSigned.signedXml, simplCrnSigned.hash, simplCrnInvoice.uuid);
            const simplDrnRes = await postToZatca(simplDrnSigned.signedXml, simplDrnSigned.hash, simplDrnInvoice.uuid);

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
            if (hasErr(stdRes) || hasErr(crnRes) || hasErr(drnRes) || hasErr(simplRes) || hasErr(simplCrnRes) || hasErr(simplDrnRes)) {
                console.error("ZATCA Compliance Reject Full:", JSON.stringify({ standard: stdRes, credit: crnRes, debit: drnRes, simpl: simplRes, simplCrn: simplCrnRes, simplDrn: simplDrnRes }, null, 2));
                return NextResponse.json({ 
                    success: false, 
                    error: 'رفضت هيئة الزكاة إحدى الفواتير! راجع السجلات أو تواصل مع الدعم الفني.',
                    results: { standard: stdRes, credit: crnRes, debit: drnRes, simpl: simplRes, simplCrn: simplCrnRes, simplDrn: simplDrnRes }
                }, { status: 400 });
            }

            return NextResponse.json({ 
                success: true, 
                message: 'تم اجتياز اختبار المطابقة بنجاح (Compliance Invoices PASS).',
                results: { standard: stdRes, credit: crnRes, debit: drnRes, simpl: simplRes, simplCrn: simplCrnRes, simplDrn: simplDrnRes }
            });
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });

    } catch (e: any) {
        console.error('ZATCA API Gateway Error:', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
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
