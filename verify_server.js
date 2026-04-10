const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    // Check 1: what does translations.ts look like on server?
    c.exec("grep -c 'hi\\|ur\\|bn' /www/wwwroot/n11.namainvist.com/src/lib/translations.ts 2>/dev/null", (err, s1) => {
        let o1 = '';
        s1.on('data', d => { o1 += d.toString(); });
        s1.on('close', () => {
            console.log('translations.ts mentions of hi/ur/bn:', o1.trim());
        });
    });

    // Check 2: i18n.tsx on server
    c.exec("grep 'hi\\|ur\\|bn' /www/wwwroot/n11.namainvist.com/src/lib/i18n.tsx 2>/dev/null", (err, s2) => {
        let o2 = '';
        s2.on('data', d => { o2 += d.toString(); });
        s2.on('close', () => {
            console.log('i18n.tsx hi/ur/bn mentions:', o2.trim() || 'NONE - good!');
        });
    });

    // Check 3: what chunk contains 'hi' language now?
    c.exec("grep -l '\"hi\".*\"ur\"\\|Hindi' /www/wwwroot/n11.namainvist.com/.next/static/chunks/*.js 2>/dev/null | head -3", (err, s3) => {
        let o3 = '';
        s3.on('data', d => { o3 += d.toString(); });
        s3.on('close', () => {
            console.log('Chunks with Hindi:', o3.trim() || 'NONE - removed!');
        });
    });

    // Check 4: when was the build done?
    c.exec("ls -la /www/wwwroot/n11.namainvist.com/.next/BUILD_ID", (err, s4) => {
        let o4 = '';
        s4.on('data', d => { o4 += d.toString(); });
        s4.on('close', () => {
            console.log('BUILD_ID timestamp:', o4.trim());
            c.end();
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
