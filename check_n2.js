const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    const cmd = 'export PATH=/www/server/nvm/versions/node/v24.14.0/bin:$PATH && pm2 show n2 | grep "pm2_cwd"';
    c.exec(cmd, (e,s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.on('close', () => c.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b'});
