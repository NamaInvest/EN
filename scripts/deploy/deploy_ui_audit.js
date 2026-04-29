const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);
const { Client } = require('ssh2');

async function run() {
    console.log('Creating tarball of src directory...');
    const localTar = path.join(__dirname, 'ui_audit.tar.gz').replace(/\\/g, '/');
    await execPromise(`tar -czf "${localTar}" src prisma/schema.prisma`);
    console.log('✅ Tarball created');

    console.log('\nDeploying to Fleet Server (46.4.188.170)...');
    try {
        await new Promise((resolve, reject) => {
            const conn = new Client();
            conn.on('ready', () => {
                conn.sftp((err, sftp) => {
                    if (err) return reject(err);
                    sftp.fastPut(localTar, '/root/ui_audit.tar.gz', (err) => {
                        if (err) return reject(err);
                        console.log('✅ Tarball uploaded to Fleet Server');
                        
                        const cmd = `
                            cd /www/wwwroot/n11.namainvist.com && tar -xzf /root/ui_audit.tar.gz && npx prisma db push && npm run build && pm2 restart saas-app &&
                            cd /www/wwwroot/namainvist.com && tar -xzf /root/ui_audit.tar.gz && npx prisma db push && npm run build && pm2 restart main-site &&
                            cd /www/wwwroot/n7.namainvist.com && tar -xzf /root/ui_audit.tar.gz && npx prisma db push && npm run build && pm2 restart saas-dev
                        `;
                        conn.exec(cmd, (err, stream) => {
                            if (err) return reject(err);
                            stream.on('data', d => process.stdout.write(d));
                            stream.on('close', () => {
                                console.log('✅ Fleet Server deployed!');
                                conn.end();
                                resolve();
                            });
                        });
                    });
                });
            }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
        });
    } catch (e) { console.log('Error on Fleet', e.message); }

    console.log('\nDeploying to Server 2 (204.168.144.74)...');
    const key2 = `"C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key"`;
    try {
        await execPromise(`C:\\Windows\\System32\\OpenSSH\\scp.exe -o StrictHostKeyChecking=no -i ${key2} "${localTar}" root@204.168.144.74:/root/ui_audit.tar.gz`);
        const sshCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key2} root@204.168.144.74 "cd /var/www/namasoft && tar -xzf /root/ui_audit.tar.gz && npx prisma db push && npm run build && pm2 restart namasoft && cd /var/www/namasoft2 && tar -xzf /root/ui_audit.tar.gz && npx prisma db push && npm run build && pm2 restart namasoft2"`;
        await execPromise(sshCmd);
        console.log('✅ Server 2 deployed!');
    } catch (e) { console.log('Error on Server 2', e.message); }

    console.log('\nDeploying to Server 3 (185.197.195.202)...');
    const key3 = `"C:\\Users\\1\\.ssh\\id_ed25519_deploy"`;
    try {
        await execPromise(`C:\\Windows\\System32\\OpenSSH\\scp.exe -o StrictHostKeyChecking=no -i ${key3} "${localTar}" root@185.197.195.202:/root/ui_audit.tar.gz`);
        const sshCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key3} root@185.197.195.202 "cd /var/www/namasoft && tar -xzf /root/ui_audit.tar.gz && npx prisma db push && npm run build && pm2 restart namasoft"`;
        await execPromise(sshCmd);
        console.log('✅ Server 3 deployed!');
    } catch (e) { console.log('Error on Server 3', e.message); }

    console.log('\n🎉 ALL DONE');
}

run();
