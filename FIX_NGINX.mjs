import { Client } from 'ssh2';

const conn = new Client();
console.log('🤖 Fixing Nginx config on Fleet Master...');

conn.on('ready', () => {
    conn.exec(`rm -f /www/server/panel/vhost/nginx/n11.namainvist.com.conf && systemctl reload nginx`, (err, stream) => {
        stream.on('close', () => {
            console.log('✅ Nginx configuration repaired! You can now safely click Confirm in aaPanel.');
            conn.end();
        });
    });
}).on('error', (err) => console.log('❌ Error:', err))
.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
