const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const testCode = `
'use client';
import { useEffect } from 'react';

export default function CacheBuster() {
    useEffect(() => {
        // Very obvious cache buster so user sees if new code loaded
        console.log("CACHE BUSTER LOADED: VERSION 999");
        if (!localStorage.getItem('alerted_v999')) {
            alert("N2 System Updated! If you see this, cache is broken. Click OK.");
            localStorage.setItem('alerted_v999', '1');
        }
    }, []);
    return null;
}
`;
fs.writeFileSync('CacheBuster.tsx', testCode);

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastPut('CacheBuster.tsx', '/www/wwwroot/n2.namainvist.com/src/components/CacheBuster.tsx', (e) => {
            if (e) throw e;
            
            conn.exec(`
                # Inject it into layout
                sed -i '1i import CacheBuster from "@/components/CacheBuster";' /www/wwwroot/n2.namainvist.com/src/app/\\(dashboard\\)/layout.tsx
                sed -i 's/<div className="app-layout">/<CacheBuster \/>\\n<div className="app-layout">/g' /www/wwwroot/n2.namainvist.com/src/app/\\(dashboard\\)/layout.tsx
                cd /www/wwwroot/n2.namainvist.com && /usr/bin/npm run build
                pm2 restart n2-main
            `, (err, stream) => {
                stream.on('data', d => process.stdout.write(d));
                stream.stderr.on('data', d => process.stdout.write(d));
                stream.on('close', () => {
                    console.log('DONE');
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
