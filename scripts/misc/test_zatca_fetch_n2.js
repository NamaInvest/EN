const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const bashScript = `
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const csrOpt = await prisma.setting.findFirst({ where: { key: 'zatca_csr_base64' } });
        if (!csrOpt) return console.log('CSR NOT FOUND IN DB!');
        
        console.log('Got CSR. Fetching Compliance CSID with OTP: 123456');
        const res = await fetch('https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Version': 'V2',
                'Accept-Language': 'en',
                'OTP': '123456',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ csr: csrOpt.value })
        });
        
        const txt = await res.text();
        console.log('ZATCA RESPONSE CODE:', res.status);
        console.log('ZATCA BODY:', txt);
    } catch(e) {
        console.error('FETCH ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
"
`;
    conn.exec(`cd /www/wwwroot/n2.namainvist.com && ${bashScript}`, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', () => {
            console.log(output);
            conn.end();
        }).on('data', data => output += data.toString());
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
