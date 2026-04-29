const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('export PATH=/www/server/nvm/versions/node/v24.14.0/bin:$PATH && cd /www/wwwroot/n2.namainvist.com/.next/server && grep -r "POS" .', (e,s) => {
        let out = '';
        s.on('data', d => out += d.toString());
        s.on('close', () => {
            console.log("Compiled Next check:", out ? "FOUND NEW CODE IN BUILD" : "NOT FOUND IN BUILD. BUILD FAILED?");
            c.end();
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b'});
