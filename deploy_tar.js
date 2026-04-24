const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);

async function deployToServer2() {
    console.log('Deploying tarball to Server 2 (204.168.144.74)...');
    const key = `"C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key"`;
    const localTar = path.join(__dirname, 'mojibake_fixes.tar.gz').replace(/\\/g, '/');
    
    try {
        const scpCmd = `C:\\Windows\\System32\\OpenSSH\\scp.exe -o StrictHostKeyChecking=no -i ${key} "${localTar}" root@204.168.144.74:/root/mojibake_fixes.tar.gz`;
        await execPromise(scpCmd);
        console.log('✅ Tarball uploaded to Server 2');
        
        const sshCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key} root@204.168.144.74 "cd /var/www/namasoft && tar -xzf /root/mojibake_fixes.tar.gz && cd /var/www/namasoft2 && tar -xzf /root/mojibake_fixes.tar.gz"`;
        await execPromise(sshCmd);
        console.log('✅ Tarball extracted on Server 2 namasoft & namasoft2');

        console.log('Rebuilding Server 2...');
        const buildCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key} root@204.168.144.74 "cd /var/www/namasoft && npm run build && pm2 restart namasoft && cd /var/www/namasoft2 && npm run build && pm2 restart namasoft2"`;
        const { stdout } = await execPromise(buildCmd);
        console.log('Server 2 Build done:', stdout);
    } catch (e) {
        console.error('Failed on Server 2:', e.message);
    }
}

async function deployToServer3() {
    console.log('\nDeploying tarball to Server 3 (185.197.195.202)...');
    const key = `"C:\\Users\\1\\.ssh\\id_ed25519_deploy"`;
    const localTar = path.join(__dirname, 'mojibake_fixes.tar.gz').replace(/\\/g, '/');
    
    try {
        const scpCmd = `C:\\Windows\\System32\\OpenSSH\\scp.exe -o StrictHostKeyChecking=no -i ${key} "${localTar}" root@185.197.195.202:/root/mojibake_fixes.tar.gz`;
        await execPromise(scpCmd);
        console.log('✅ Tarball uploaded to Server 3');
        
        const sshCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key} root@185.197.195.202 "cd /var/www/namasoft && tar -xzf /root/mojibake_fixes.tar.gz"`;
        await execPromise(sshCmd);
        console.log('✅ Tarball extracted on Server 3');

        console.log('Rebuilding Server 3...');
        const buildCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key} root@185.197.195.202 "cd /var/www/namasoft && npm run build && pm2 restart namasoft"`;
        const { stdout } = await execPromise(buildCmd);
        console.log('Server 3 Build done:', stdout);
    } catch (e) {
        console.error('Failed on Server 3:', e.message);
    }
}

async function run() {
    await deployToServer2();
    await deployToServer3();
    console.log('ALL SERVERS DEPLOYED.');
}

run();
