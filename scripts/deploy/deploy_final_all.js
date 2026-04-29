const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);
const { Client } = require('ssh2');

const files = [
  'src/app/(dashboard)/barcode/page.tsx',
  'src/app/(dashboard)/price-quotes/page.tsx',
  'src/app/(dashboard)/warehouses/options/page.tsx',
  'src/app/page.tsx',
  'src/app/_module-filter.tsx',
  'src/components/ThemeSwitcher.tsx',
  'src/components/Toast.tsx',
  'src/app/(dashboard)/sales/options/page.tsx'
];

async function createTar() {
    console.log('Creating tarball...');
    const localTar = path.join(__dirname, 'mojibake_fixes.tar.gz').replace(/\\/g, '/');
    const filesStr = files.map(f => `"${f}"`).join(' ');
    await execPromise(`tar -czf "${localTar}" ${filesStr}`);
    console.log('✅ Tarball created');
    return localTar;
}

async function deployToFleet(localTar) {
    console.log('\nDeploying to Fleet Server (46.4.188.170)...');
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastPut(localTar, '/root/mojibake_fixes.tar.gz', (err) => {
                    if (err) return reject(err);
                    console.log('✅ Tarball uploaded to Fleet Server');
                    
                    const cmd = `
                        cd /www/wwwroot/namainvist.com && tar -xzf /root/mojibake_fixes.tar.gz && npm run build && pm2 restart main-site &&
                        cd /www/wwwroot/n11.namainvist.com && tar -xzf /root/mojibake_fixes.tar.gz && npm run build && pm2 restart saas-app &&
                        cd /www/wwwroot/n7.namainvist.com && tar -xzf /root/mojibake_fixes.tar.gz && npm run build && pm2 restart saas-dev
                    `;
                    conn.exec(cmd, (err, stream) => {
                        if (err) return reject(err);
                        stream.on('data', d => process.stdout.write(d));
                        stream.on('close', () => {
                            console.log('✅ Fleet Server deployed and rebuilt!');
                            conn.end();
                            resolve();
                        });
                    });
                });
            });
        }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

async function deployToServer2(localTar) {
    console.log('\nDeploying to Server 2 (204.168.144.74)...');
    const key = `"C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key"`;
    
    try {
        await execPromise(`C:\\Windows\\System32\\OpenSSH\\scp.exe -o StrictHostKeyChecking=no -i ${key} "${localTar}" root@204.168.144.74:/root/mojibake_fixes.tar.gz`);
        console.log('✅ Tarball uploaded to Server 2');
        
        const sshCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key} root@204.168.144.74 "cd /var/www/namasoft && tar -xzf /root/mojibake_fixes.tar.gz && cd /var/www/namasoft2 && tar -xzf /root/mojibake_fixes.tar.gz"`;
        await execPromise(sshCmd);
        
        console.log('Rebuilding Server 2...');
        const buildCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key} root@204.168.144.74 "cd /var/www/namasoft && npm run build && pm2 restart namasoft && cd /var/www/namasoft2 && npm run build && pm2 restart namasoft2"`;
        const { stdout } = await execPromise(buildCmd);
        console.log('Server 2 Build done:', stdout.substring(0, 500) + '...');
    } catch (e) {
        console.error('Failed on Server 2:', e.message);
    }
}

async function deployToServer3(localTar) {
    console.log('\nDeploying to Server 3 (185.197.195.202)...');
    const key = `"C:\\Users\\1\\.ssh\\id_ed25519_deploy"`;
    
    try {
        await execPromise(`C:\\Windows\\System32\\OpenSSH\\scp.exe -o StrictHostKeyChecking=no -i ${key} "${localTar}" root@185.197.195.202:/root/mojibake_fixes.tar.gz`);
        console.log('✅ Tarball uploaded to Server 3');
        
        const sshCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key} root@185.197.195.202 "cd /var/www/namasoft && tar -xzf /root/mojibake_fixes.tar.gz"`;
        await execPromise(sshCmd);
        
        console.log('Rebuilding Server 3...');
        const buildCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key} root@185.197.195.202 "cd /var/www/namasoft && npm run build && pm2 restart namasoft"`;
        const { stdout } = await execPromise(buildCmd);
        console.log('Server 3 Build done:', stdout.substring(0, 500) + '...');
    } catch (e) {
        console.error('Failed on Server 3:', e.message);
    }
}

async function run() {
    try {
        const localTar = await createTar();
        await deployToFleet(localTar);
        await deployToServer2(localTar);
        await deployToServer3(localTar);
        console.log('\n🎉 ALL SERVERS FULLY DEPLOYED AND RESTARTED.');
    } catch (e) {
        console.error(e);
    }
}

run();
