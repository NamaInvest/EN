const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx', (err, stream) => {
        let out = "";
        stream.on('data', d => out += d);
        stream.on('close', () => {
             console.log("IndexOf settings_icon:", out.indexOf('SettingsIcon'));
             console.log("Snippet near imports:", out.substring(out.indexOf('SettingsIcon'), out.indexOf('SettingsIcon') + 200).replace(/\r/g, '\\r').replace(/\n/g, '\\n'));
             conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
