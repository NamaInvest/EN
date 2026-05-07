const { Client } = require('ssh2');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const TARGETS = [
    { base: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { base: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { base: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' }
];

const LOCAL_BASE = 'd:\\namasoft9-3-main';

const modifiedFiles = execSync('git diff HEAD~3 HEAD --name-only').toString().trim().split('\n').filter(f => f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.prisma') || f.endsWith('.json') || f.endsWith('.mjs'));
console.log('Deploying ' + modifiedFiles.length + ' files from the last 3 commits...');

async function deploy() {
    const conn = new Client();
    conn.on('ready', () => {
        conn.sftp(async (err, sftp) => {
            if (err) throw err;
            for (const target of TARGETS) {
                console.log('\nSyncing to:', target.base);
                for (const file of modifiedFiles) {
                    const localPath = path.join(LOCAL_BASE, file.trim());
                    const remotePath = target.base + '/' + file.trim().replace(/\\/g, '/');
                    if(fs.existsSync(localPath)) {
                        await new Promise(resolve => {
                            conn.exec('mkdir -p "' + path.dirname(remotePath) + '"', () => {
                                sftp.fastPut(localPath, remotePath, () => {
                                    console.log('Uploaded:', file.trim());
                                    resolve();
                                });
                            });
                        });
                    }
                }
                
                // If Prisma schema changed, run prisma db push
                if (modifiedFiles.some(f => f.includes('schema.prisma'))) {
                    console.log('Schema changed, running prisma db push...');
                    await new Promise(resolve => {
                        conn.exec('cd ' + target.base + ' && npx prisma db push --skip-generate --accept-data-loss', (err, stream) => {
                            stream.on('close', resolve);
                            stream.on('data', data => console.log(data.toString().trim()));
                        });
                    });
                }

                console.log('Restarting', target.pm2);
                await new Promise(resolve => {
                    conn.exec('cd ' + target.base + ' && npm run build && pm2 restart ' + target.pm2, (err, stream) => {
                        stream.on('close', resolve);
                        stream.on('data', data => { if(data.toString().includes('error') || data.toString().includes('Failed')) console.log(data.toString().trim()); });
                    });
                });
            }
            console.log('\nDone!');
            conn.end();
        });
    }).connect(SERVER);
}

deploy();
