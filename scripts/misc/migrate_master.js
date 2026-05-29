const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const localSchema = path.join(__dirname, 'prisma', 'schema.prisma');
const localContent = fs.readFileSync(localSchema, 'utf8');

conn.on('ready', () => {
    console.log('--- CONNECTED. PUSHING MASTER SCHEMA TO HETZNER ---');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const remotePath = '/www/wwwroot/namainvist.com/prisma/schema.prisma';
        
        const writeStream = sftp.createWriteStream(remotePath);
        writeStream.on('close', () => {
            console.log('✅ SFTP UPLOAD COMPLETE! TRIGGERING MIGRATION...');
            
            // Now run the DB Push
            const bashScript = `
cd /www/wwwroot/namainvist.com
npx prisma generate
npx prisma db push --accept-data-loss
            `;
            
            conn.exec(bashScript, (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('✅ HETZNER POSTGRESQL MIGRATION COMPLETE.');
                    conn.end();
                });
            });
        });
        
        writeStream.end(localContent);
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
