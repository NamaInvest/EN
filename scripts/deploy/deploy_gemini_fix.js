const { Client } = require('ssh2');
const fs = require('fs');

const SSH_CONFIG = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };

const files = [
    'src/app/api/purchases/ocr/route.ts',
    'src/app/api/ai-auditor/route.ts',
    'src/app/api/ai-cfo/route.ts',
    'src/app/api/stocktake/vision/route.ts'
];

async function deployN1() {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log('Connected to N1 for Gemini Hotfix...');
            conn.sftp(async (err, sftp) => {
                if (err) return reject(err);
                for (const file of files) {
                    const localPath = 'c:/Users/1/Desktop/alfa/' + file;
                    const remotePath = '/www/wwwroot/n1.namainvist.com/' + file;
                    await new Promise((res, rej) => {
                        sftp.fastPut(localPath, remotePath, (err) => {
                            if (err) rej(err);
                            else {
                                console.log('Uploaded', remotePath);
                                res();
                            }
                        });
                    });
                }
                
                const cmd = `pm2 stop n1 n9 n10 || true && cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1 n9 n10 || true`;
                conn.exec(cmd, (err, stream) => {
                    if (err) return reject(err);
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', (code) => {
                        console.log('Build exited with ' + code);
                        conn.end();
                        resolve();
                    });
                });
            });
        }).connect(SSH_CONFIG);
    });
}

deployN1().catch(console.error);
