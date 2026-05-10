// remove-basic-auth.cjs — إزالة Basic Auth من staging
'use strict';
const { Client } = require('ssh2');
const conn = new Client();

function exec(conn, cmd, to = 15000) {
  return new Promise(r => {
    const t = setTimeout(() => r('TIMEOUT'), to);
    conn.exec(cmd, (e, s) => {
      if (e) { clearTimeout(t); r('ERR:' + e.message); return; }
      let o = '';
      s.on('data', d => o += d);
      s.stderr.on('data', d => o += d);
      s.on('close', () => { clearTimeout(t); r(o.trim()); });
    });
  });
}

function getSftp(conn) { return new Promise((r, j) => conn.sftp((e, s) => e ? j(e) : r(s))); }
function write(sftp, p, c) {
  return new Promise((res, rej) => {
    const s = sftp.createWriteStream(p);
    s.on('error', rej);
    s.on('close', res);
    s.end(Buffer.from(c, 'utf8'));
  });
}

const conf = `server {
    listen 80;
    server_name staging.namainvist.com;
    location / {
        proxy_pass http://127.0.0.1:3600;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

conn.on('ready', async () => {
  const sftp = await getSftp(conn);
  await write(sftp, '/www/server/panel/vhost/nginx/staging.namainvist.com.conf', conf);

  const test = await exec(conn, 'nginx -t 2>&1');
  if (test.includes('successful')) {
    await exec(conn, 'nginx -s reload');
    console.log('✅ Basic Auth removed — staging.namainvist.com open');
  } else {
    console.log('⚠️', test);
  }

  const code = await exec(conn, 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3600/');
  console.log('Staging health:', code.trim() === '200' ? '✅ 200' : '⚠️ ' + code.trim());
  conn.end();
});

conn.on('error', e => console.error(e.message));
conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
