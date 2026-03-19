const fs = require('fs');
const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const sshUser = 'root';
const sshPass = '_ee4SWbxLVfH9b';

const files = [
    'src/workers/whatsapp.ts',
    'src/app/(dashboard)/settings/whatsapp/page.tsx',
    'src/app/api/settings/whatsapp/route.ts',
    'src/components/Sidebar.tsx',
    'package.json'
];

console.log('Sending Phase 2 to n1 Server...');

const conn = new Client();
conn.on('ready', () => {
    console.log(`Connected to VPS: ${hostIp}`);
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let done = 0;
        
        // Ensure remote directories exist
        conn.exec('mkdir -p /www/wwwroot/n1.namainvist.com/src/workers && mkdir -p /www/wwwroot/n1.namainvist.com/src/app/\\(dashboard\\)/settings/whatsapp && mkdir -p /www/wwwroot/n1.namainvist.com/src/app/api/settings/whatsapp', (e0) => {
            if (e0) throw e0;
            
            files.forEach(file => {
                const localFile = `d:/namasoft9-3-main/${file}`;
                const remoteFile = `/www/wwwroot/n1.namainvist.com/${file}`;
                sftp.fastPut(localFile, remoteFile, (e) => {
                    if (e) {
                         console.error('Failed to upload', file, e);
                         return;
                    }
                    done++;
                    if (done === files.length) {
                        const cmd = `export PATH=$PATH:/www/server/nvm/versions/node/v24.14.0/bin && cd /www/wwwroot/n1.namainvist.com && npm install whatsapp-web.js qrcode-terminal qrcode.react @types/qrcode.react tsx && rm -rf .next && npm run build && fuser -k 3001/tcp || true && sleep 2 && pm2 restart n1 && pm2 start npm --name "whatsapp-worker" -- run start:whatsapp || pm2 restart whatsapp-worker && pm2 save`;
                        conn.exec(cmd, (e2, stream) => {
                            if (e2) throw e2;
                            stream.on('data', d => process.stdout.write(`[${hostIp}] ${d.toString()}`));
                            stream.stderr.on('data', d => process.stderr.write(`[${hostIp}] ERR: ${d.toString()}`));
                            stream.on('close', (code) => {
                                console.log(`[${hostIp}] Done with code ${code}`);
                                conn.end();
                            });
                        });
                    }
                });
            });
        });
    });
}).connect({
    host: hostIp,
    port: 22,
    username: sshUser,
    password: sshPass,
    readyTimeout: 99999
});
