const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmds = [
    "pm2 info saas-app 2>&1 | grep 'exec cwd\\|script\\|root path' | head -5",
    "pm2 info main-site 2>&1 | grep 'exec cwd\\|script\\|root path' | head -5",
    "ls /www/wwwroot/n1.namainvist.com/ 2>/dev/null | head -3",
    "ls /www/wwwroot/namainvist.com/ 2>/dev/null | head -3",
  ];

  let i = 0;
  function next() {
    if (i >= cmds.length) return conn.end();
    const cmd = cmds[i++];
    conn.exec(cmd, (err, stream) => {
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => {
        console.log(`CMD: ${cmd}\nOUT: ${out.trim()}\n---`);
        next();
      });
    });
  }
  next();
}).on('error', e => console.error(e.message))
  .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
