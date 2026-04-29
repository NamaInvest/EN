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

    console.log('\nDeploying to Fleet Server (main-site & saas-dev)...');
    try {
        await new Promise((resolve, reject) => {
            const conn = new Client();
            conn.on('ready', () => {
                const cmd = `
                    cd /www/wwwroot/namainvist.com && tar -xzf /root/translations_fix.tar.gz && npm run build && pm2 restart main-site &&
                    cd /www/wwwroot/n7.namainvist.com && tar -xzf /root/translations_fix.tar.gz && npm run build && pm2 restart saas-dev
                `;
                conn.exec(cmd, (err, stream) => {
                    if (err) return reject(err);
                    stream.on('data', d => process.stdout.write(d));
                    stream.on('close', () => {
                        console.log('✅ Fleet Server (main-site & saas-dev) deployed!');
                        conn.end();
                        resolve();
                    });
                });
            }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
        });
    } catch (e) { console.log('Error on Fleet', e.message); }

    console.log('\nDeploying to Server 2 (204.168.144.74)...');
    const key2 = `"C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key"`;
    try {
        await execPromise(`C:\\Windows\\System32\\OpenSSH\\scp.exe -o StrictHostKeyChecking=no -i ${key2} "${localTar}" root@204.168.144.74:/root/translations_fix.tar.gz`);
        const sshCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key2} root@204.168.144.74 "cd /var/www/namasoft && tar -xzf /root/translations_fix.tar.gz && npm run build && pm2 restart namasoft && cd /var/www/namasoft2 && tar -xzf /root/translations_fix.tar.gz && npm run build && pm2 restart namasoft2"`;
        await execPromise(sshCmd);
        console.log('✅ Server 2 deployed!');
    } catch (e) { console.log('Error on Server 2', e.message); }

    console.log('\nDeploying to Server 3 (185.197.195.202)...');
    const key3 = `"C:\\Users\\1\\.ssh\\id_ed25519_deploy"`;
    try {
        await execPromise(`C:\\Windows\\System32\\OpenSSH\\scp.exe -o StrictHostKeyChecking=no -i ${key3} "${localTar}" root@185.197.195.202:/root/translations_fix.tar.gz`);
        const sshCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key3} root@185.197.195.202 "cd /var/www/namasoft && tar -xzf /root/translations_fix.tar.gz && npm run build && pm2 restart namasoft"`;
        await execPromise(sshCmd);
        console.log('✅ Server 3 deployed!');
    } catch (e) { console.log('Error on Server 3', e.message); }

    console.log('\n🎉 ALL DONE');
}

run();
