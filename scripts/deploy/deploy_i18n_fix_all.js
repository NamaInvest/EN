const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 };

// Files to deploy
const filesToDeploy = [
    { local: 'src/app/layout.tsx', remote: 'src/app/layout.tsx' },
    { local: 'src/app/(dashboard)/layout.tsx', remote: 'src/app/(dashboard)/layout.tsx' },
];

const nodes = [];
for (let i = 1; i <= 10; i++) nodes.push(`n${i}`);

async function deployNode(node) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const baseDir = `/www/wwwroot/${node}.namainvist.com`;

        conn.on('ready', () => {
            console.log(`[${node}] ✅ Connected. Uploading files...`);

            conn.sftp((err, sftp) => {
                if (err) { console.log(`[${node}] ❌ SFTP error:`, err.message); conn.end(); return resolve(); }

                let uploaded = 0;
                filesToDeploy.forEach(file => {
                    const remotePath = `${baseDir}/${file.remote}`;
                    sftp.fastPut(file.local, remotePath, (err) => {
                        if (err) {
                            console.log(`[${node}] ⚠️ Upload failed for ${file.remote}:`, err.message);
                        } else {
                            console.log(`[${node}] 📦 Uploaded ${file.remote}`);
                        }
                        uploaded++;
                        if (uploaded === filesToDeploy.length) {
                            // Build and restart
                            console.log(`[${node}] 🔨 Building...`);
                            conn.exec(`cd ${baseDir} && npm run build 2>&1 | tail -5`, (err, stream) => {
                                if (err) { console.log(`[${node}] ❌ Exec error`); conn.end(); return resolve(); }
                                let output = '';
                                stream.on('data', d => output += d);
                                stream.on('close', (code) => {
                                    if (code === 0 || output.includes('Generating static pages')) {
                                        console.log(`[${node}] ✅ Build succeeded. Restarting PM2...`);
                                        conn.exec(`pm2 restart ${node}`, (err2, stream2) => {
                                            if (err2) { conn.end(); return resolve(); }
                                            stream2.on('close', () => {
                                                console.log(`[${node}] 🟢 DONE!`);
                                                conn.end();
                                                resolve();
                                            });
                                        });
                                    } else {
                                        console.log(`[${node}] ❌ Build failed. Last output:`);
                                        console.log(output.slice(-500));
                                        conn.end();
                                        resolve();
                                    }
                                });
                            });
                        }
                    });
                });
            });
        });

        conn.on('error', (err) => {
            console.log(`[${node}] ❌ Connection error:`, err.message);
            resolve();
        });

        conn.connect(SERVER);
    });
}

(async () => {
    console.log('🚀 Deploying i18n fix to all nodes (N1-N10)...\n');
    console.log(`Files to deploy: ${filesToDeploy.map(f => f.local).join(', ')}\n`);

    // Deploy sequentially to avoid overloading the server
    for (const node of nodes) {
        await deployNode(node);
        console.log('');
    }

    console.log('🎉 Deployment complete!');
})();
