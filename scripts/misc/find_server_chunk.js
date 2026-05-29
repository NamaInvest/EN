const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec("grep -rl 'SettingsPage\\|getSettingGroups' /www/wwwroot/n11.namainvist.com/.next/server/ 2>/dev/null | head -5", (err, stream) => {
        stream.on('data', d => console.log('Server chunks:', d.toString()));
        stream.on('close', () => {
            c.exec("ls /www/wwwroot/n11.namainvist.com/.next/server/app/\\(dashboard\\)/settings/", (err2, s2) => {
                s2.on('data', d => console.log('Settings dir:', d.toString()));
                s2.on('close', () => c.end());
            });
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD', readyTimeout:30000});
