const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp(async (errSftp, sftp) => {
        if (errSftp) throw errSftp;
        
        const nodes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const sidebarFile = 'src/components/Sidebar.tsx';
        
        for (const node of nodes) {
            const cwd = `/www/wwwroot/n${node}.namainvist.com`;
            const rPath = `${cwd}/${sidebarFile}`;
            console.log(`[Node ${node}] Uploading Unified Sidebar to ${rPath}...`);
            try {
                await new Promise((res, rej) => sftp.fastPut(sidebarFile, rPath, e => e ? rej(e) : res()));
            } catch(e) {
                console.error(`[Node ${node}] Failed upload:`, e.message);
            }
        }
        
        console.log('Uploading Sidebar complete. Triggering SAFE SEQUENTIAL builds...');
        
        // Run sequential build for all 10 servers!
        let buildScript = `#!/bin/bash\nexec > /root/safe_unified_sidebar_deploy.log 2>&1\n`;
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
        
        conn.exec(`cat << 'EOF' > /root/deploy_sidebar.sh\n${buildScript}\nEOF\nnohup bash /root/deploy_sidebar.sh > /dev/null 2>&1 &`, (e2, s2) => {
            s2.on('close', () => {
                console.log('✅ Background SEQUENTIAL builds started seamlessly for unified sidebar on ALL 10 NODES!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
