const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected! Starting targeted sync to N2-N10...');
    
    // Copy modified files from N1 to N2-N10 and build
    const script = `
        for i in {2..10}; do
            echo "Syncing to N$i..."
            cp /www/wwwroot/n1.namainvist.com/src/app/api/settings/generate-keys/route.ts /www/wwwroot/n$i.namainvist.com/src/app/api/settings/generate-keys/route.ts
            cp "/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/settings/page.tsx" "/www/wwwroot/n$i.namainvist.com/src/app/(dashboard)/settings/page.tsx"
            cd /www/wwwroot/n$i.namainvist.com
            # Only build if there's actual changed files mapped.
            npx prisma generate
            npm run build
            pm2 restart n$i
        done
        echo "ALL SERVERS SYNCED AND REBUILT"
    `;

    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => process.stdout.write(data.toString()))
              .stderr.on('data', data => process.stderr.write(data.toString()));
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 60000
});
