const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    // Check where to put the map directive - it needs to be in http{} context
    c.exec('cat /etc/nginx/nginx.conf | head -30 && echo "======" && cat /www/server/panel/vhost/nginx/namainvist.com.conf', (e, s) => {
        let out = '';
        s.on('data', d => out += d.toString());
        s.on('close', () => { console.log(out); c.end(); });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
