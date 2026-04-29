const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);

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

async function deployToServer2() {
    console.log('Deploying to Server 2 (204.168.144.74)...');
    const key = `"C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key"`;
    
    for (const file of files) {
        const localPath = path.join(__dirname, file).replace(/\\/g, '/');
        const remotePath = `/var/www/namasoft/${file}`;
        
        const cmd = `C:\\Windows\\System32\\OpenSSH\\scp.exe -o StrictHostKeyChecking=no -i ${key} "${localPath}" root@204.168.144.74:"\\"${remotePath}\\""`;
        try {
            await execPromise(cmd);
            console.log(`✅ Uploaded to Server 2 namasoft: ${file}`);
            
            // Copy to namasoft2
            const cpCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key} root@204.168.144.74 "cp \\"/var/www/namasoft/${file}\\" \\"/var/www/namasoft2/${file}\\""`;
            await execPromise(cpCmd);
            console.log(`✅ Copied to Server 2 namasoft2: ${file}`);
        } catch (e) {
            console.error(`Failed on Server 2 for ${file}:`, e.message);
        }
    }
    
    console.log('Rebuilding Server 2...');
    try {
        const buildCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key} root@204.168.144.74 "cd /var/www/namasoft && npm run build && pm2 restart namasoft && cd /var/www/namasoft2 && npm run build && pm2 restart namasoft2"`;
        const { stdout, stderr } = await execPromise(buildCmd);
        console.log('Server 2 Build done:', stdout);
    } catch (e) {
        console.error('Server 2 Build failed:', e.message);
    }
}

async function deployToServer3() {
    console.log('\nDeploying to Server 3 (185.197.195.202)...');
    const key = `"C:\\Users\\1\\.ssh\\id_ed25519_deploy"`;
    
    for (const file of files) {
        const localPath = path.join(__dirname, file).replace(/\\/g, '/');
        const remotePath = `/var/www/namasoft/${file}`;
        
        const cmd = `C:\\Windows\\System32\\OpenSSH\\scp.exe -o StrictHostKeyChecking=no -i ${key} "${localPath}" root@185.197.195.202:"\\"${remotePath}\\""`;
        try {
            await execPromise(cmd);
            console.log(`✅ Uploaded to Server 3: ${file}`);
        } catch (e) {
            console.error(`Failed on Server 3 for ${file}:`, e.message);
        }
    }
    
    console.log('Rebuilding Server 3...');
    try {
        const buildCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -o StrictHostKeyChecking=no -i ${key} root@185.197.195.202 "cd /var/www/namasoft && npm run build && pm2 restart namasoft"`;
        const { stdout, stderr } = await execPromise(buildCmd);
        console.log('Server 3 Build done:', stdout);
    } catch (e) {
        console.error('Server 3 Build failed:', e.message);
    }
}

async function run() {
    await deployToServer2();
    await deployToServer3();
    console.log('ALL SERVERS DEPLOYED.');
}

run();
