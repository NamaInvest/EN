const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- BEGINNING LEGACY NODE 204.x UPGRADE ---');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        console.log("1. Uploading namasoft_update.zip payload to /var/www/namasoft...");
        const localPath = 'namasoft_update.zip';
        const remotePath = '/var/www/namasoft/namasoft_update.zip';
        
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) {
                console.error('SFTP Upload Failed:', err.message);
                conn.end();
                return;
            }
            console.log("✅ Upload complete.");

            const cmd = `
                echo "2. Securing Legacy Environment Secrets (.env)..."
                cd /var/www/namasoft
                cp .env .env.backup_phase88
                
                echo "3. Extracting N1 Source Code Archive over legacy files..."
                unzip -o namasoft_update.zip
                
                echo "4. Refreshing Node Modules and Prisma Client SDK..."
                npm install
                
                echo "5. Synchronizing Prisma schema definition non-destructively..."
                npx prisma generate
                
                echo "6. Triggering Next.js Turbopack Compiler..."
                npm run build
                
                echo "7. Rebooting PM2 process 'namasoft'..."
                pm2 restart namasoft --update-env
                
                echo "✅ UPGRADE COMPLETED SAFELY."
            `;

            console.log("Executing remote deployment commands...");
            conn.exec(cmd, (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('data', d => process.stdout.write('STDOUT: ' + d.toString()));
                stream.stderr.on('data', d => process.stderr.write('STDERR: ' + d.toString()));
                stream.on('close', () => {
                    console.log("Connection closed successfully.");
                    conn.end();
                });
            });
        });
    });

}).on('error', (err) => {
    console.error('SSH Connection Failed:', err.message);
}).connect({
    host: '204.168.144.74', 
    port: 22, 
    username: 'root', 
    privateKey: fs.readFileSync('C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key'),
    readyTimeout: 10000
});
