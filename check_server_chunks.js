const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec("grep -rl 'sys.str_4390' /www/wwwroot/n11.namainvist.com/.next/static/chunks", (err, s) => {
        s.on('data', d => console.log('File with 4390:', d.toString()));
        s.on('close', () => {
            c.exec("grep -r 'Company Info' /www/wwwroot/n11.namainvist.com/.next/static/chunks", (err2, s2) => {
                s2.on('data', d => console.log('Contains info:', d.toString().slice(0, 100)));
                s2.on('close', () => c.end());
            });
        });
    });
}).connect({host:'46.4.188.170', port: 22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
