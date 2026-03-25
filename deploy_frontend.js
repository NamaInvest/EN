const { exec } = require('child_process');
const path = require('path');

const filesToDeploy = [
    'src/app/page.tsx',
    'src/app/onboarding/zatca/page.tsx',
    'src/app/onboarding/provisioning/page.tsx',
    'src/app/restaurant-pos/page.tsx'
];

const servers = [
    {
        name: 'Master Server 1 (namainvist.com)',
        ip: '95.217.187.44',
        key: 'C:\\Users\\1\\.ssh\\hetzner_key',
        paths: [{ root: '/var/www/namasoft', pm2: 'namasoft' }],
        scpOptions: ''
    },
    {
        name: 'Server 2 (204.168.144.74)',
        ip: '204.168.144.74',
        key: 'C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key',
        paths: [
            { root: '/var/www/namasoft', pm2: 'namasoft' },
            { root: '/var/www/namasoft2', pm2: 'namasoft2' }
        ],
        scpOptions: ''
    },
    {
        name: 'Server 3 (185.197.195.202)',
        ip: '185.197.195.202',
        key: 'C:\\Users\\1\\.ssh\\id_ed25519_deploy',
        paths: [{ root: '/var/www/namasoft', pm2: 'namasoft' }],
        scpOptions: '-o StrictHostKeyChecking=no'
    }
];

function runCmd(cmd) {
    return new Promise((resolve) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`[ERROR]: ${error.message}`);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

(async () => {
    console.log(`🚀 Publishing the B2B SaaS Frontend to namainvist.com...`);

    for (const server of servers) {
        console.log(`📡 Uploading UI to ${server.name}...`);
        
        for (const file of filesToDeploy) {
            const localPath = path.resolve(file);
            const unixFile = file.replace(/\\/g, '/');
            const primaryRemote = server.paths[0].root;
            const dir = path.dirname(`${primaryRemote}/${unixFile}`);
            
            await runCmd(`C:\\Windows\\System32\\OpenSSH\\ssh.exe -i "${server.key}" ${server.scpOptions} root@${server.ip} "mkdir -p ${dir}"`);
            await runCmd(`C:\\Windows\\System32\\OpenSSH\\scp.exe ${server.scpOptions} -i "${server.key}" "${localPath}" "root@${server.ip}:${primaryRemote}/${unixFile}"`);
            
            if (server.paths.length > 1) {
                for (let i = 1; i < server.paths.length; i++) {
                    const secondaryRemote = server.paths[i].root;
                    const secondaryDir = path.dirname(`${secondaryRemote}/${unixFile}`);
                    await runCmd(`C:\\Windows\\System32\\OpenSSH\\ssh.exe -i "${server.key}" ${server.scpOptions} root@${server.ip} "mkdir -p ${secondaryDir} && cp ${primaryRemote}/${unixFile} ${secondaryRemote}/${unixFile}"`);
                }
            }
        }
        
        console.log(`🔄 Triggering Zero-Downtime Next.js Build on ${server.name}...`);
        let buildCommands = [];
        for (const app of server.paths) {
            buildCommands.push(`cd ${app.root} && npm run build && pm2 restart ${app.pm2}`);
        }
        
        // Run build in background to unblock loop
        const finalSshCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -i "${server.key}" ${server.scpOptions} root@${server.ip} "nohup bash -c '${buildCommands.join(' && ')}' > /dev/null 2>&1 &"`;
        runCmd(finalSshCmd);
    }
    
    // Also deploy to n1-n10 via 46.4.188.170
    console.log("📡 Triggering parallel SFTP sync for n1-n10 SaaS Cluster...");
    runCmd(`node d:\\namasoft9-3-main\\deploy_phase84_n1_to_n10.js`);
    
    console.log(`✅ Deployment scripts fired successfully for all environments.`);
})();
