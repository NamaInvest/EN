const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const bashScript = `
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function m() {
    try {
        const csr = await p.setting.findFirst({ where: { key: 'zatca_csr_base64' } });
        if (csr) {
            const clean = csr.value.replace(/[\\r\\n\\s]/g, '');
            await p.setting.update({ where: { key: 'zatca_csr_base64' }, data: { value: clean } });
            console.log('CSR CLEANED ON N2: FROM', csr.value.length, 'TO', clean.length);
        }
    } catch(e) {
        console.error(e);
    } finally {
        await p.$disconnect();
    }
}
m();
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
