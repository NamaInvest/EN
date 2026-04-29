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
                    { local: 'src/components/InvoiceReceipt.tsx', remote: `/www/wwwroot/${nodeName}.namainvist.com/src/components/InvoiceReceipt.tsx` },
                    { local: 'src/components/RiyalLogo.tsx', remote: `/www/wwwroot/${nodeName}.namainvist.com/src/components/RiyalLogo.tsx` },
                    { local: 'src/app/(dashboard)/sales/page.tsx', remote: `/www/wwwroot/${nodeName}.namainvist.com/src/app/(dashboard)/sales/page.tsx` },
                    { local: 'src/app/(dashboard)/sales/options/page.tsx', remote: `/www/wwwroot/${nodeName}.namainvist.com/src/app/(dashboard)/sales/options/page.tsx` },
                    { local: 'src/app/api/settings/currencies/route.ts', remote: `/www/wwwroot/${nodeName}.namainvist.com/src/app/api/settings/currencies/route.ts` }
                ];

                let uploaded = 0;
                
                // Create directories if they don't exist
                c.exec(`mkdir -p /www/wwwroot/${nodeName}.namainvist.com/src/components && mkdir -p /www/wwwroot/${nodeName}.namainvist.com/src/app/\\(dashboard\\)/sales/options && mkdir -p /www/wwwroot/${nodeName}.namainvist.com/src/app/api/settings/currencies`, (e) => {
                    filesToUpload.forEach(f => {
                        sftp.fastPut(f.local, f.remote, (err) => {
                            if (err) console.error(`[${nodeName}] Upload failed for ${f.local}:`, err);
                            else console.log(`[${nodeName}] Uploaded ${f.local}`);
                            
                            uploaded++;
                            if (uploaded === filesToUpload.length) {
                                console.log(`[${nodeName}] All files uploaded. Starting build...`);
                                const cmd = `
                                    set -e
                                    cd /www/wwwroot/${nodeName}.namainvist.com
                                    export NVM_DIR="/root/.nvm"
                                    [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
                                    npm run build || npx next build
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
    console.log("Starting deployment...");
    await deployTo('n11', '46.4.188.170', 'n11');
    console.log("ALL DONE!");
}

main();
