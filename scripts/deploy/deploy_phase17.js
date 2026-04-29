const { Client } = require('ssh2');

const files = [
    'src/app/api/sales/delivery-notes/route.ts',
    'src/app/(dashboard)/sales/delivery-notes/page.tsx',
    'src/app/api/stock/movements/route.ts',
    'src/app/(dashboard)/stock/movements/page.tsx',
    'src/app/api/stock/adjustments/route.ts',
    'src/app/(dashboard)/stock/adjustments/page.tsx',
    'src/app/api/finance/assets/route.ts',
    'src/app/(dashboard)/finance/assets/page.tsx'
];

async function orchestrate() {
    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', () => {
            conn.sftp(async (err, sftp) => {
                if (err) return reject(err);
                
                try {
                    // PARALLEL UPLOAD TO ALL 10 TENANTS
                    const uploadPromises = [];
                    for(let i = 1; i <= 10; i++) {
                        const t = 'n' + i;
                        const rootPath = '/www/wwwroot/' + t + '.namainvist.com';
                        
                        // Execute mkdir
                        await new Promise((resMk, rejMk) => {
                            const mkCommand = 'mkdir -p ' + rootPath + '/src/app/api/sales/delivery-notes ' + 
                                rootPath + '/src/app/\\(dashboard\\)/sales/delivery-notes ' + 
                                rootPath + '/src/app/api/stock/movements ' + 
                                rootPath + '/src/app/\\(dashboard\\)/stock/movements ' + 
                                rootPath + '/src/app/api/stock/adjustments ' + 
                                rootPath + '/src/app/\\(dashboard\\)/stock/adjustments ' + 
                                rootPath + '/src/app/api/finance/assets ' + 
                                rootPath + '/src/app/\\(dashboard\\)/finance/assets';
                                
                            conn.exec(mkCommand, (err, stream) => {
                                if (err) return rejMk(err);
                                stream.resume(); // Empty buffer
                                stream.on('close', resMk);
                            });
                        });
                        
                        // Queue uploads
                        for (const f of files) {
                            const local = 'c:/Users/1/Desktop/alfa/' + f;
                            const remote = rootPath + '/' + f;
                            uploadPromises.push(new Promise((resUp, rejUp) => {
                                sftp.fastPut(local, remote, e => e ? rejUp(e) : resUp());
                            }));
                        }
                        console.log('Queued Phase 17 payloads for ' + t);
                    }
                    
                    console.log('Waiting for all parallel SFTP uploads to finish...');
                    await Promise.all(uploadPromises);
                    console.log("All 10 tenants synced.");

                    // trigger compile
                    console.log("Triggering global concurrent compilation for Phase 17...");
                    const buildCmd = [
                        'for i in {1..10}; do',
                        '  (',
                        '    cd /www/wwwroot/n$i.namainvist.com;',
                        '    npm run build;',
                        '    pm2 restart n$i --update-env;',
                        '  ) > /root/build_n$i_phase17.log 2>&1 &',
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

console.log("Starting Phase 17 synchronization...");
orchestrate().then(() => console.log('Deployment Script Fired Successfully!')).catch(e => console.error(e));
