const { Client } = require('ssh2');
const fs = require('fs');

const deployToN2 = () => {
    return new Promise((resolve, reject) => {
        const id = 2; // Target N2 only
        const ip = '46.4.188.170';
        const pass = '_ee4SWbxLVfH9b';
        
        const conn = new Client();
        conn.on('ready', () => {
             console.log(`[n${id}] Connecting...`);
             conn.sftp((err, sftp) => {
                 if(err) { conn.end(); return reject(err); }
                 const sftpUpload = (localFile, remoteFile) => new Promise((res, rej) => {
                     sftp.fastPut(localFile, remoteFile, (err) => err ? rej(err) : res());
                 });
                 
                 console.log(`[n${id}] Uploading Batch 1 files...`);
                 Promise.all([
                     sftpUpload('src/lib/i18n.tsx', `/www/wwwroot/n${id}.namainvist.com/src/lib/i18n.tsx`),
                     sftpUpload('src/app/(dashboard)/sales/page.tsx', `/www/wwwroot/n${id}.namainvist.com/src/app/(dashboard)/sales/page.tsx`),
                     sftpUpload('src/app/pos/page.tsx', `/www/wwwroot/n${id}.namainvist.com/src/app/pos/page.tsx`),
                     sftpUpload('src/app/restaurant-pos/page.tsx', `/www/wwwroot/n${id}.namainvist.com/src/app/restaurant-pos/page.tsx`),
                     // Also upload the language switcher just in case it failed before
                     sftpUpload('src/components/LanguageSwitcher.tsx', `/www/wwwroot/n${id}.namainvist.com/src/components/LanguageSwitcher.tsx`)
                 ]).then(() => {
                     console.log(`[n${id}] Files uploaded. Building Next.js on Remote N2...`);
                     const cmd = `export PATH=/www/server/nodejs/v22.11.0/bin:$PATH && cd /www/wwwroot/n${id}.namainvist.com && npm run build`;
                     conn.exec(cmd, (err, stream) => {
                         if(err) { conn.end(); return reject(err); }
                         
                         let buildOutput = '';
                         stream.on('data', d => buildOutput += d);
                         stream.stderr.on('data', d => buildOutput += d);
                         
                         stream.on('close', (code) => {
                             if(code !== 0) {
                                 console.error(`[n${id}] Build failed with code ${code}.`);
                                 console.error(buildOutput.substring(buildOutput.length - 2000));
                                 conn.end();
                                 return reject(new Error(`Build failed on n${id}`));
                             }
                             
                             console.log(`[n${id}] Build complete. Restarting PM2...`);
                             conn.exec(`export PATH=/www/server/nodejs/v22.11.0/bin:$PATH && pm2 restart n${id}`, (err, stream2) => {
                                 if(err) { conn.end(); return reject(err); }
                                 stream2.on('close', () => {
                                     console.log(`[n${id}] ✅ Deploy successfully finished.`);
                                     conn.end();
                                     resolve();
                                 });
                             });
                         });
                     });
                 }).catch(err => { conn.end(); console.error(err); reject(err); });
             });
        }).on('error', reject).connect({
            host: ip, port: 22, username: 'root', password: pass, readyTimeout: 20000
        });
    });
};

deployToN2().catch(e => console.error(e));
