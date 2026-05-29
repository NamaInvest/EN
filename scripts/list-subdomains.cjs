// list-subdomains.cjs — جمع كل السب دومين من الخادم
'use strict';
const { Client } = require('ssh2');
const conn = new Client();

function exec(conn, cmd, timeout = 15000) {
  return new Promise(resolve => {
    const t = setTimeout(() => resolve('TIMEOUT'), timeout);
    conn.exec(cmd, (err, s) => {
      if (err) { clearTimeout(t); resolve('ERR:' + err.message); return; }
      let o = '';
      s.on('data', d => o += d);
      s.stderr.on('data', d => o += d);
      s.on('close', () => { clearTimeout(t); resolve(o.trim()); });
    });
  });
}

conn.on('ready', async () => {
  // Nginx vhosts
  console.log('=== Nginx conf files ===');
  console.log(await exec(conn, 'ls /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ /www/server/panel/vhost/nginx/ 2>/dev/null'));

  console.log('\n=== server_name entries ===');
  console.log(await exec(conn, 'grep -r "server_name" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ /www/server/panel/vhost/nginx/ 2>/dev/null | grep -v "#"'));

  console.log('\n=== PM2 processes (ports) ===');
  console.log(await exec(conn, 'pm2 list'));

  console.log('\n=== ecosystem.config.js ===');
  console.log(await exec(conn, 'cat /www/wwwroot/namainvist.com/ecosystem.config.js'));

  console.log('\n=== .env NEXT_PUBLIC_API_URL ===');
  console.log(await exec(conn, 'grep -i "URL\\|DOMAIN\\|API" /www/wwwroot/namainvist.com/.env | grep -v "KEY\\|SECRET\\|TOKEN\\|PASS" | head -15'));

  conn.end();
});

conn.on('error', e => console.error('Error:', e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 10000 });
