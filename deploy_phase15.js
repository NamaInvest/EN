const { Client } = require('ssh2');

const files = [
    'prisma/schema.prisma',
    'src/app/api/purchases/requisitions/route.ts',
    'src/app/(dashboard)/purchases/requisitions/page.tsx',
    'src/app/api/purchases/rfq/route.ts',
    'src/app/(dashboard)/purchases/rfq/page.tsx',
    'src/app/api/purchases/grn/route.ts',
    'src/app/(dashboard)/purchases/grn/page.tsx'
];

async function orchestrate() {
    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', () => {
            conn.sftp(async (err, sftp) => {
                if (err) return reject(err);
                
                try {
                    // PARALLEL UPLOAD TO ALL 10 TENANTS!
                    const uploadPromises = [];
                    for(let i = 1; i <= 10; i++) {
                        const t = 'n' + i;
                        const rootPath = '/www/wwwroot/' + t + '.namainvist.com';
                        
                        // Execute mkdir
                        await new Promise((resMk, rejMk) => {
                            const mkCommand = 'mkdir -p ' + rootPath + '/src/app/api/purchases/requisitions ' + 
                                rootPath + '/src/app/api/purchases/rfq ' + 
                                rootPath + '/src/app/api/purchases/grn ' + 
                                rootPath + '/src/app/\\(dashboard\\)/purchases/requisitions ' + 
                                rootPath + '/src/app/\\(dashboard\\)/purchases/rfq ' + 
                                rootPath + '/src/app/\\(dashboard\\)/purchases/grn';
                                
                            conn.exec(mkCommand, (err, stream) => {
                                if (err) return rejMk(err);
                                stream.resume(); // Empty buffer
                                stream.on('close', resMk);
                            });
                        });
                        
                        // Queue uploads
                        for (const f of files) {
                            const local = 'd:/namasoft9-3-main/' + f;
                            const remote = rootPath + '/' + f;
                            uploadPromises.push(new Promise((resUp, rejUp) => {
                                sftp.fastPut(local, remote, e => e ? rejUp(e) : resUp());
                            }));
                        }
                        console.log('Queued Phase 15 for ' + t);
                    }
                    
                    console.log('Waiting for all parallel SFTP uploads to finish...');
                    await Promise.all(uploadPromises);
                    console.log("All 10 tenants synced.");

                    // trigger compile
                    console.log("Triggering global concurrent compilation...");
                    const buildCmd = [
                        'for i in {1..10}; do',
                        '  (',
                        '    cd /www/wwwroot/n$i.namainvist.com;',
                        '    npx prisma db push --accept-data-loss;',
                        '    npx prisma generate;',
                        '    npm run build;',
                        '    pm2 restart n$i --update-env;',
                        '  ) > /root/build_n$i.log 2>&1 &',
                        'done'
                    ].join(' ');
                    
                    conn.exec(buildCmd, (err, stream) => {
                        if (err) throw err;
                        stream.resume();
                        stream.on('close', () => {
                            console.log("Servers are now compiling and restarting in the background!");
                            conn.end();
                            resolve();
                        });
                    });

                } catch (e) {
                    console.error(e);
                    conn.end();
                    reject(e);
                }
            });
        }).on('error', reject).connect({
            host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000
        });
    });
}

orchestrate().then(() => console.log('Deployment Script Fired!')).catch(e => console.error(e));
