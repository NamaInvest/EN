const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('cat /www/wwwroot/n2.namainvist.com/package.json | grep pwa', (e,s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.on('close', () => c.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b'});
