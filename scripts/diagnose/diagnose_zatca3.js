const fs = require('fs');
const https = require('https');
const { PrismaClient } = require('@prisma/client');

const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL="?([^"\n]+)"?/);

process.env.DATABASE_URL = match[1];
const prisma = new PrismaClient();

async function test() {
    const c = await prisma.setting.findFirst({where: {key: 'zatca_csr_base64'}});
    if (!c) {
        console.log('NO CSR PRESENT IN DATABASE.');
        return;
    }
    console.log('CSR Length:', c.value.length);
    console.log('CSR Snippet:', c.value.substring(0, 50));
    
    const payload = JSON.stringify({csr: c.value});
    console.log('Sending payload to ZATCA Compliance CSID API... OTP: 586277');
    
    const req = https.request({
        hostname: 'gw-fatoora.zatca.gov.sa',
        path: '/e-invoicing/developer-portal/compliance',
        method: 'POST',
        headers: {
            'OTP': '586277',
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
    
    req.on('error', e => console.error(e));
    req.write(payload);
    req.end();
}

test().catch(console.error).finally(() => prisma.$disconnect());
