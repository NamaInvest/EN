const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('export PATH=/www/server/nvm/versions/node/v24.14.0/bin:$PATH && pm2 stop n2 n3 n4 n5 n6 n7 n8 n9 n10 && pm2 start n2 n3 n4 n5 n6 n7 n8 n9 n10', (e,s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.on('close', () => c.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b'});
