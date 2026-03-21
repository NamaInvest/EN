const { Client } = require('ssh2');

const updateSubdomain = (hostIp, username, password, subdomain) => {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log('\n--- Starting sync for ' + subdomain + ' ---');
            
            const createDirsCmd = "mkdir -p /www/wwwroot/" + subdomain + "/src/app/api/manufacturing/orders /www/wwwroot/" + subdomain + "/src/app/api/manufacturing/recipes /www/wwwroot/" + subdomain + "/src/app/\\(dashboard\\)/manufacturing /www/wwwroot/" + subdomain + "/src/app/api/shifts /www/wwwroot/" + subdomain + "/src/app/\\(dashboard\\)/shifts /www/wwwroot/" + subdomain + "/src/app/\\(dashboard\\)/assets /www/wwwroot/" + subdomain + "/src/app/\\(dashboard\\)/settings/whatsapp /www/wwwroot/" + subdomain + "/src/app/\\(dashboard\\)/warehouses/alerts";
            
            conn.exec(createDirsCmd, (err, stream) => {
                if (err) return reject(err);
                
                stream.on('close', () => {
                    conn.sftp((err, sftp) => {
                        if (err) return reject(err);
                        
                        const files = [
                            'prisma/schema.prisma',
                            'src/components/Sidebar.tsx',
                            'src/app/api/products/route.ts',
                            'src/app/api/products/[id]/route.ts',
                            'src/app/(dashboard)/products/page.tsx',
                            'src/app/api/manufacturing/orders/route.ts',
                            'src/app/api/manufacturing/recipes/route.ts',
                            'src/app/(dashboard)/manufacturing/page.tsx',
                            'src/app/api/shifts/route.ts',
                            'src/app/(dashboard)/shifts/page.tsx',
                            'src/app/(dashboard)/settings/page.tsx',
                            'src/app/(dashboard)/hr/loans/page.tsx',
                            'src/app/(dashboard)/accounting/page.tsx',
                            'src/app/globals.css',
                            'src/app/(dashboard)/assets/page.tsx',
                            'src/app/(dashboard)/settings/whatsapp/page.tsx',
                            'src/app/(dashboard)/warehouses/alerts/page.tsx'
                        ];
                        
                        let done = 0;
                        for (let file of files) {
                            const localFile = 'd:/namasoft9-3-main/' + file;
                            const remoteFile = '/www/wwwroot/' + subdomain + '/' + file;
                            
                            sftp.fastPut(localFile, remoteFile, (e) => {
                                if (e) console.error('Upload Error', file, e);
                                done++;
                                if (done === files.length) {
                                    console.log('All files uploaded to ' + subdomain + '. Building...');
                                    const appName = subdomain.split('.')[0];
                                    const cmd = "export PATH=$PATH:/www/server/nvm/versions/node/v24.14.0/bin && cd /www/wwwroot/" + subdomain + " && npx prisma format && npx prisma generate && rm -rf .next && npm run build && pm2 restart " + appName;
                                    
                                    conn.exec(cmd, (e2, stream) => {
                                        if (e2) return reject(e2);
                                        stream.on('data', d => process.stdout.write('[' + appName + '] ' + d.toString()));
                                        stream.on('close', (code) => {
                                            console.log('[' + appName + '] Finished with code ' + code);
                                            conn.end();
                                            resolve();
                                        });
                                    });
                                }
                            });
                        }
                    });
                });
            });
        }).on('error', reject);
        
        conn.connect({ host: hostIp, port: 22, username, password, keepaliveInterval: 10000 });
    });
};

async function main() {
    try {
        console.log('Initiating Mass Update');
        for (let i = 2; i <= 10; i++) {
            await updateSubdomain('46.4.188.170', 'root', '_ee4SWbxLVfH9b', 'n' + i + '.namainvist.com');
        }
        console.log('\\n*** MASS DEPLOYMENT COMPLETE! ***');
    } catch (e) {
        console.error('Mass Deployment Error:', e);
    }
}

main();
