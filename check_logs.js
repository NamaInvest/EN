const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('cd /www/wwwroot/n11.namainvist.com && npx prisma generate 2>&1 | tail -5 && npm run build 2>&1 | tail -5 && pm2 restart saas-app --silent && echo "SAAS OK"', (e, s) => {
        let out = '';
        s.on('data', d => out += d.toString());
        s.stderr.on('data', d => out += d.toString());
        s.on('close', () => { console.log(out); c.end(); });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
