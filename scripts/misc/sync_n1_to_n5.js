const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    const bash = `
        echo "[📡] Syncing N1 codebase to N5..."
        rsync -avz --delete \\
            --exclude '.env' \\
            --exclude '.wwebjs_auth' \\
            --exclude 'node_modules' \\
            --exclude 'prisma/*.db' \\
            --exclude 'prisma/*.db-journal' \\
            /www/wwwroot/n1.namainvist.com/ \\
            /www/wwwroot/n5.namainvist.com/
        
        echo "[📡] Rebuilding N5..."
        cd /www/wwwroot/n5.namainvist.com
        echo "   [+] Stopping processes and cleaning cache..."
        pkill -f chrome || true
        pm2 stop n5-whatsapp || true
        rm -rf .wwebjs_auth
        
        echo "   [+] Running Next.js build..."
        /usr/bin/npm run build
        
        echo "   [+] Restarting n5 PM2..."
        pm2 restart n5
        pm2 restart n5-whatsapp
        echo "[✅] n5 codebase fully cloned from N1 and deployed!"
    `;
    conn.exec(bash, (err, stream) => { 
        stream.on('data', d => process.stdout.write(d.toString())); 
        stream.stderr.on('data', d => process.stdout.write(d.toString())); 
        stream.on('close', () => conn.end()); 
    }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
