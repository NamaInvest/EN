const { Client } = require('ssh2');

const filesToUpload = [
    { local: 'd:\\namasoft9-3-main\\src\\components\\Sidebar.tsx', remote: 'src/components/Sidebar.tsx' },
    { local: 'd:\\namasoft9-3-main\\src\\lib\\i18n.tsx', remote: 'src/lib/i18n.tsx' },
];

console.log('Initiating Fleet Deployment of Language Hotfix (Nodes 1, 3 to 10)...');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', d => output += d);
        stream.on('close', async () => {
            let processes = [];
            try {
                const start = output.indexOf('[');
                const end = output.lastIndexOf(']') + 1;
                processes = JSON.parse(output.substring(start, end));
            } catch(e) {}
            
            // Filter nodes ignoring n2 (already deployed and verified)
            // Support 'n3-main', 'n3'
            let nodes = processes.filter(p => !!p.name.match(/^n\d+(-main)?$/) || p.name === 'nama-main').filter(p => {
                let nStr = p.name.replace('-main','').replace('n','');
                if (p.name === 'nama-main') nStr = '1';
                const n = parseInt(nStr);
                return n === 1 || (n >= 3 && n <= 10);
            });
            
            // Map names appropriately so we get exact node numbers
            nodes.forEach(n => {
                if (n.name === 'nama-main') n._nodeNum = 1;
                else n._nodeNum = parseInt(n.name.replace('-main','').replace('n',''));
            });
            
            nodes.sort((a,b) => a._nodeNum - b._nodeNum);
            
            // Distinct nodes to avoid dupes if both "n3" and "n3-main" exist
            const seen = new Set();
            nodes = nodes.filter(n => {
                if (seen.has(n._nodeNum)) return false;
                seen.add(n._nodeNum);
                return true;
            });

            console.log(`📡 Distributing to ${nodes.length} nodes: ${nodes.map(n => n.name).join(', ')}`);

            conn.sftp(async (errSftp, sftp) => {
                if (errSftp) throw errSftp;
                
                for (const node of nodes) {
                    const cwd = node.pm2_env.pm_cwd;
                    console.log(`[Node ${node._nodeNum} | ${node.name}] Uploading to (${cwd})`);
                    for (const f of filesToUpload) {
                        try {
                            const rPath = `${cwd}/${f.remote}`;
                            await new Promise((res, rej) => sftp.fastPut(f.local, rPath, e => e ? rej(e) : res()));
                        } catch(e) {
                            console.error(`Error uploading to ${node.name}:`, e.message);
                        }
                    }
                }
                
                console.log('--- Triggering parallel Turbopack builds ---');
                let buildScript = `#!/bin/bash\n`;
                for (const node of nodes) {
                    buildScript += `(
  echo "Building Node ${node._nodeNum}..."
  cd ${node.pm2_env.pm_cwd}
  npm run build
  pm2 restart ${node.name}
  echo "Done Node ${node._nodeNum}"
) > /root/hotfix_build_n${node._nodeNum}.log 2>&1 &\n`;
                }
                
                conn.exec(`cat << 'EOF' > /root/hotfix_build_fleet.sh\n${buildScript}\nEOF\nbash /root/hotfix_build_fleet.sh`, (e2, s2) => {
                    s2.on('close', () => {
                        console.log('✅ Background deployments started for all remaining fleet nodes!');
                        conn.end();
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
