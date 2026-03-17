import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

async function saveSetting(key: string, value: string, description?: string) {
    await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value, description: description || key },
    });
}

export async function POST() {
    const tmpDir = os.tmpdir();
    const ts = Date.now();
    const keyFile = path.join(tmpDir, `zatca_key_${ts}.pem`);
    const csrFile = path.join(tmpDir, `zatca_csr_${ts}.pem`);
    const confFile = path.join(tmpDir, `zatca_conf_${ts}.cnf`);

    const cleanup = () => {
        try { fs.unlinkSync(keyFile); } catch { }
        try { fs.unlinkSync(csrFile); } catch { }
        try { fs.unlinkSync(confFile); } catch { }
    };

    try {
        // Read ALL company data from settings
        const settings = await prisma.setting.findMany({
            where: {
                key: {
                    in: [
                        'company_name', 'company_name_en', 'tax_number',
                        'zatca_crn', 'zatca_city', 'zatca_city_en', 'zatca_industry',
                        'zatca_street', 'zatca_building', 'zatca_district',
                    ]
                }
            }
        });
        const s: Record<string, string> = {};
        settings.forEach(st => { s[st.key] = st.value ?? ''; });

        // === AUTO-TRANSLATION: Arabic → English ===
        // ZATCA CSR requires ALL values in ASCII/English only

        // Saudi cities Arabic → English mapping
        const cityMap: Record<string, string> = {
            'الرياض': 'Riyadh', 'جدة': 'Jeddah', 'مكة': 'Makkah', 'مكة المكرمة': 'Makkah',
            'المدينة': 'Madinah', 'المدينة المنورة': 'Madinah', 'الدمام': 'Dammam',
            'الخبر': 'Khobar', 'الظهران': 'Dhahran', 'تبوك': 'Tabuk', 'أبها': 'Abha',
            'خميس مشيط': 'Khamis Mushait', 'نجران': 'Najran', 'جازان': 'Jazan', 'جيزان': 'Jazan',
            'حائل': 'Hail', 'الطائف': 'Taif', 'ينبع': 'Yanbu', 'بريدة': 'Buraydah',
            'عنيزة': 'Unayzah', 'الجبيل': 'Jubail', 'القطيف': 'Qatif', 'الأحساء': 'Al Ahsa',
            'سكاكا': 'Sakaka', 'عرعر': 'Arar', 'الباحة': 'Al Baha', 'بيشة': 'Bisha',
        };

        // Industry types Arabic → English mapping
        const industryMap: Record<string, string> = {
            'تقنية': 'Technology', 'تكنولوجيا': 'Technology', 'تجارة': 'Retail',
            'تجارة التجزئة': 'Retail', 'مقاولات': 'Construction', 'بناء': 'Construction',
            'صحة': 'Healthcare', 'طب': 'Healthcare', 'مستشفى': 'Healthcare',
            'تعليم': 'Education', 'مطاعم': 'Food Services', 'أغذية': 'Food Services',
            'نقل': 'Transportation', 'عقارات': 'Real Estate', 'سياحة': 'Tourism',
            'صناعة': 'Manufacturing', 'زراعة': 'Agriculture', 'استثمار': 'Investment',
            'خدمات': 'Services', 'اتصالات': 'Telecommunications', 'بنوك': 'Banking',
        };

        // Strip non-ASCII, return fallback if empty
        const toAscii = (v: string, fallback: string) => {
            const ascii = v.replace(/[^\x20-\x7E]/g, '').trim();
            return ascii || fallback;
        };

        // Translate Arabic value using map, or strip to ASCII
        const translate = (value: string, map: Record<string, string>, fallback: string) => {
            const trimmed = value.trim();
            if (!trimmed) return fallback;
            // Check exact match in map
            if (map[trimmed]) return map[trimmed];
            // Check partial match
            for (const [ar, en] of Object.entries(map)) {
                if (trimmed.includes(ar)) return en;
            }
            // If already English/ASCII, use as-is
            const ascii = trimmed.replace(/[^\x20-\x7E]/g, '').trim();
            return ascii || fallback;
        };

        const orgName = toAscii(s['company_name_en'] || s['company_name'], 'Company');
        const vatNumber = toAscii(s['tax_number'], '300000000000003');
        const crn = toAscii(s['zatca_crn'], '1000000000');
        const city = s['zatca_city_en']
            ? toAscii(s['zatca_city_en'], 'Riyadh')
            : translate(s['zatca_city'], cityMap, 'Riyadh');
        const industry = translate(s['zatca_industry'], industryMap, 'Technology');
        const egsUuid = crypto.randomUUID();
        // SN format: 1-SolutionName|2-Model|3-SerialNumber (matching SDK format)
        const serialNumber = `1-NamaInvest|2-1.0|3-${egsUuid}`;
        const street = toAscii(s['zatca_street'], 'Main');
        const building = toAscii(s['zatca_building'], '0000');
        // registeredAddress = full branch location (matching SDK: "building street, city")
        const branchLocation = `${building} ${street}, ${city}`;

        console.log(`ZATCA CSR fields: O=${orgName}, VAT=${vatNumber}, city=${city}, ind=${industry}, loc=${branchLocation}`);

        // Build OpenSSL config — EXACT copy of zatca-xml-js SDK csr_template
        // NO basicConstraints, NO keyUsage (SDK comments them out)
        // NO oid_section (SDK uses raw OID 1.3.6.1.4.1.311.20.2 directly)
        const lines = [
            '[req]',
            'prompt = no',
            'utf8 = no',
            'distinguished_name = my_req_dn_prompt',
            'req_extensions = v3_req',
            '',
            '[ v3_req ]',
            '1.3.6.1.4.1.311.20.2 = ASN1:UTF8String:ZATCA-Code-Signing',
            'subjectAltName = dirName:dir_sect',
            '',
            '[ dir_sect ]',
            `SN = ${serialNumber}`,
            `UID = ${vatNumber}`,
            'title = 0100',
            `registeredAddress = ${branchLocation}`,
            `businessCategory = ${industry}`,
            '',
            '[my_req_dn_prompt]',
            `commonName = EGS1-886431145`,
            `organizationalUnitName = ${orgName}`,
            `organizationName = ${orgName}`,
            'countryName = SA',
            '',
        ];

        fs.writeFileSync(confFile, lines.join('\n'), 'utf-8');

        // Step 1: Generate ECDSA private key (secp256k1 = ZATCA requirement)
        execSync(`openssl ecparam -name secp256k1 -genkey -noout -out "${keyFile}" 2>&1`, { encoding: 'utf-8' });

        // Step 2: Generate PKCS#10 CSR (using -sha256 flag, same as SDK)
        const csrOutput = execSync(`openssl req -new -sha256 -key "${keyFile}" -config "${confFile}" -out "${csrFile}" 2>&1`, { encoding: 'utf-8' });
        if (csrOutput) console.log('CSR output:', csrOutput);

        // Verify CSR file exists
        if (!fs.existsSync(csrFile)) {
            throw new Error('CSR file was not created - OpenSSL config may have errors');
        }

        // Read generated files
        const privateKeyPem = fs.readFileSync(keyFile, 'utf-8');
        const csrPem = fs.readFileSync(csrFile, 'utf-8').trim();

        // Store private key as base64 (stripped PEM headers)
        const privateKeyBase64 = privateKeyPem
            .replace(/-----BEGIN[^-]+-----/g, '')
            .replace(/-----END[^-]+-----/g, '')
            .replace(/[\r\n\s]/g, '');

        // CRITICAL: Store CSR as FULL PEM text (with headers)
        // ZATCA API expects: base64(PEM text) — the SDK does Buffer.from(csr).toString("base64")
        // So we store the full PEM and base64-encode it when sending
        await saveSetting('zatca_private_key', privateKeyBase64, 'ZATCA Private Key (auto)');
        await saveSetting('zatca_certificate', csrPem, 'ZATCA CSR PEM (auto)');

        cleanup();

        return NextResponse.json({
            success: true,
            message: `✅ تم توليد المفاتيح والـ CSR تلقائياً — ${orgName} (${vatNumber})`,
        });
    } catch (error) {
        cleanup();
        console.error('ZATCA key generation error:', error);
        const msg = error instanceof Error ? error.message : 'خطأ';
        return NextResponse.json({ error: `فشل في توليد المفاتيح: ${msg}` }, { status: 500 });
    }
}
