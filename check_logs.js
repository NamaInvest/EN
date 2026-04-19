const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('pm2 restart saas-app && pm2 status saas-app 2>&1 | head -10 && echo "RESTART OK"', (e, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => c.end());
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
