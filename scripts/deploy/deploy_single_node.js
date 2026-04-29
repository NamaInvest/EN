const { Client } = require('ssh2');
const node = process.argv[2];

if (!node) {
    console.error("Please provide a node identifier (e.g. n4)");
    process.exit(1);
}

const conn = new Client();
conn.on('ready', () => {
    console.log(`[🚀] Deploying to ${node}...`);
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const remotePath = `/www/wwwroot/${node}.namainvist.com/src/lib/i18n.tsx`;
        sftp.fastPut('src/lib/i18n.tsx', remotePath, (err) => {
            if (err) {
                console.log(`[❌] Path missing or error!`);
                conn.end();
                return;
            }
            
            console.log(`[✨] Removed old WhatsApp cache, Rebuilding...`);
            conn.exec(`pkill -f chrome || true; pm2 stop ${node} || true; pm2 stop ${node}-whatsapp || true; rm -rf /www/wwwroot/${node}.namainvist.com/.wwebjs_auth && cd /www/wwwroot/${node}.namainvist.com && npm run build`, (err, stream) => {
                stream.on('data', d => process.stdout.write(d));
                stream.stderr.on('data', d => process.stdout.write(d));
                stream.on('close', code => {
                    console.log(`[✅] Build finished with code ${code}. Restarting PM2...`);
                    conn.exec(`pm2 start ${node} && pm2 start ${node}-whatsapp`, (err, stream2) => {
                        stream2.on('data', d => {});
                        stream2.on('close', () => {
                            console.log(`[🟢] ${node} IS FULLY DEPLOYED!`);
                            conn.end();
                        });
                    });
                });
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
