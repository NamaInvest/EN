const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec([
        'echo "=== MAIN PRISMA ===" && cat /www/wwwroot/namainvist.com/src/lib/prisma.ts',
        'echo "" && echo "=== SAAS PRISMA ===" && cat /www/wwwroot/n11.namainvist.com/src/lib/prisma.ts',
        'echo "" && echo "=== USERS ROUTE LINE 2 ===" && head -5 /www/wwwroot/namainvist.com/src/app/api/users/route.ts',
    ].join(' && '), (e, s) => {
        let out = '';
        s.on('data', d => out += d.toString());
        s.on('close', () => { console.log(out); c.end(); });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
