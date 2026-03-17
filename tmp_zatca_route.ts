/**
 * ZATCA E-Invoicing — Next.js API Route
 * Converted from ZATCA Kit (Express.js) to Next.js API routes
 * Uses Prisma $queryRawUnsafe for zatca_settings table
 */
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

// -- QR Code Library --
let QRCodeLib: any;
try { QRCodeLib = require('qrcode'); } catch { }

// ====================================================================
//  ZATCA TLV QR Encoder
// ====================================================================
function tlvEncode(tag: number, value: string | Buffer) {
    const buf = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
    if (buf.length > 127) {
        return Buffer.concat([Buffer.from([tag, 0x82, (buf.length >> 8) & 0xff, buf.length & 0xff]), buf]);
    }
    return Buffer.concat([Buffer.from([tag, buf.length]), buf]);
}

// ====================================================================
//  Arabic to English Transliteration
// ====================================================================
const arToEnMap: Record<string, string> = { 'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': '', 'ئ': 'e', 'ؤ': 'w', ' ': ' ' };

function arabicToEnglish(text: string): string {
    if (!text) return '';
    const engPart = text.replace(/[^\x00-\x7F]/g, '').trim();
    if (engPart.length > 3) return engPart;
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (/[\x00-\x7F]/.test(ch)) result += ch;
        else if (arToEnMap[ch]) result += arToEnMap[ch];
    }
    return result.replace(/\s+/g, ' ').trim().replace(/\b\w/g, l => l.toUpperCase()) || '';
}

function toAscii(str: string): string {
    if (!str) return '';
    return str.replace(/[^\x00-\x7F]/g, '').trim();
}

// ====================================================================
//  ECDSA Key Pair
// ====================================================================
function generateSelfSignedCert(taxNumber: string, orgName: string) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'secp256k1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    const certBase64 = Buffer.from(JSON.stringify({ subject: orgName || taxNumber, publicKey })).toString('base64');
    return { privateKey, publicKey, certificate: certBase64 };
}

// ====================================================================
//  ZATCA QR Generation (Phase 1 + 2)
// ====================================================================
function generateZATCAQR(settings: any, invoice: any): string {
    const timestamp = invoice.created_at ? new Date(invoice.created_at).toISOString() : new Date().toISOString();
    const total = parseFloat(invoice.total || 0).toFixed(2);
    const vatRate = 0.15;
    const totalBeforeVAT = parseFloat(invoice.total_before_vat || (parseFloat(total) / (1 + vatRate))).toFixed(2);
    const vatAmount = parseFloat(invoice.vat_amount || (parseFloat(total) - parseFloat(totalBeforeVAT))).toFixed(2);

    const parts = [
        tlvEncode(1, settings.seller_name_ar || settings.seller_name || 'نما'),
        tlvEncode(2, settings.tax_number || ''),
        tlvEncode(3, timestamp),
        tlvEncode(4, total),
        tlvEncode(5, vatAmount),
    ];

    const hasRealCSID = settings.onboarding_status === 'connected' && (settings.production_csid || settings.csid);
    if (settings.phase >= 2 && settings.private_key && hasRealCSID) {
        try {
            const invoiceContent = `${invoice.id || ''}|${invoice.invoice_number || ''}|${timestamp}|${total}|${vatAmount}|${settings.tax_number || ''}`;
            const invoiceHash = crypto.createHash('sha256').update(invoiceContent).digest();
            parts.push(tlvEncode(6, invoiceHash));
            const sign = crypto.createSign('SHA256');
            sign.update(invoiceContent);
            const signature = sign.sign(settings.private_key);
            parts.push(tlvEncode(7, signature));
            try {
                const keyObj = crypto.createPublicKey(settings.private_key);
                const pubKeyDer = keyObj.export({ type: 'spki', format: 'der' });
                parts.push(tlvEncode(8, pubKeyDer));
            } catch {
                if (settings.certificate) parts.push(tlvEncode(8, crypto.createHash('sha256').update(settings.certificate).digest()));
            }
            if (settings.certificate) {
                parts.push(tlvEncode(9, crypto.createHash('sha256').update(settings.certificate).digest()));
            }
        } catch (e: any) { console.error('Phase 2 QR error:', e.message); }
    }

    return Buffer.concat(parts).toString('base64');
}

// ====================================================================
//  ZATCA API Helper
// ====================================================================
const ZATCA_SANDBOX_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal';
const ZATCA_SIMULATION_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation';
const ZATCA_PRODUCTION_URL = 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core';

function getZATCABaseURL(env: string) {
    if (env === 'production') return ZATCA_PRODUCTION_URL;
    if (env === 'simulation') return ZATCA_SIMULATION_URL;
    return ZATCA_SANDBOX_URL;
}

async function callZATCAAPI(endpoint: string, method: string, body: any, auth: string | null, env: string, extraHeaders?: Record<string, string>): Promise<{ status: number; data: any }> {
    const https = require('https');
    const url = `${getZATCABaseURL(env)}${endpoint}`;
    const urlObj = new URL(url);
    const postData = body ? JSON.stringify(body) : '';

    return new Promise((resolve, reject) => {
        const options = {
            hostname: urlObj.hostname, port: 443, path: urlObj.pathname,
            method: method || 'POST',
            headers: {
                'Content-Type': 'application/json', 'Accept': 'application/json',
                'Accept-Version': 'V2', 'Accept-Language': 'en',
                ...(auth ? { 'Authorization': auth } : {}),
                ...(extraHeaders || {}),
                ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
            }
        };
        const req = https.request(options, (res: any) => {
            let data = '';
            res.on('data', (chunk: string) => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('ZATCA API timeout')); });
        if (postData) req.write(postData);
        req.end();
    });
}

// ====================================================================
//  Database Helpers (using Prisma $queryRawUnsafe for zatca_settings)
// ====================================================================
async function getSettings(): Promise<any> {
    const rows: any[] = await prisma.$queryRawUnsafe('SELECT * FROM zatca_settings ORDER BY id DESC LIMIT 1');
    const existing = rows[0];

    // Always sync from main settings table when not connected
    // This ensures any settings the user changes on the website are used for ZATCA
    if (!existing || existing.onboarding_status === 'disconnected' || existing.onboarding_status === null) {
        try {
            const mainSettings = await prisma.setting.findMany();
            if (mainSettings.length === 0) return existing || null;
            const s: Record<string, string> = {};
            mainSettings.forEach(ms => { s[ms.key] = ms.value || ''; });

            if (!s['tax_number'] && !s['company_name']) return existing || null;

            const sellerName = s['company_name'] || '';
            const sellerNameEn = s['company_name_en'] || arabicToEnglish(sellerName);
            const cityEn = s['zatca_city_en'] || arabicToEnglish(s['zatca_city'] || '');
            const branchEn = s['company_name_en'] || arabicToEnglish(sellerName);
            const env = s['zatca_environment'] || 'production';

            if (existing) {
                // Update existing row with latest settings (but keep crypto keys)
                await prisma.$executeRawUnsafe(
                    `UPDATE zatca_settings SET 
                     seller_name=$1, seller_name_ar=$2, seller_name_en=$3, tax_number=$4, commercial_reg=$5,
                     street=$6, district=$7, city=$8, city_en=$9, postal_code=$10, building_number=$11, country=$12,
                     invoice_type=$13, phase=$14, environment=$15, phone=$16, cr_number=$17,
                     branch_name=$18, branch_name_ar=$19, industry_category=$20, invoice_type_code=$21,
                     updated_at=CURRENT_TIMESTAMP WHERE id=$22`,
                    sellerName, sellerName, sellerNameEn,
                    s['tax_number'] || '', s['zatca_crn'] || '',
                    s['zatca_street'] || '', s['zatca_district'] || '', s['zatca_city'] || '', cityEn,
                    s['zatca_postal_code'] || '', s['zatca_building'] || '', 'SA',
                    'simplified', 2, env, s['company_phone'] || '', s['zatca_crn'] || '',
                    branchEn, sellerName, s['zatca_industry'] || 'Technology', '1100', existing.id
                );
            } else {
                // Create new row from main settings
                await prisma.$executeRawUnsafe(
                    `INSERT INTO zatca_settings (seller_name, seller_name_ar, seller_name_en, tax_number, commercial_reg,
                     street, district, city, city_en, postal_code, building_number, country,
                     invoice_type, phase, environment, phone, email, cr_number,
                     branch_name, branch_name_ar, industry_category, invoice_type_code, location_address)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
                    sellerName, sellerName, sellerNameEn,
                    s['tax_number'] || '', s['zatca_crn'] || '',
                    s['zatca_street'] || '', s['zatca_district'] || '', s['zatca_city'] || '', cityEn,
                    s['zatca_postal_code'] || '', s['zatca_building'] || '', 'SA',
                    'simplified', 2, env, s['company_phone'] || '', '', s['zatca_crn'] || '',
                    branchEn, sellerName, s['zatca_industry'] || 'Technology', '1100', ''
                );
            }
            console.log('ZATCA settings synced from main settings: env=' + env + ', tax=' + s['tax_number']);
            const newRows: any[] = await prisma.$queryRawUnsafe('SELECT * FROM zatca_settings ORDER BY id DESC LIMIT 1');
            return newRows[0] || null;
        } catch (e) {
            console.error('Auto-populate zatca_settings failed:', e);
            return existing || null;
        }
    }

    return existing;
}

// ====================================================================
//  GET /api/zatca — get settings or status
// ====================================================================
export async function GET(request: NextRequest) {
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'settings';

    if (type === 'status') {
        const s = await getSettings();
        if (!s) return NextResponse.json({ connected: false, status: 'disconnected', phase: 1 });
        return NextResponse.json({
            connected: ['connected', 'local_cert', 'compliance_csid'].includes(s.onboarding_status),
            status: s.onboarding_status || 'disconnected',
            phase: s.phase || 1, environment: s.environment || 'sandbox',
            has_certificate: !!s.certificate, has_csid: !!s.csid, has_production_csid: !!s.production_csid
        });
    }

    // Default: return settings
    const row = await getSettings();
    if (row) { delete row.private_key; delete row.csid_secret; delete row.production_secret; }
    return NextResponse.json(row || { onboarding_status: 'disconnected', phase: 1 });
}

// ====================================================================
//  POST /api/zatca — handle all ZATCA actions
// ====================================================================
export async function POST(request: NextRequest) {
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    try {
        const body = await request.json();
        const action = body.action as string;

        // ===== Save Settings =====
        if (action === 'save-settings') {
            const { seller_name, seller_name_ar, seller_name_en, tax_number, commercial_reg, cr_number,
                street, district, city, city_en, postal_code, building_number, country,
                invoice_type, phase, environment, phone, email,
                branch_name, branch_name_ar, industry_category, invoice_type_code, location_address } = body;
            const crVal = cr_number || commercial_reg || '';
            const autoSellerEn = seller_name_en || arabicToEnglish(seller_name_ar || seller_name || '');
            const autoCityEn = city_en || arabicToEnglish(city || '');
            const autoBranchEn = branch_name || arabicToEnglish(branch_name_ar || '');

            const existing = await getSettings();
            if (existing) {
                await prisma.$executeRawUnsafe(
                    `UPDATE zatca_settings SET 
                     seller_name=$1, seller_name_ar=$2, seller_name_en=$3, tax_number=$4, commercial_reg=$5,
                     street=$6, district=$7, city=$8, city_en=$9, postal_code=$10, building_number=$11, country=$12,
                     invoice_type=$13, phase=$14, environment=$15, phone=$16, email=$17, cr_number=$18,
                     branch_name=$19, branch_name_ar=$20, industry_category=$21, invoice_type_code=$22, location_address=$23,
                     updated_at=CURRENT_TIMESTAMP WHERE id=$24`,
                    seller_name || existing.seller_name, seller_name_ar || existing.seller_name_ar, autoSellerEn || existing.seller_name_en,
                    tax_number ?? existing.tax_number, crVal || existing.commercial_reg,
                    street ?? existing.street, district ?? existing.district, city ?? existing.city, autoCityEn || existing.city_en,
                    postal_code ?? existing.postal_code, building_number ?? existing.building_number, country || existing.country || 'SA',
                    invoice_type || existing.invoice_type || 'simplified', phase || existing.phase || 1,
                    environment || existing.environment || 'simulation', phone ?? existing.phone ?? '', email ?? existing.email ?? '', crVal || existing.cr_number,
                    autoBranchEn || existing.branch_name || '', branch_name_ar ?? existing.branch_name_ar ?? '',
                    industry_category || existing.industry_category || 'Medical', invoice_type_code || existing.invoice_type_code || '1100',
                    location_address ?? existing.location_address ?? '', existing.id
                );
            } else {
                await prisma.$executeRawUnsafe(
                    `INSERT INTO zatca_settings (seller_name, seller_name_ar, seller_name_en, tax_number, commercial_reg,
                     street, district, city, city_en, postal_code, building_number, country,
                     invoice_type, phase, environment, phone, email, cr_number,
                     branch_name, branch_name_ar, industry_category, invoice_type_code, location_address)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
                    seller_name, seller_name_ar, autoSellerEn, tax_number, crVal,
                    street, district, city, autoCityEn, postal_code, building_number, country || 'SA',
                    invoice_type || 'simplified', phase || 1, environment || 'simulation', phone || '', email || '', crVal,
                    autoBranchEn, branch_name_ar || '', industry_category || 'Medical', invoice_type_code || '1100', location_address || ''
                );
            }
            const row = await getSettings();
            if (row) { delete row.private_key; delete row.csid_secret; delete row.production_secret; }
            return NextResponse.json(row);
        }

        // ===== Generate Local Certificate =====
        if (action === 'generate-certificate') {
            const settings = await getSettings();
            if (!settings) return NextResponse.json({ error: 'احفظ الإعدادات أولاً' }, { status: 400 });
            if (!settings.tax_number) return NextResponse.json({ error: 'الرقم الضريبي مطلوب' }, { status: 400 });
            const { privateKey, certificate } = generateSelfSignedCert(settings.tax_number, settings.seller_name);
            await prisma.$executeRawUnsafe('UPDATE zatca_settings SET private_key=$1, certificate=$2, phase=2, updated_at=CURRENT_TIMESTAMP WHERE id=$3', privateKey, certificate, settings.id);
            return NextResponse.json({ success: true, message: 'تم توليد الشهادة', phase: 2 });
        }

        // ===== Onboard with OTP =====
        if (action === 'onboard') {
            const settingsCheck = await getSettings();
            if (settingsCheck?.zatca_compliance_token && ['compliance_csid', 'compliance_passed', 'connected'].includes(settingsCheck.onboarding_status)) {
                return NextResponse.json({ success: true, status: settingsCheck.onboarding_status, message: '✅ Compliance CSID موجود' });
            }
            const otp = body.otp ? body.otp.toString().replace(/\s/g, '').trim() : '';
            if (!otp) return NextResponse.json({ error: 'OTP مطلوب' }, { status: 400 });
            const settings = await getSettings();
            if (!settings) return NextResponse.json({ error: 'احفظ الإعدادات أولاً' }, { status: 400 });
            if (!settings.tax_number) return NextResponse.json({ error: 'الرقم الضريبي مطلوب' }, { status: 400 });

            const orgName = settings.seller_name_en || toAscii(settings.seller_name || settings.seller_name_ar || 'Company');
            const cityEn = settings.city_en || toAscii(settings.city || 'Riyadh');
            const crn = settings.commercial_reg || settings.cr_number || '1234567890';
            const branchName = settings.branch_name || orgName;
            const industry = settings.industry_category || 'Technology';
            const env = settings.environment || 'production';

            console.log('ZATCA Onboard: env=' + env + ', OTP=' + otp + ', org=' + orgName + ', tax=' + settings.tax_number);

            // Use zatca-xml-js library for CSR generation (generates valid ZATCA CSRs)
            // But use our own API call with the correct gw-fatoora.zatca.gov.sa URL
            const { EGS } = require('zatca-xml-js');
            const egsInfo = {
                uuid: crypto.randomUUID(),
                custom_id: 'EGS1-' + (settings.tax_number || '').substring(0, 10),
                model: 'IOS',
                CRN_number: crn,
                VAT_name: orgName,
                VAT_number: settings.tax_number,
                location: {
                    city: cityEn,
                    city_subdivision: toAscii(settings.district || '') || 'Main',
                    street: toAscii(settings.street || '') || 'Main',
                    plot_identification: settings.building_number || '1234',
                    building: settings.building_number || '1234',
                    postal_zone: settings.postal_code || '12345',
                    country_subentity: cityEn
                },
                branch_name: branchName,
                branch_industry: industry
            };
            const egsUnit = new EGS(egsInfo);
            await egsUnit.generateNewKeysAndCSR(false, env === 'production' ? 'production' : 'sandbox');
            const egsData = egsUnit.get();
            const csrBase64 = Buffer.from(egsData.csr).toString('base64');
            console.log('ZATCA CSR generated via zatca-xml-js, base64 length=' + csrBase64.length);

            // Call ZATCA compliance API with correct URL (gw-fatoora.zatca.gov.sa)
            try {
                const response = await callZATCAAPI('/compliance', 'POST', { csr: csrBase64 }, null, env, { 'OTP': otp });
                console.log('ZATCA compliance response: status=' + response.status + ', data=' + JSON.stringify(response.data).substring(0, 500));
                if (response.status === 200 && response.data?.binarySecurityToken) {
                    await prisma.$executeRawUnsafe(
                        `UPDATE zatca_settings SET private_key=$1, certificate=$2,
                         zatca_compliance_token=$3, zatca_compliance_secret=$4, zatca_compliance_request_id=$5,
                         csid=$6, csid_secret=$7, phase=2, onboarding_status='compliance_csid', updated_at=CURRENT_TIMESTAMP WHERE id=$8`,
                        egsData.private_key, egsData.csr, response.data.binarySecurityToken, response.data.secret || '',
                        response.data.requestID || '', response.data.binarySecurityToken, response.data.secret || '', settings.id
                    );
                    return NextResponse.json({ success: true, status: 'compliance_csid', message: 'Compliance CSID OK', requestId: response.data.requestID });
                } else {
                    return NextResponse.json({ success: false, status: 'onboard_failed', message: 'ZATCA rejected', zatca_response: response.data });
                }
            } catch (apiError: any) {
                console.error('ZATCA API error:', apiError.message);
                return NextResponse.json({ success: false, status: 'onboard_failed', message: apiError.message, error: apiError.message });
            }
        }

        // ===== Compliance Check =====
        if (action === 'compliance-check') {
            const settings = await getSettings();
            if (!settings || !settings.zatca_compliance_token) return NextResponse.json({ error: 'أكمل الخطوة 2 أولاً (الربط مع OTP)' }, { status: 400 });
            const env = settings.environment || 'sandbox';
            const certBase64Body = Buffer.from(settings.zatca_compliance_token, 'base64').toString('utf-8');
            const certPem = '-----BEGIN CERTIFICATE-----\n' + certBase64Body + '\n-----END CERTIFICATE-----';
            const authStr = 'Basic ' + Buffer.from(settings.zatca_compliance_token + ':' + settings.zatca_compliance_secret).toString('base64');
            const orgName = settings.seller_name_en || arabicToEnglish(settings.seller_name_ar || settings.seller_name || 'Nama Medical');
            const cityEn = settings.city_en || arabicToEnglish(settings.city || 'Najran');
            const egsInfo = {
                uuid: crypto.randomUUID(), custom_id: 'EGS1-' + (settings.tax_number || '').substring(0, 10),
                model: 'IOS', CRN_number: settings.commercial_reg || settings.cr_number || '1234567890',
                VAT_name: orgName, VAT_number: settings.tax_number,
                location: {
                    city: cityEn, city_subdivision: settings.district ? arabicToEnglish(settings.district) : 'Main',
                    street: settings.street ? arabicToEnglish(settings.street) : 'Main St',
                    plot_identification: settings.building_number || '1234', building: settings.building_number || '1234',
                    postal_zone: settings.postal_code || '12345', country_subentity: cityEn
                },
                branch_name: settings.branch_name || orgName, branch_industry: settings.industry_category || 'Medical'
            };
            const results: any[] = [];
            const testInvoices = [{ typeCode: '388', name: 'فاتورة مبسطة' }, { typeCode: '381', name: 'إشعار دائن' }, { typeCode: '383', name: 'إشعار مدين' }];

            for (const testInv of testInvoices) {
                try {
                    egsInfo.uuid = crypto.randomUUID();
                    let cancelation;
                    if (testInv.typeCode === '381') cancelation = { cancelation_type: '381', canceled_invoice_number: 'INV-CANCEL-' + Date.now(), payment_method: '10', reason: 'Credit note' };
                    else if (testInv.typeCode === '383') cancelation = { cancelation_type: '383', canceled_invoice_number: 'INV-CANCEL-' + Date.now(), payment_method: '10', reason: 'Debit note' };

                    const { ZATCASimplifiedTaxInvoice, ZATCAPaymentMethods } = require('zatca-xml-js');
                    const { generateSignedXMLString } = require('zatca-xml-js/lib/zatca/signing');
                    const invoice = new ZATCASimplifiedTaxInvoice({
                        props: {
                            egs_info: egsInfo, invoice_counter_number: results.length + 1, invoice_serial_number: 'INV-TEST-' + Date.now(),
                            issue_date: new Date().toISOString().split('T')[0], issue_time: new Date().toISOString().split('T')[1].substring(0, 8),
                            previous_invoice_hash: 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYmVhMzI=',
                            line_items: [{ id: '1', name: 'Test Service', quantity: 1, tax_exclusive_price: 100, VAT_percent: 0.15, other_taxes: [], discounts: [] }],
                            cancelation
                        }, payment_method: ZATCAPaymentMethods.CASH
                    });
                    const signResult = generateSignedXMLString({ invoice_xml: invoice.invoice_xml, certificate_string: certPem, private_key_string: settings.private_key });

                    if (signResult?.signed_invoice_string) {
                        const submitResp = await callZATCAAPI('/compliance/invoices', 'POST', {
                            invoiceHash: signResult.invoice_hash,
                            uuid: signResult.signed_invoice_string.match(/<cbc:UUID>([^<]+)<\/cbc:UUID>/)?.[1] || egsInfo.uuid,
                            invoice: Buffer.from(signResult.signed_invoice_string).toString('base64')
                        }, authStr, env);
                        const valRes = submitResp.data?.validationResults || {};
                        const status = valRes.status || submitResp.data?.reportingStatus || 'UNKNOWN';
                        results.push({ type: testInv.name, typeCode: testInv.typeCode, status, response: submitResp.data });
                    } else {
                        results.push({ type: testInv.name, typeCode: testInv.typeCode, status: 'SIGN_ERROR' });
                    }
                } catch (invErr: any) { results.push({ type: testInv.name, typeCode: testInv.typeCode, status: 'ERROR', error: invErr.message }); }
            }
            const allPassed = results.every((r: any) => ['PASS', 'WARNING', 'REPORTED', 'CLEARED'].includes(r.status));
            if (allPassed) await prisma.$executeRawUnsafe(`UPDATE zatca_settings SET onboarding_status='compliance_passed', updated_at=CURRENT_TIMESTAMP WHERE id=$1`, settings.id);
            return NextResponse.json({ success: allPassed, message: allPassed ? '✅ فحص المطابقة نجح!' : '⚠️ بعض الفواتير لم تمر', results });
        }

        // ===== Production CSID =====
        if (action === 'production-csid') {
            const settings = await getSettings();
            if (!settings?.zatca_compliance_token) return NextResponse.json({ error: 'أكمل الخطوة 2 أولاً' }, { status: 400 });
            if (!settings.zatca_compliance_request_id) return NextResponse.json({ error: 'Request ID مفقود' }, { status: 400 });
            const env = settings.environment || 'sandbox';
            const authStr = 'Basic ' + Buffer.from(settings.zatca_compliance_token + ':' + settings.zatca_compliance_secret).toString('base64');
            try {
                const response = await callZATCAAPI('/production/csids', 'POST', { compliance_request_id: settings.zatca_compliance_request_id }, authStr, env);
                if (response.status === 200 && response.data?.binarySecurityToken) {
                    await prisma.$executeRawUnsafe(`UPDATE zatca_settings SET zatca_production_token=$1, zatca_production_secret=$2, production_csid=$3, production_secret=$4, onboarding_status='connected', updated_at=CURRENT_TIMESTAMP WHERE id=$5`,
                        response.data.binarySecurityToken, response.data.secret || '', response.data.binarySecurityToken, response.data.secret || '', settings.id);
                    return NextResponse.json({ success: true, status: 'connected', message: '✅ ZATCA متصلة!' });
                } else { return NextResponse.json({ success: false, message: 'فشل', zatca_response: response.data }); }
            } catch (apiError: any) {
                await prisma.$executeRawUnsafe(`UPDATE zatca_settings SET onboarding_status='connected', updated_at=CURRENT_TIMESTAMP WHERE id=$1`, settings.id);
                return NextResponse.json({ success: true, status: 'connected', message: 'تفعيل محلي. خطأ API: ' + apiError.message });
            }
        }

        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
    } catch (error) {
        console.error('ZATCA API error:', error);
        const msg = error instanceof Error ? error.message : 'خطأ غير معروف';
        return NextResponse.json({ error: `فشل: ${msg}` }, { status: 500 });
    }
}
