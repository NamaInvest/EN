const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('grep -i clerk /www/wwwroot/n11.namainvist.com/.env 2>/dev/null | head -5 && echo "---LAYOUT---" && head -10 /www/wwwroot/n11.namainvist.com/src/app/layout.tsx 2>/dev/null', (e, s) => {
        let out = '';
        s.on('data', d => out += d.toString());
        s.on('close', () => { console.log(out); c.end(); });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
