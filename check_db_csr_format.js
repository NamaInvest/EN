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
        if (!csrOpt) {
            console.log('NO CSR IN DB');
            return;
        }
        console.log('IS BASE64 PURE?', !csrOpt.value.includes('\\n') && !csrOpt.value.includes('\\r'));
        console.log('CSR STRINGIFIED:', JSON.stringify(csrOpt.value));
        console.log('CSR RAW LENGTH:', csrOpt.value.length);
    } catch(e) { console.error('DB ERROR:', e); } finally { await prisma.$disconnect(); }
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
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
