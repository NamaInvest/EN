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
        
        const nodes = [1, 3, 4, 5, 6, 7, 8, 9, 10];
        
        for (const node of nodes) {
            const cwd = node === 1 ? '/www/wwwroot/n1.namainvist.com' : `/www/wwwroot/n${node}.namainvist.com`;
            console.log(`[Node ${node}] Uploading ${files.length} files to ${cwd}...`);
            
            for (const f of files) {
                // Ensure directories exist or assume they do (they do because we only modified existing files)
                const rPath = `${cwd}/${f}`;
                try {
                    await new Promise((res, rej) => sftp.fastPut(f, rPath, e => e ? rej(e) : res()));
                } catch(e) {
                    console.error(`[Node ${node}] Failed to upload ${f}:`, e.message);
                }
            }
        }
        
        console.log('Uploading complete. Triggering background builds...');
        let buildScript = `#!/bin/bash\n`;
        nodes.forEach(n => {
            const app = n === 1 ? 'nama-main' : (n === 2 ? 'n2' : `n${n}-main`);
            const cwd = n === 1 ? '/www/wwwroot/n1.namainvist.com' : `/www/wwwroot/n${n}.namainvist.com`;
            buildScript += `(
  echo "Building on N${n}..."
  cd ${cwd}
  npm run build
  pm2 restart ${app} || pm2 restart n${n}
  echo "Done N${n}"
) > /root/hotfix_src_n${n}.log 2>&1 &\n`;
        });
        
        conn.exec(`cat << 'EOF' > /root/deploy_src.sh\n${buildScript}\nEOF\nbash /root/deploy_src.sh`, (e2, s2) => {
            s2.on('close', () => {
                console.log('✅ Background builds started accurately on all servers!');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
