const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 };

const filesToDeploy = [
    { local: 'src/lib/i18n.tsx', remote: 'src/lib/i18n.tsx' },
    { local: 'src/app/layout.tsx', remote: 'src/app/layout.tsx' },
    { local: 'src/app/(dashboard)/layout.tsx', remote: 'src/app/(dashboard)/layout.tsx' },
];

const nodes = [];
for (let i = 1; i <= 10; i++) nodes.push(`n${i}`);

async function deployNode(node) {
    return new Promise((resolve) => {
        const conn = new Client();
        const baseDir = `/www/wwwroot/${node}.namainvist.com`;

        conn.on('ready', () => {
            console.log(`[${node}] Connected. Uploading 3 files...`);
            conn.sftp((err, sftp) => {
                if (err) { console.log(`[${node}] SFTP error`); conn.end(); return resolve(); }
                
                let uploaded = 0;
                filesToDeploy.forEach(file => {
                    sftp.fastPut(file.local, `${baseDir}/${file.remote}`, (err) => {
                        if (err) console.log(`[${node}] ⚠️ ${file.remote}: ${err.message}`);
                        else console.log(`[${node}] ✅ ${file.remote}`);
                        
                        uploaded++;
                        if (uploaded === filesToDeploy.length) {
                            console.log(`[${node}] 🔨 Building...`);
                            const buildCmd = `cd ${baseDir} && npm run build > /tmp/${node}_build.log 2>&1 && pm2 restart ${node} >> /tmp/${node}_build.log 2>&1 && echo BUILD_OK || echo BUILD_FAIL`;
                            
                            conn.exec(buildCmd, (err, stream) => {
                                if (err) { conn.end(); return resolve(); }
                                
                                let output = '';
                                const timeout = setTimeout(() => {
                                    console.log(`[${node}] ⏰ Timeout`);
                                    conn.end(); resolve();
                                }, 120000);
                                
                                stream.on('data', d => output += d.toString());
                                stream.on('close', () => {
                                    clearTimeout(timeout);
                                    console.log(`[${node}] ${output.includes('BUILD_OK') ? '🟢 DONE!' : '❌ FAILED'}`);
                                    conn.end(); resolve();
                                });
                            });
                        }
                    });
                });
            });
        });

        conn.on('error', (err) => { console.log(`[${node}] ❌ ${err.message}`); resolve(); });
        conn.connect(SERVER);
    });
}

(async () => {
    console.log('🚀 Deploying i18n FULL fix (i18n.tsx + both layouts) to N1-N10...\n');
    for (const node of nodes) {
        await deployNode(node);
        console.log('');
    }
    console.log('🎉 Done!');
    process.exit(0);
})();
