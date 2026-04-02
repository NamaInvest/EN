const { Client } = require('ssh2');

const nodes = ['n5', 'n6', 'n7', 'n8', 'n9'];

const conn = new Client();
conn.on('ready', () => {
    console.log('[🚀] Connected! Starting batch reliable deploy...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let i = 0;
        
        const deployNext = () => {
            if (i >= nodes.length) {
                console.log(`[🎉] ALL NODES FINISHED!`);
                conn.end();
                return;
            }
            const node = nodes[i];
            console.log(`\n============================`);
            console.log(`[📡] DEPLOYING ${node.toUpperCase()} ...`);
            console.log(`============================`);
            
            const remotePath = `/www/wwwroot/${node}.namainvist.com/src/lib/i18n.tsx`;
            sftp.fastPut('src/lib/i18n.tsx', remotePath, (err) => {
                if (err) {
                    console.log(`[❌] Path missing or error! Skipping ${node}.`);
                    i++;
                    return deployNext();
                }
                
                console.log(`[✨] Removed old WhatsApp cache, Rebuilding ${node}...`);
                conn.exec(`pkill -f chrome || true; pkill -f puppeteer || true; pm2 stop ${node}-whatsapp || true; rm -rf /www/wwwroot/${node}.namainvist.com/.wwebjs_auth && cd /www/wwwroot/${node}.namainvist.com && npm run build`, (err, stream) => {
                    stream.on('data', d => process.stdout.write(` [${node}] ` + d.toString()));
                    stream.stderr.on('data', d => process.stdout.write(` [${node}-err] ` + d.toString()));
                    stream.on('close', code => {
                        console.log(`\n[✅] Build finished with code ${code}. Restarting PM2 for ${node}...`);
                        conn.exec(`pm2 restart ${node} && pm2 restart ${node}-whatsapp`, (err, stream2) => {
                            stream2.on('data', d => {});
                            stream2.on('close', () => {
                                console.log(`[🟢] ${node.toUpperCase()} IS FULLY DEPLOYED!`);
                                i++;
                                deployNext();
                            });
                        });
                    });
                });
            });
        };
        deployNext();
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
