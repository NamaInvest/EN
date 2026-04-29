const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- DEPLOYING WHATSAPP CRM & BROADCAST MODULE TO N1 ---');
    
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        
        const filesToUpload = [
            { local: 'src/app/(dashboard)/whatsapp-hub/page.tsx', remote: '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/whatsapp-hub/page.tsx' },
            { local: 'src/app/api/crm/whatsapp/broadcast/route.ts', remote: '/www/wwwroot/n1.namainvist.com/src/app/api/crm/whatsapp/broadcast/route.ts' }
        ];
        
        // Ensure the broadcast folder exists
        await new Promise((res, rej) => {
            conn.exec('mkdir -p /www/wwwroot/n1.namainvist.com/src/app/api/crm/whatsapp/broadcast', (e, stream) => {
                if (e) return rej(e);
                stream.on('close', res);
                stream.resume();
            });
        });

        // Upload files
        for (const file of filesToUpload) {
            await new Promise((res, rej) => {
                sftp.fastPut(file.local, file.remote, e => e ? rej(e) : res());
            });
            console.log(`✅ Uploaded: ${file.local.split('/').pop()}`);
        }
        
        console.log("🚀 Rebuilding Next.js Architecture...");
        const cmd = `
            cd /www/wwwroot/n1.namainvist.com
            npm run build
            pm2 restart n1 --update-env
        `;
        
        conn.exec(cmd, (execErr, stream) => {
            if (execErr) throw execErr;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => {
                console.log('✅ CRM DEPLOYMENT COMPLETE.');
                conn.end();
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
