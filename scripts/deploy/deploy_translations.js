const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);
const { Client } = require('ssh2');

const files = [
  'src/locales/ar.json',
  'src/app/(dashboard)/affiliates/page.tsx'
];

async function run() {
    console.log('Creating tarball...');
    const localTar = path.join(__dirname, 'translations_fix.tar.gz').replace(/\\/g, '/');
    const filesStr = files.map(f => `"${f}"`).join(' ');
    await execPromise(`tar -czf "${localTar}" ${filesStr}`);
    console.log('✅ Tarball created');

    console.log('\nDeploying to Fleet Server (46.4.188.170)...');
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(localTar, '/root/translations_fix.tar.gz', (err) => {
                    if (err) return reject(err);
                    console.log('✅ Tarball uploaded to Fleet Server');
                    
                    const cmd = `
                        cd /www/wwwroot/n11.namainvist.com && tar -xzf /root/translations_fix.tar.gz && npm run build && pm2 restart saas-app
                    `;
                    conn.exec(cmd, (err, stream) => {
                        if (err) return reject(err);
                        stream.on('data', d => process.stdout.write(d));
                        stream.on('close', () => {
                            console.log('✅ saas-app rebuilt and restarted!');
                            conn.end();
                            resolve();
                        });
                    });
                });
            });
        }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

run();
