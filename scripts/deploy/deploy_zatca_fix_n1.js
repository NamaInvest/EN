const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to HETZNER N1 via SSH');
    
    // We execute a script on N1 to natively extract company settings,
    // invoke Ubuntu's openssl, stringify the proper CSR without [\\r\\n\\s] corruption,
    // and push it directly to ZATCA Sandbox API with OTP 572432!
    
    const scriptBody = `
const cp = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

const envFile = fs.readFileSync('.env', 'utf8');
const match = envFile.match(/DATABASE_URL="?([^"\\n]+)"?/);
if (match) process.env.DATABASE_URL = match[1];

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAndSubmit() {
    // 1. Fetch real company settings from Prisma
    const settings = await prisma.setting.findMany();
    const s = {};
    settings.forEach(i => s[i.key] = i.value);
    
    const cnName = 'TST-' + (s.commercial_reg || '1010010000') + '-' + (s.tax_number || '300000000000003');
    
    // Transliterate Arabic to English correctly
    const arToEnMap = { 'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': '', 'ئ': 'e', 'ؤ': 'w', 'لا': 'la', ' ': ' ', 'ـ': '' };
    const arabicToEnglish = (text) => {
        if (!text) return '';
        const engPart = text.replace(/[^\\x00-\\x7F]/g, '').trim();
        if (engPart.length > 3) return engPart;
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (/[\\x00-\\x7F]/.test(ch)) { result += ch; }
            else if (arToEnMap[ch]) { result += arToEnMap[ch]; }
        }
        return result.replace(/\\s+/g, ' ').trim().replace(/\\b\\w/g, l => l.toUpperCase()) || 'NamaMedical';
    };

    const orgName = arabicToEnglish(s.company_name_en || 'NamaMedical');
    const branchName = arabicToEnglish(s.branch_name_en || 'HeadOffice');
    const uuid = '11223344-5566-7788-9900-aabbccddeeff';
    const serialNumber = '1-'+orgName+'|2-'+branchName+'|3-'+uuid;

    const opensslConf = \`[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = v3_req
distinguished_name = dn

[dn]
CN = \${cnName}
C = SA
O = \${orgName}
OU = \${branchName}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, nonRepudiation
1.3.6.1.4.1.311.20.2 = ASN1:UTF8String:ZATCA-Code-Signing
subjectAltName = dirName:alt_names

[alt_names]
SN = \${serialNumber}
UID = \${s.tax_number || '300000000000003'}
title = 1100
registeredAddress = \${s.company_address || 'RRRD2929'}
businessCategory = \${s.industry_category || 'Medical'}
\`;

    const tmp = '/tmp/zatca_fix_' + Date.now();
    fs.mkdirSync(tmp, { recursive: true });
    fs.writeFileSync(tmp + '/zatca.cnf', opensslConf);
    
    cp.execSync('openssl ecparam -name secp256k1 -genkey -noout -out ' + tmp + '/private.key');
    cp.execSync('openssl req -new -key ' + tmp + '/private.key -out ' + tmp + '/csr.pem -config ' + tmp + '/zatca.cnf -extensions v3_req');
    
    let csrPem = fs.readFileSync(tmp + '/csr.pem', 'utf8');
    let csrBase64 = csrPem.replace(/-----[^-]+-----/g, '').replace(/[\\r\\n\\s]/g, '');
    
    // Force write uncorrupted CSR into N1 Database
    await prisma.setting.upsert({
        where: { key: 'zatca_csr_base64' },
        update: { value: csrBase64 },
        create: { key: 'zatca_csr_base64', value: csrBase64 }
    });
    
    await prisma.setting.upsert({
        where: { key: 'zatca_private_key' },
        update: { value: fs.readFileSync(tmp + '/private.key', 'utf8') },
        create: { key: 'zatca_private_key', value: fs.readFileSync(tmp + '/private.key', 'utf8') }
    });

    console.log('CSR Base64 Successfully Corrected & Re-saved to DB!');
    
    // Now trigger ZATCA API
    const payload = JSON.stringify({csr: csrBase64});
    
    // We will test multiple OTPs the user provided if the first one fails, but let's try one for now
    const req = https.request({
        hostname: 'gw-fatoora.zatca.gov.sa',
        path: '/e-invoicing/developer-portal/compliance',
        method: 'POST',
        headers: {
            'OTP': '572432',
            'Accept-Version': 'V2',
            'Accept-Language': 'en',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    }, res => {
        let b = '';
        res.on('data', d => b += d);
        res.on('end', () => console.log('ZATCA RESPONSE => STATUS:', res.statusCode, 'BODY:', b));
    });
    
    req.on('error', e => console.log('ERROR', e));
    req.write(payload);
    req.end();
}

fixAndSubmit().catch(console.error).finally(()=>prisma.$disconnect());
`;

    const b64 = Buffer.from(scriptBody).toString('base64');
    const script = `cd /www/wwwroot/n1.namainvist.com && echo "${b64}" | base64 -d > fix_zatca_n1.js && node fix_zatca_n1.js && rm fix_zatca_n1.js`;

    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
