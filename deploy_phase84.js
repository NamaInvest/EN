const { exec } = require('child_process');
const path = require('path');

const filesToDeploy = [
    'src/app/api/pos/checkout/route.ts',
    'src/app/pos/page.tsx',
    'src/app/restaurant-pos/page.tsx',
    'src/app/login/page.tsx',
    'src/app/onboarding/provisioning/page.tsx',
    'src/app/(dashboard)/sales/history/page.tsx',
    'src/components/Sidebar.tsx'
];

const servers = [
    {
        name: 'Server 1 (95.217.187.44)',
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
        console.log(`[EXECUTING]: ${cmd}`);
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`[ERROR]: ${error.message}`);
                resolve(false);
            } else {
                console.log(`[STDOUT]: ${stdout}`);
                if (stderr) console.error(`[STDERR]: ${stderr}`);
                resolve(true);
            }
        });
    });
}

(async () => {
    console.log(`🚀 Starting Zero-Downtime Deployment for Phase 84 Updates...`);
    console.log(`📦 Files slated for deployment: \n${filesToDeploy.join('\n')}\n`);

    for (const server of servers) {
        console.log(`====================================================`);
        console.log(`🌐 DEPLOYING TO: ${server.name}`);
        console.log(`====================================================`);

        // Upload files
        for (const file of filesToDeploy) {
            const localPath = path.resolve(file);
            const unixFile = file.replace(/\\/g, '/');
            
            // For Server 2, we upload to the first path, then copy to the second
            const primaryRemote = server.paths[0].root;
            
            // Create directory first
            const dir = path.dirname(`${primaryRemote}/${unixFile}`);
            await runCmd(`C:\\Windows\\System32\\OpenSSH\\ssh.exe -i "${server.key}" ${server.scpOptions} root@${server.ip} "mkdir -p ${dir}"`);
            
            // SCP the file
            const scpCmd = `C:\\Windows\\System32\\OpenSSH\\scp.exe ${server.scpOptions} -i "${server.key}" "${localPath}" "root@${server.ip}:${primaryRemote}/${unixFile}"`;
            await runCmd(scpCmd);
            
            // If multiple apps on same server (Server 2b), copy the file locally on the remote
            if (server.paths.length > 1) {
                for (let i = 1; i < server.paths.length; i++) {
                    const secondaryRemote = server.paths[i].root;
                    const secondaryDir = path.dirname(`${secondaryRemote}/${unixFile}`);
                    await runCmd(`C:\\Windows\\System32\\OpenSSH\\ssh.exe -i "${server.key}" ${server.scpOptions} root@${server.ip} "mkdir -p ${secondaryDir} && cp ${primaryRemote}/${unixFile} ${secondaryRemote}/${unixFile}"`);
                }
            }
        }
        
        // Build and restart phase
        console.log(`🔄 Triggering Next.js build and PM2 restart for ${server.name}...`);
        
        let buildCommands = [];
        for (const app of server.paths) {
            buildCommands.push(`cd ${app.root} && npm run build && pm2 restart ${app.pm2}`);
        }
        
        const finalSshCmd = `C:\\Windows\\System32\\OpenSSH\\ssh.exe -i "${server.key}" ${server.scpOptions} root@${server.ip} "${buildCommands.join(' && ')}"`;
        await runCmd(finalSshCmd);
        
        console.log(`✅ ${server.name} Deployment Complete!\n`);
    }

    console.log(`🎉 ALL SERVERS UPDATED AND ONLINE!`);
})();
