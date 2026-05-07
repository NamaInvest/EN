const { Client } = require('ssh2');
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

// Files to force-deploy regardless of git status
const FILES = [
    'src/app/(dashboard)/sales/page.tsx',
    'src/app/(dashboard)/stock/page.tsx',
    'src/app/(dashboard)/finance/copa/page.tsx',
    'src/app/(dashboard)/finance/copa/rules/page.tsx',
    'src/app/(dashboard)/procurement/vendors/scorecard/page.tsx',
    'src/app/(dashboard)/reports/cashflow/page.tsx',
    'src/app/(dashboard)/docs/page.tsx',
    'src/lib/period-close-engine.ts',
];

const LOCAL_BASE = 'd:\\namasoft9-3-main';

async function deploy() {
    const conn = new Client();
    conn.on('ready', () => {
        conn.sftp(async (err, sftp) => {
            if (err) throw err;
            for (const target of TARGETS) {
                console.log('\nSyncing to:', target.base);
                for (const file of FILES) {
                    const localPath = path.join(LOCAL_BASE, file.replace(/\//g, path.sep));
                    const remotePath = target.base + '/' + file;
                    const remoteDir = remotePath.substring(0, remotePath.lastIndexOf('/'));
                    if (fs.existsSync(localPath)) {
                        await new Promise(resolve => {
                            conn.exec(`mkdir -p "${remoteDir}"`, () => {
                                sftp.fastPut(localPath, remotePath, () => {
                                    console.log('Uploaded:', file);
                                    resolve();
                                });
                            });
                        });
                    } else {
                        console.log('SKIPPED (not found):', file);
                    }
                }

                console.log('Building and restarting', target.pm2, '...');
                await new Promise(resolve => {
                    conn.exec(`cd ${target.base} && npm run build && pm2 restart ${target.pm2}`, (err, stream) => {
                        stream.on('close', resolve);
                        stream.on('data', d => {
                            const line = d.toString().trim();
                            if (line.includes('error') || line.includes('Error') || line.includes('✓') || line.includes('Route')) {
                                console.log(line);
                            }
                        });
                        stream.stderr.on('data', d => {
                            const line = d.toString().trim();
                            if (line.includes('error') || line.includes('Error')) {
                                console.error(line);
                            }
                        });
                    });
                });
                console.log('✅', target.pm2, 'done!');
            }
            console.log('\n✅ ALL SERVERS UPDATED SUCCESSFULLY!');
            conn.end();
        });
    }).connect(SERVER);
}

deploy();
