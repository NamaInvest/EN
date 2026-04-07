const { Client } = require('ssh2');
const { execSync } = require('child_process');

console.log('Retrieving list of locally modified files...');
const statusOutput = execSync('git diff --name-only').toString();
const files = statusOutput.split('\n').map(l => l.trim()).filter(l => l && (l.endsWith('.tsx') || l.endsWith('.ts') || l.endsWith('.json')) && !l.includes('package'));

console.log(`Found ${files.length} modified files to deploy...`);

const conn = new Client();
conn.on('ready', () => {
    conn.sftp(async (errSftp, sftp) => {
        if (errSftp) throw errSftp;
        
        // ONLY N2, N4, N9, N10
        const nodes = [2, 4, 9, 10];
        
        for (const node of nodes) {
            const cwd = `/www/wwwroot/n${node}.namainvist.com`;
            console.log(`[Node ${node}] Uploading files to ${cwd}...`);
            
            for (const f of files) {
                const rPath = `${cwd}/${f}`;
                try {
                    await new Promise((res, rej) => sftp.fastPut(f, rPath, e => e ? rej(e) : res()));
                } catch(e) {
                    console.error(`[Node ${node}] Failed to upload ${f}:`, e.message);
                }
            }
        }
        
        console.log('Uploading complete. Triggering SAFE SEQUENTIAL builds...');
        
        // Run them sequentially so MySQL isn't overwhelmed during static SSR prerender
        let buildScript = `#!/bin/bash\n`;
        buildScript += `
exec > /root/safe_deploy_fix.log 2>&1
`;
        nodes.forEach(n => {
            const app = `n${n}-main`;
            const cwd = `/www/wwwroot/n${n}.namainvist.com`;
            buildScript += `
echo "=== Building on N${n} ==="
cd ${cwd}
npm run build
pm2 restart ${app} || pm2 restart n${n}
echo "=== Done N${n} ==="
`;
        });
        
        // Execute detached
        conn.exec(`cat << 'EOF' > /root/deploy_safe.sh\n${buildScript}\nEOF\nnohup bash /root/deploy_safe.sh > /dev/null 2>&1 &`, (e2, s2) => {
            s2.on('close', () => {
                console.log('✅ Background SEQUENTIAL builds started seamlessly on N2, N4, N9, N10!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
