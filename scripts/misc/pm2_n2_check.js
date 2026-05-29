const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('curl -s http://127.0.0.1:3002/dashboard | grep -E "POS|الكوبونات"', (e,s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.on('close', () => c.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD'});
