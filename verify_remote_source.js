const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.exec("cat /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/settings/page.tsx | grep -n -A 10 'getSettingGroups' | head -30", (err, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log("Settings page:\n", o);
            c.exec("grep -n 'export const languages' /www/wwwroot/n11.namainvist.com/src/lib/i18n.tsx -A 6", (err2, s2) => {
                let o2 = '';
                s2.on('data', d => o2 += d.toString());
                s2.on('close', () => {
                    console.log("\ni18n page:\n", o2);
                    c.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
