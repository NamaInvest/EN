const { Client } = require('ssh2');
const c = new Client();

c.on('ready', () => {
    // The d585 chunk is the one that contains sys.str_4390 raw key (meaning it's the settings page component)
    // Check what the chunk says around 4390 
    c.exec("grep -o '.sys.str_4390.,[^,)]*' /www/wwwroot/n11.namainvist.com/.next/static/chunks/d585aaa053ae6ee6.js | head -3", (err, s) => {
        let out = '';
        s.on('data', d => { out += d.toString(); });
        s.on('close', () => {
            console.log('[d585 around 4390]', out);
            c.end();
        });
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
