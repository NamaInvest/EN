const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to HETZNER N1 via SSH');
    const script = `cd /www/wwwroot/namainvist.com && node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
    const c = await prisma.setting.findFirst({where: {key: 'zatca_csr_base64'}});
    if(!c) return console.log('NO CSR');
    
    console.log('CSR Length:', c.value.length);
    console.log('CSR Snippet:', c.value.substring(0, 50));
    console.log('Last chars:', c.value.substring(c.value.length - 20));
    const hasInvalid = /[\\\\r\\\\n\\\\t ]/.test(c.value);
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
    
    req.write(payload);
    req.end();
}
test().catch(console.error).finally(()=>prisma.$disconnect());
"`;

    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
