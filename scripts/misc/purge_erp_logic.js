const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- PURGING ERP SECURITY FROM MARKETING DOMAIN ---');
    
    // Remove the proxy.ts file that forces the /login redirect
    // Rebuild the Next.js app cleanly
    const bashScript = `
#!/bin/bash
cd /www/wwwroot/namainvist.com
echo "Removing proxy.ts to disable ERP redirects on the landing page..."
rm -f src/proxy.ts
rm -f proxy.ts
rm -f src/middleware.ts
rm -f middleware.ts
rm -rf .next

echo "Rebuilding Next.js Marketing App..."
npm run build
pm2 restart nama-main
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('✅ ERP SECURITY PURGED. MARKETING SITE REBUILT ON PORT 2999.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
