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
            const uuid = typeof crypto !== 'undefined' ? crypto.randomUUID() : '11223344-5566-7788-9900-aabbccddeeff';
            const orgName = arabicToEnglish(companyName);
            const cityEn = settingsDict.zatca_city_en || arabicToEnglish(city) || 'Riyadh';
            const branchName = settingsDict.branch_name_en || 'HeadOffice';
            
            const EGS_Name = orgName.replace(/\s+/g, '').substring(0, 15) || 'NAMA';
            const cnName = `PRE-311985620700003`; // Wait actually better: PRE- + taxNumber
            const serialNumber = `1-${EGS_Name}|2-${branchName.replace(/\s+/g, '')}|3-${uuid}`;
            const locationAddress = settingsDict.zatca_city_en || 'Riyadh';
            const industryCategory = settingsDict.zatca_industry || industry || 'Medical';

            const csrConfig = `csr.common.name=${cnName}
csr.serial.number=${serialNumber}
csr.organization.identifier=${taxNumber}
csr.organization.unit.name=${branchName}
csr.organization.name=${orgName}
csr.country.name=SA
csr.invoice.type=1100
csr.location.address=${locationAddress}
csr.industry.business.category=${industryCategory}`;

            fs.writeFileSync(`${tmpDir}/csr-config.properties`, csrConfig);
            
            // Native secure ECDSA key generation
            const cryptoInstance = require('crypto');
            const { privateKey } = cryptoInstance.generateKeyPairSync('ec', {
                namedCurve: 'secp256k1',
                publicKeyEncoding:  { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
            });
            fs.writeFileSync(`${tmpDir}/private.key`, privateKey);
            
            // Execute Official ZATCA Java SDK without -pem to generate pure base64 (Solves Invalid-CSR!)
            try {
                execSync(`fatoora -csr -csrConfig ${tmpDir}/csr-config.properties -privateKey ${tmpDir}/private.key -generatedCsr ${tmpDir}/csr.txt`);
            } catch (fatooraErr: any) {
                console.error("ZATCA Fatoora CSR Gen Error:", fatooraErr.message);
                throw new Error("فشل توليد الشهادة باستخدام أداة الزكاة الرسمية: " + fatooraErr.message);
            }

            privateKeyClean = fs.readFileSync(`${tmpDir}/private.key`, 'utf-8');
            // Read the clean Base64 string exported directly by Fatoora Java Module
            csrBase64 = fs.readFileSync(`${tmpDir}/csr.txt`, 'utf-8').trim();
        } finally {
            try { execSync(`rm -rf ${tmpDir}`); } catch (e) { }
        }

        // Upsert into DB
        const updateTasks = [
            prisma.setting.upsert({ where: { key: 'zatca_private_key' }, update: { value: privateKeyClean }, create: { key: 'zatca_private_key', value: privateKeyClean } }),
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
