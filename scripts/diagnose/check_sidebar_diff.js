const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.exec('cat /www/wwwroot/n1.namainvist.com/src/components/Sidebar.tsx | grep -E "coupons|loyalty"', (e,s) => {
        let out = 'N1: ';
        s.on('data', d => out += d.toString());
        s.on('close', () => {
            console.log(out);
            c.exec('cat /www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx | grep -E "coupons|loyalty"', (e2, s2) => {
                let out2 = 'N2: ';
                s2.on('data', d => out2 += d.toString());
                s2.on('close', () => {
                    console.log(out2);
                    c.end();
                })
            });
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b'});
