const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
        # Fix sed by using | as delimiter
        sed -i 's|<div className="app-layout">|<CacheBuster />\\n<div className="app-layout">|g' /www/wwwroot/n2.namainvist.com/src/app/\\(dashboard\\)/layout.tsx
        cd /www/wwwroot/n2.namainvist.com && /usr/bin/npm run build
        pm2 restart n2-main
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stdout.write(d));
        stream.on('close', () => {
            console.log('DONE');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
