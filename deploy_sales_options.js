const { Client } = require('ssh2');
const fs = require('fs');

async function deployTo(nodeName, host, pm2Name) {
    return new Promise((resolve) => {
        const c = new Client();
        c.on('ready', () => {
            c.sftp((err, sftp) => {
                if (err) { console.error(err); c.end(); resolve(); return; }
                
                console.log(`[${nodeName}] Connected. Uploading files...`);
                
                const filesToUpload = [
                    'src/app/(dashboard)/sales/page.tsx',
                    'src/app/(dashboard)/sales/options/page.tsx',
                    'src/components/Sidebar.tsx'
                ];

                let uploaded = 0;
                
                // Create directory if it doesn't exist
                c.exec(`mkdir -p /www/wwwroot/${nodeName}.namainvist.com/src/app/\\(dashboard\\)/sales/options`, (e) => {
                    filesToUpload.forEach(f => {
                        sftp.fastPut(f, `/www/wwwroot/${nodeName}.namainvist.com/${f}`, (err) => {
                            if (err) console.error(`[${nodeName}] Upload failed for ${f}:`, err);
                            else console.log(`[${nodeName}] Uploaded ${f}`);
                            
                            uploaded++;
                            if (uploaded === filesToUpload.length) {
                                console.log(`[${nodeName}] All files uploaded. Starting build...`);
                                const cmd = `
                                    set -e
                                    cd /www/wwwroot/${nodeName}.namainvist.com
                                    npm run build
                                    pm2 restart ${pm2Name}
                                    rm -rf /usr/local/lsws/cachedata/* || true
                                    rm -rf /www/server/nginx/proxy_cache_dir/* || true
                                    nginx -s reload || true
                                    echo "${nodeName} SUCCESSFULLY DEPLOYED!"
                                `;
                                c.exec(cmd, { env: { HOME: '/root', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v22.0.0/bin' } }, (e, stream) => {
                                    stream.on('data', d => process.stdout.write(d.toString()));
                                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                                    stream.on('close', () => { c.end(); resolve(); });
                                });
                            }
                        });
                    });
                });
            });
        }).connect({ host, port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
    });
}

async function main() {
    console.log("Starting deployment for Sales Options to N1 and N11");
    await deployTo('n1', '46.4.188.170', 'nama-main');
    await deployTo('n11', '46.4.188.170', 'n11');
    console.log("ALL DONE!");
}

main();
