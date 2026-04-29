const { Client } = require('ssh2');

const files = [
    'src/app/pos/page.tsx',
    'src/app/(dashboard)/hr/jobs/page.tsx'
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
                        const mkCommand = `mkdir -p ${rootPath}/src/app/pos ${rootPath}/src/app/\\(dashboard\\)/hr/jobs`;
                        await new Promise((resMk, rejMk) => {
                            conn.exec(mkCommand, (err, stream) => {
                                if (err) return rejMk(err);
                                stream.resume(); // Empty buffer
                                stream.on('close', resMk);
                            });
                        });
                        
                        // Queue uploads
                        for (const f of files) {
                            const local = `c:/Users/1/Desktop/alfa/${f}`;
                            const remote = `${rootPath}/${f}`;
                            uploadPromises.push(new Promise((resUp, rejUp) => {
                                sftp.fastPut(local, remote, e => e ? rejUp(e) : resUp());
                            }));
                        }
                        console.log(`Queued UI fixes payloads for ${t}`);
                    }
                    
                    console.log('Waiting for all parallel SFTP uploads to finish...');
                    await Promise.all(uploadPromises);
                    console.log("All 10 tenants synced with POS and HR UI fixes.");

                    // trigger compile
                    console.log("Triggering global concurrent compilation for UI fixes...");
                    const buildCmd = [
                        'for i in {1..10}; do',
                        '  (',
                        '    cd /www/wwwroot/n$i.namainvist.com;',
                        '    npm run build;',
                        '    pm2 restart n$i --update-env;',
                        '  ) > /root/build_n$i_ui_fixes.log 2>&1 &',
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

console.log("Starting UI Fixes synchronization...");
orchestrate().then(() => console.log('Deployment Script Fired Successfully!')).catch(e => console.error(e));
