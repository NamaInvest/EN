const { Client } = require('ssh2');
const fs = require('fs');

const nodes = ['n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'];
let currentIndex = 0;
const conn = new Client();

function deployNext() {
    if (currentIndex >= nodes.length) {
        console.log('\\n=== ALL DEPLOYS FINISHED ===');
        conn.end();
        return;
    }

    const node = nodes[currentIndex];
    currentIndex++;
    console.log(`\\n\\n[========== DEPLOYING SHIFT FIX TO ${node.toUpperCase()} ==========]`);
    
    const BASE = `/www/wwwroot/${node}.namainvist.com`;
    
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); deployNext(); return; }
        
        sftp.fastPut('d:/namasoft9-3-main/src/app/(dashboard)/shifts/page.tsx', `${BASE}/src/app/(dashboard)/shifts/page.tsx`, {}, (err) => {
            if (err) { console.error('Upload page err:', err); }
            sftp.fastPut('d:/namasoft9-3-main/src/app/api/shifts/route.ts', `${BASE}/src/app/api/shifts/route.ts`, {}, (err) => {
                if (err) { console.error('Upload route err:', err); }
                
                const cmd = `cd ${BASE} && npm run build 2>&1 | tail -n 10 && pm2 restart ${node} 2>&1 | head -n 3`;
                conn.exec(cmd, (err, stream) => {
                    if(err) { console.error(err); deployNext(); return; }
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => deployNext());
                });
            });
        });
    });
}

conn.on('ready', () => {
    deployNext();
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
