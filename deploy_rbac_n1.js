const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const FILES = [
    { local: 'd:\\namasoft9-3-main\\src\\components\\Sidebar.tsx', remote: '/www/wwwroot/n1.namainvist.com/src/components/Sidebar.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\settings\\page.tsx', remote: '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/settings/page.tsx' },
];

async function putFile(sftp, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        const localCode = fs.readFileSync(localPath, 'utf8');
        const stream = sftp.createWriteStream(remotePath);
        stream.on('close', resolve);
        stream.on('error', reject);
        stream.write(localCode);
        stream.end();
    });
}

function execute(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', (code) => {
                if (code !== 0) reject(new Error('Exit code ' + code));
                else resolve();
            });
        });
    });
}

async function deployN1() {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', async () => {
            console.log('Connected to N1 for RBAC...');
            conn.sftp(async (err, sftp) => {
                if (err) throw err;
                for (const file of FILES) {
                    await putFile(sftp, file.local, file.remote);
                    console.log(`Uploaded ${file.remote}`);
                }
                
                console.log('Rebuilding N1...');
                await execute(conn, `
                    pm2 stop n9 n10 whatsapp-bot1 whatsapp-bot2
                    cd /www/wwwroot/n1.namainvist.com
                    npx prisma generate
                    npm run build
                    pm2 restart n1 n9 n10 whatsapp-bot1 whatsapp-bot2
                `);
                console.log('N1 RBAC deployment completed.');
                conn.end();
                resolve();
            });
        }).on('error', reject).connect(SSH_CONFIG);
    });
}

deployN1().catch(console.error);
