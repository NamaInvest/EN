const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    // 1. Check what's actually in settings/page.tsx on server (lines 1-15 and component start)
    c.exec("head -15 '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/settings/page.tsx'", (err, s1) => {
        let o = '';
        s1.on('data', d => { o += d.toString(); });
        s1.on('close', () => {
            console.log('=== settings/page.tsx (server) first 15 lines ===');
            console.log(o);
        });
    });
    
    // 2. Check what's in translations.ts on server
    c.exec("cat /www/wwwroot/n11.namainvist.com/src/lib/translations.ts", (err, s2) => {
        let o = '';
        s2.on('data', d => { o += d.toString(); });
        s2.on('close', () => {
            console.log('=== translations.ts (server) ===');
            console.log(o);
        });
    });
    
    // 3. Check what's in i18n.tsx on server - the languages array
    c.exec("grep -A 10 'export const languages' /www/wwwroot/n11.namainvist.com/src/lib/i18n.tsx", (err, s3) => {
        let o = '';
        s3.on('data', d => { o += d.toString(); });
        s3.on('close', () => {
            console.log('=== i18n.tsx languages array (server) ===');
            console.log(o);
            c.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
