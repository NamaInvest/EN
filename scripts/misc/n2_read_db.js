const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    const script = `
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
    try {
        const r = await p.setting.findMany({
            where: { key: { in: ['zatca_environment', 'tax_number', 'zatca_csr_base64'] } }
        });
        console.log(JSON.stringify(r, null, 2));
    } finally {
        await p.$disconnect();
    }
}
run();
`;
    conn.exec(`node -e "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, { cwd: '/www/wwwroot/n2.namainvist.com' }, (err, stream) => { 
        stream.on('close',()=>conn.end()).on('data', d=>console.log(d.toString())); 
        stream.stderr.on('data', d=>console.error('SERVER ERR:', d.toString())); 
    }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
