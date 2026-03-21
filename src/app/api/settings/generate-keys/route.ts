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

        // Generate OpenSSL Keys
        // Temporary paths
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        
        const keyPath = path.join(tmpDir, 'private.key');
        const csrPath = path.join(tmpDir, 'cert.csr');
        const confPath = path.join(tmpDir, 'zatca.conf');

        const egsSerialNumber = `1-${companyName.replace(/[^A-Za-z0-9]/g, '')}|2-1.0|3-1122334455`;

        const confContent = `
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = ${companyName}
O = ${companyName}
OU = ${district}
C = SA

[v3_req]
subjectAltName = critical,@zatca_ext

[zatca_ext]
otherName.1 = 1.3.6.1.4.1.311.20.2;UTF8:ZATCA-Code-Signing
otherName.2 = 2.5.4.97;UTF8:${taxNumber}
otherName.3 = 2.5.4.11;UTF8:${egsSerialNumber}
otherName.4 = 2.5.4.17;UTF8:${postalCode}
otherName.5 = 2.5.4.12;UTF8:${building}
otherName.6 = 2.5.4.26;UTF8:${industry}
otherName.7 = 2.5.4.9;UTF8:${street}
`;

        fs.writeFileSync(confPath, confContent);

        try {
            // Generate ECDSA secp256k1 Key and CSR
            execSync(`openssl ecparam -name secp256k1 -genkey -noout -out "${keyPath}"`);
            execSync(`openssl req -new -key "${keyPath}" -out "${csrPath}" -config "${confPath}"`);
        } catch (e: any) {
            console.error('OpenSSL failure:', e?.stdout?.toString(), e?.stderr?.toString());
            return NextResponse.json({ error: 'OpenSSL is not installed or failed to execute.' }, { status: 500 });
        }

        const privateKeyRaw = fs.readFileSync(keyPath, 'utf-8');
        const csrFull = fs.readFileSync(csrPath, 'utf-8');
        
        // ZATCA's API actually requires the Base64 of the pure PEM contents of the CSR
        const csrBase64 = Buffer.from(csrFull).toString('base64');

        // Clean up PEM headers for DB storage if needed
        const privateKeyClean = privateKeyRaw
            .replace('-----BEGIN EC PRIVATE KEY-----', '')
            .replace('-----END EC PRIVATE KEY-----', '')
            .replace(/\n/g, '')
            .replace(/\r/g, '')
            .trim();

        // Upsert into DB
        const updateTasks = [
            prisma.setting.upsert({ where: { key: 'zatca_private_key' }, update: { value: privateKeyClean }, create: { key: 'zatca_private_key', value: privateKeyClean } }),
            prisma.setting.upsert({ where: { key: 'zatca_certificate' }, update: { value: csrFull }, create: { key: 'zatca_certificate', value: csrFull } }), // Store the literal CSR string with PEM here
            prisma.setting.upsert({ where: { key: 'zatca_csr_base64' }, update: { value: csrBase64 }, create: { key: 'zatca_csr_base64', value: csrBase64 } }),
        ];
        
        await Promise.all(updateTasks);

        // Cleanup
        try { fs.unlinkSync(keyPath); fs.unlinkSync(csrPath); fs.unlinkSync(confPath); } catch (e) {}

        return NextResponse.json({ 
            success: true, 
            message: 'تم توليد مفاتيح ZATCA و CSR بنجاح.'
        });

    } catch (e: any) {
        console.error('ZATCA Generate Keys Error:', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
