const { Client } = require('ssh2');

const files = [
    'src/app/globals.css'
];

async function orchestrate() {
    const conn = new Client();
    await new Promise((resolve, reject) => {
        conn.on('ready', () => {
            conn.sftp(async (err, sftp) => {
                if (err) return reject(err);
                
                try {
                    const uploadPromises = [];
                    for(let i = 1; i <= 10; i++) {
                        const t = 'n' + i;
                        const rootPath = '/www/wwwroot/' + t + '.namainvist.com';
                        
                        for (const f of files) {
                            const local = 'd:/namasoft9-3-main/' + f;
                            const remote = rootPath + '/' + f;
                            uploadPromises.push(new Promise((resUp, rejUp) => {
                                sftp.fastPut(local, remote, e => e ? rejUp(e) : resUp());
                            }));
                        }
                    }
                    
                    console.log('Syncing globals.css to all 10 tenants...');
                    await Promise.all(uploadPromises);
                    console.log("Synced CSS.");

                    const buildCmd = [
                        'for i in {1..10}; do',
                        '  (',
                        '    cd /www/wwwroot/n$i.namainvist.com;',
                        '    npm run build;',
                        '    pm2 restart n$i --update-env;',
                        '  ) > /root/build_n$i_css_hotfix.log 2>&1 &',
                        'done'
                    ].join(' ');
                    
                    conn.exec(buildCmd, (err, stream) => {
                        if (err) throw err;
                        stream.resume();
                        stream.on('close', () => {
                            console.log("CSS Hotfix compilation started concurrently.");
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

orchestrate().then(() => console.log('Hotfix Fired!')).catch(e => console.error(e));
