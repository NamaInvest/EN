const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  c.exec('grep -c "104" /www/wwwroot/namainvist.com/.next/server/app/index.html 2>/dev/null', (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => { 
      console.log('Lines with 104:', out.trim());
      // Also check what's inside the JS bundle for page
      c.exec('cat /www/wwwroot/namainvist.com/.next/server/chunks/ssr/src_app_page_tsx_*.js 2>/dev/null | grep -o "104 .\\{1,20\\}" | head -5', (e, s) => {
        let o = '';
        s.on('data', d => o += d);
        s.on('close', () => { console.log('JS bundle "104" samples:', o.trim()); c.end(); });
      });
    });
  });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
