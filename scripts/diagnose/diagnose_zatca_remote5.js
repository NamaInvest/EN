const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to HETZNER N1 via SSH');
    
    const scriptBody = `
const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const match = envFile.match(/DATABASE_URL="?([^"\\n]+)"?/);
if (match) process.env.DATABASE_URL = match[1];

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
    const c = await prisma.setting.findFirst({where: {key: 'zatca_csr_base64'}});
    if(!c) return console.log('NO CSR IN DB');
    
    console.log('CSR Length:', c.value.length);
    console.log('CSR Head:', c.value.substring(0, 50));
    console.log('CSR Tail:', c.value.substring(c.value.length - 20));
    
    const hasInvalid = /[\\r\\n\\t ]/.test(c.value);
    console.log('Contains invalid chars:', hasInvalid);
    
    const payload = JSON.stringify({csr: c.value});
    const https = require('https');
    
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
        let b = '';
        res.on('data', d => b += d);
        res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', b));
    });
    
    req.on('error', e => console.log('ERROR', e));
    req.write(payload);
    req.end();
}
test().finally(() => prisma.$disconnect());
`;

    const b64 = Buffer.from(scriptBody).toString('base64');
    
    const script = `cd /www/wwwroot/namainvist.com && echo "${b64}" | base64 -d > test_csr.js && node test_csr.js && rm test_csr.js`;

    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
