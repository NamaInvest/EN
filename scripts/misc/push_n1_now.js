const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const hostIp = '46.4.188.170';
const targetDir = '/www/wwwroot/n1.namainvist.com';

conn.on('ready', () => {
    console.log('Connected to N1. Uploading fresh ZIP...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const localFile = path.resolve('src.zip');
        const remoteFile = `${targetDir}/src.zip`;
        
        sftp.fastPut(localFile, remoteFile, (err) => {
            if (err) throw err;
            console.log('Upload complete. Triggering extraction and build...');
            
            const cmds = `
                export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use 24
                cd ${targetDir}
                unzip -oq src.zip
                echo "Packages installing..."
                npm install --legacy-peer-deps
                echo "Generate Prisma schema..."
                npx prisma generate
                echo "Syncing Database..."
                npx prisma db push --accept-data-loss
                echo "Running Next.js Compiler..."
                npm run build
                echo "Restarting PM2 Service..."
                pm2 restart n1
                rm src.zip
            `;

            conn.exec(cmds, (err, stream) => {
                if (err) throw err;
                stream.on('close', (code) => {
                    console.log('Deployment finalized! Exit Code:', code);
                    conn.end();
                }).on('data', (d) => process.stdout.write(d))
                  .stderr.on('data', (d) => process.stderr.write(d));
            });
        });
    });
}).connect({
    host: hostIp,
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    keepaliveInterval: 10000
});
