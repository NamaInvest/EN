const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    const bash = `
    for i in 5 6 7 8 9; do 
        echo "[📡] Deploying n$i..."
        cp /www/wwwroot/n2.namainvist.com/src/lib/i18n.tsx /www/wwwroot/n$i.namainvist.com/src/lib/
        cd /www/wwwroot/n$i.namainvist.com
        echo "   [+] Stopping processes and cleaning cache..."
        pkill -f chrome || true
        pm2 stop n$i-whatsapp || true
        rm -rf .wwebjs_auth
        echo "   [+] Running Next.js build..."
        /usr/bin/npm run build > build.log 2>&1
        echo "   [+] Restarting n$i PM2..."
        pm2 restart n$i
        pm2 restart n$i-whatsapp
        echo "[✅] n$i fully deployed!"
    done
    `;
    conn.exec(bash, (err, stream) => { 
        stream.on('data', d => process.stdout.write(d.toString())); 
        stream.stderr.on('data', d => process.stdout.write(d.toString())); 
        stream.on('close', () => conn.end()); 
    }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
