const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const files = {
    'src/components/SessionGuard.tsx': fs.readFileSync('src/components/SessionGuard.tsx', 'utf8'),
    'src/components/Sidebar.tsx': fs.readFileSync('src/components/Sidebar.tsx', 'utf8'),
    'src/app/api/auth/me/route.ts': fs.readFileSync('src/app/api/auth/me/route.ts', 'utf8')
};

const conn = new Client();
conn.on('ready', () => {
    console.log('--- EXECUTING TARGETED PATCH ON N1 AND ROOT ---');
    
    conn.sftp(async (err, sftp) => {
        if (err) throw err;
        
        try {
            const uploadFile = (remotePath, localContent) => new Promise((resolve, reject) => {
                const writeStream = sftp.createWriteStream(remotePath);
                writeStream.write(localContent);
                writeStream.end();
                writeStream.on('close', resolve);
                writeStream.on('error', reject);
            });

            const ensureDir = (remoteDir) => new Promise((resolve) => {
                conn.exec(\`mkdir -p "\${remoteDir}"\`, (e, s) => s.on('close', resolve));
            });

            // Target 1: N1
            const dirN1 = '/www/wwwroot/n1.namainvist.com';
            await ensureDir(\`\${dirN1}/src/app/api/auth/me\`);
            await uploadFile(\`\${dirN1}/src/components/SessionGuard.tsx\`, files['src/components/SessionGuard.tsx']);
            await uploadFile(\`\${dirN1}/src/components/Sidebar.tsx\`, files['src/components/Sidebar.tsx']);
            await uploadFile(\`\${dirN1}/src/app/api/auth/me/route.ts\`, files['src/app/api/auth/me/route.ts']);
            console.log("✅ Files synced to n1.namainvist.com");

            // Target 2: Root
            const dirRoot = '/www/wwwroot/namainvist.com';
            await ensureDir(\`\${dirRoot}/src/app/api/auth/me\`);
            await uploadFile(\`\${dirRoot}/src/components/SessionGuard.tsx\`, files['src/components/SessionGuard.tsx']);
            await uploadFile(\`\${dirRoot}/src/components/Sidebar.tsx\`, files['src/components/Sidebar.tsx']);
            await uploadFile(\`\${dirRoot}/src/app/api/auth/me/route.ts\`, files['src/app/api/auth/me/route.ts']);
            console.log("✅ Files synced to namainvist.com");

            console.log("🔄 Starting unified Turbo build sequences... (Wait ~2 minutes)");
            
            // Build sequentially using SSH commands. We also explicitly pass PORT=3000 to root and PORT=3001 to n1 during PM2 restart just to be hyper safe.
            const cmd = \`
                echo "1. Building N1..."
                cd \${dirN1} && npm run build && PORT=3001 pm2 restart n1 --update-env
                
                echo "2. Building Root..."
                cd \${dirRoot} && npm run build && PORT=3000 pm2 restart namainvist_root --update-env
                
                echo "🚀 DEPLOYMENT COMPLETED SECURELY!"
            \`;

            conn.exec(cmd, (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('data', d => console.log('STDOUT:', d.toString()));
                stream.stderr.on('data', d => console.error('STDERR:', d.toString()));
                stream.on('close', () => conn.end());
            });

        } catch (e) {
            console.error(e);
            conn.end();
        }
    });

}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'
});
