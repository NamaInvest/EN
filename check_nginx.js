const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('cat /www/server/panel/vhost/nginx/proxy/namainvist.com/*.conf /www/server/panel/vhost/nginx/extension/namainvist.com/*.conf 2>&1', (e, s) => {
        if (e) { console.error(e); c.end(); return; }
        let o = '';
        s.on('data', d => o += d);
        s.stderr.on('data', d => o += d);
        s.on('close', () => { console.log(o); c.end(); });
    });
});
c.on('error', e => console.error(e));
c.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
