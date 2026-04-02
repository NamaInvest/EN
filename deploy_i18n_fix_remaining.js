const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 };

// N1 already done via previous script. Now do N2-N10.
const nodes = [];
for (let i = 2; i <= 10; i++) nodes.push(`n${i}`);

const filesToDeploy = [
    { local: 'src/app/layout.tsx', remote: 'src/app/layout.tsx' },
    { local: 'src/app/(dashboard)/layout.tsx', remote: 'src/app/(dashboard)/layout.tsx' },
];

async function deployNode(node) {
    return new Promise((resolve) => {
        const conn = new Client();
        const baseDir = `/www/wwwroot/${node}.namainvist.com`;

        conn.on('ready', () => {
            console.log(`[${node}] ✅ Connected. Uploading...`);
            conn.sftp((err, sftp) => {
                if (err) { console.log(`[${node}] ❌ SFTP error`); conn.end(); return resolve(); }
                
                let uploaded = 0;
                filesToDeploy.forEach(file => {
                    sftp.fastPut(file.local, `${baseDir}/${file.remote}`, (err) => {
                        if (err) console.log(`[${node}] ⚠️ ${file.remote} failed: ${err.message}`);
                        else console.log(`[${node}] 📦 ${file.remote} OK`);
                        
                        uploaded++;
                        if (uploaded === filesToDeploy.length) {
                            // Build in background using nohup, wait for finish with a timeout
                            const buildCmd = `cd ${baseDir} && npm run build > /tmp/${node}_build.log 2>&1 && pm2 restart ${node} >> /tmp/${node}_build.log 2>&1 && echo BUILD_OK || echo BUILD_FAIL`;
                            
                            console.log(`[${node}] 🔨 Building (may take ~45s)...`);
                            conn.exec(buildCmd, { pty: false }, (err, stream) => {
                                if (err) { console.log(`[${node}] ❌ Exec error`); conn.end(); return resolve(); }
                                
                                let output = '';
                                const timeout = setTimeout(() => {
                                    console.log(`[${node}] ⏰ Build timeout (120s). Check /tmp/${node}_build.log on server.`);
                                    conn.end();
                                    resolve();
                                }, 120000);
                                
                                stream.on('data', d => { output += d.toString(); });
                                stream.on('close', () => {
                                    clearTimeout(timeout);
                                    if (output.includes('BUILD_OK')) {
                                        console.log(`[${node}] 🟢 DONE!`);
                                    } else {
                                        console.log(`[${node}] ❌ Build issue. Check /tmp/${node}_build.log`);
                                    }
                                    conn.end();
                                    resolve();
                                });
                            });
                        }
                    });
                });
            });
        });

        conn.on('error', (err) => {
            console.log(`[${node}] ❌ Error: ${err.message}`);
            resolve();
        });

        conn.connect(SERVER);
    });
}

(async () => {
    console.log('🚀 Deploying i18n fix to N2-N10 (N1 already done)...\n');
    
    for (const node of nodes) {
        await deployNode(node);
        console.log('');
    }
    
    console.log('🎉 All nodes deployed!');
    process.exit(0);
})();
