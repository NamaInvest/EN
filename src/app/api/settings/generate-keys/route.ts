import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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

        // Generate Keys using built-in system OpenSSL (No Java Required!)
        const tmpDir = '/tmp/zatca_' + Date.now();
        execSync(`mkdir -p ${tmpDir}`);
        
        let privateKeyClean = '';
        let csrBase64 = '';
        let csrPem = '';

        try {
            // 1. Generate secp256k1 Private Key
            execSync(`openssl ecparam -name secp256k1 -genkey -noout -out ${tmpDir}/private.key`);
            privateKeyClean = fs.readFileSync(`${tmpDir}/private.key`, 'utf-8');

            // 2. OpenSSL Configuration mapping to ZATCA OIDs
            const uuid = '1122334455';
            const cnName = `TST-${crn}-${taxNumber}`;
            const serialNumber = `1-${companyName}|2-HeadOffice|3-${uuid}`;

            const opensslConf = `[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = v3_req
distinguished_name = dn

[dn]
CN = ${cnName}
C = SA
O = ${companyName}
OU = HeadOffice

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

            // 3. Generate CSR
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
        console.error('ZATCA Generate Keys Error:', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
