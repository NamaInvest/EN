const { Client } = require('ssh2'); 
const fs = require('fs');
const conn = new Client(); 

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
    try {
        const r = await p.setting.findMany({
            where: { key: { in: ['zatca_environment', 'tax_number', 'zatca_csr_base64'] } }
        });
        console.log("------- DB RESULTS -------");
        console.log(JSON.stringify(r, null, 2));
    } finally {
        await p.$disconnect();
    }
}
run();
`;

fs.writeFileSync('d:/namasoft9-3-main/n2_db_script.js', scriptContent);

conn.on('ready', () => { 
    conn.sftp((err, sftp) => {
        sftp.fastPut('d:/namasoft9-3-main/n2_db_script.js', '/www/wwwroot/n2.namainvist.com/n2_db_script.js', (errPut) => {
            if (errPut) throw errPut;
            conn.exec('cd /www/wwwroot/n2.namainvist.com && node n2_db_script.js', (errExec, stream) => { 
                stream.on('close',()=>conn.end()).on('data', d=>console.log(d.toString())); 
                stream.stderr.on('data', d=>console.error('SERVER ERR:', d.toString())); 
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
