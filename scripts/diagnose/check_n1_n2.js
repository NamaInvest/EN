const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.exec('cat /www/wwwroot/n1.namainvist.com/src/components/Sidebar.tsx | grep "POS" ; echo "---" ; cat /www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx | grep "POS"', (e,s) => {
        let out = '';
        s.on('data', d => out += d.toString());
        s.on('close', () => {
            console.log(out);
            c.end();
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b'});
