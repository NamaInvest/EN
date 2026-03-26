const { PrismaClient } = require('@prisma/client');
const https = require('https');

process.env.DATABASE_URL = "postgres://postgres:nama_db_pass_2024@localhost:5432/nama_medical";
const prisma = new PrismaClient();

async function main() {
    const csrItem = await prisma.setting.findFirst({where: {key: 'zatca_csr_base64'}});
    if (!csrItem) {
        console.log('NO CSR PRESENT IN DATABASE.');
        return;
    }
    console.log('CSR Length:', csrItem.value.length);
    console.log('CSR Head:', csrItem.value.substring(0, 50));
    console.log('CSR Tail:', csrItem.value.substring(csrItem.value.length - 20));
    
    // Check if any r, n, s are missing abnormally, or if newlines are present
    const hasNewlines = /[\r\n\t ]/.test(csrItem.value);
    console.log('Contains Whitespace/Newlines:', hasNewlines);
    
    const payload = JSON.stringify({csr: csrItem.value});
    
    const req = https.request({
        hostname: 'gw-fatoora.zatca.gov.sa',
        path: '/e-invoicing/developer-portal/compliance',
        method: 'POST',
        headers: {
            'OTP': '572432', // User's first OTP
            'Accept-Version': 'V2',
            'Accept-Language': 'en',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    }, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            console.log('STATUS:', res.statusCode);
            console.log('BODY:', body);
        });
    });
    
    req.on('error', e => console.error('NETWORK ERROR:', e));
    req.write(payload);
    req.end();
}

main().finally(() => prisma.$disconnect());
