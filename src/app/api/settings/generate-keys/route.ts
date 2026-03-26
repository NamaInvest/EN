import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settingsDict: Record<string, string> = {};
        const allSettings = await prisma.setting.findMany();
        allSettings.forEach((s: any) => settingsDict[s.key] = s.value);

        const companyName = settingsDict['company_name_en'] || 'Unknown Company';
        const taxNumber = settingsDict['tax_number'];
        const crn = settingsDict['zatca_crn'] || '1010010000';
        const street = settingsDict['zatca_street'] || 'Main Street';
        const building = settingsDict['zatca_building'] || '1234';
        const district = settingsDict['zatca_district'] || 'Al Olaya';
        const city = settingsDict['zatca_city_en'] || 'Riyadh';
        const postalCode = settingsDict['zatca_postal_code'] || '12211';
        const industry = settingsDict['zatca_industry'] || 'Retail';

        if (!taxNumber || taxNumber.length !== 15 || !taxNumber.startsWith('3') || !taxNumber.endsWith('3')) {
            return NextResponse.json({ error: 'الرقم الضريبي غير صالح. يجب أن يكون 15 رقماً ويبدأ وينتهي بـ 3' }, { status: 400 });
        }

        // ====================================================================
        //  Arabic to English Transliteration (for CSR)
        // ====================================================================
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
            return result.replace(/\s+/g, ' ').trim().replace(/\b\w/g, l => l.toUpperCase()) || 'NamaMedical';
        };

        // ====================================================================
        //  Generate ZATCA-compliant CSR using OpenSSL EXACTLY as Guide
        // ====================================================================
        const tmpDir = '/tmp/zatca_' + Date.now();
        let csrBase64 = '';
        let privateKeyClean = '';
        let csrPem = '';

        try {
            execSync(`mkdir -p ${tmpDir}`);
            execSync(`openssl ecparam -name secp256k1 -genkey -noout -out ${tmpDir}/private.key`);
            privateKeyClean = fs.readFileSync(`${tmpDir}/private.key`, 'utf-8');

            const uuid = typeof crypto !== 'undefined' ? crypto.randomUUID() : '11223344-5566-7788-9900-aabbccddeeff';
            const orgName = arabicToEnglish(companyName);
            const cityEn = arabicToEnglish(city);
            const branchName = 'HeadOffice';
            
            const cnName = `TST-${crn}-${taxNumber}`;
            const serialNumber = `1-${orgName}|2-${branchName}|3-${uuid}`;

            const opensslConf = `[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = v3_req
distinguished_name = dn

[dn]
CN = ${cnName}
C = SA
O = ${orgName}
OU = ${branchName}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, nonRepudiation
1.3.6.1.4.1.311.20.2 = ASN1:UTF8String:ZATCA-Code-Signing
subjectAltName = dirName:alt_names

[alt_names]
SN = ${serialNumber}
UID = ${taxNumber}
title = 1100
registeredAddress = RRRD2929
businessCategory = ${industry}
`;
            fs.writeFileSync(`${tmpDir}/zatca.cnf`, opensslConf);
            execSync(`openssl req -new -key ${tmpDir}/private.key -out ${tmpDir}/csr.pem -config ${tmpDir}/zatca.cnf -extensions v3_req`);
            csrPem = fs.readFileSync(`${tmpDir}/csr.pem`, 'utf-8');
            csrBase64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\\r\\n\\s]/g, '');
        } finally {
            try { execSync(`rm -rf ${tmpDir}`); } catch (e) { }
        }

        // Upsert into DB
        const updateTasks = [
            prisma.setting.upsert({ where: { key: 'zatca_private_key' }, update: { value: privateKeyClean }, create: { key: 'zatca_private_key', value: privateKeyClean } }),
            prisma.setting.upsert({ where: { key: 'zatca_certificate' }, update: { value: csrPem }, create: { key: 'zatca_certificate', value: csrPem } }),
            prisma.setting.upsert({ where: { key: 'zatca_csr_base64' }, update: { value: csrBase64 }, create: { key: 'zatca_csr_base64', value: csrBase64 } }),
        ];
        
        await Promise.all(updateTasks);

        return NextResponse.json({ 
            success: true, 
            message: 'تم توليد مفاتيح ZATCA و CSR بنجاح.'
        });

    } catch (e: any) {
        console.error('CSR Generation Error:', e.stderr ? e.stderr.toString() : e.message);
        return NextResponse.json({ error: e.stderr ? `خطأ OpenSSL: ${e.stderr.toString()}` : (e.message || 'Server error') }, { status: 500 });
    }
}
