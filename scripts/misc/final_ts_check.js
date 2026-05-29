const { Client } = require('ssh2');

function ssh(cmd, timeout = 120000) {
  return new Promise(r => {
    const c = new Client(); let out = '';
    const t = setTimeout(() => { c.end(); r(out + '[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (e, s) => {
      if (e) { clearTimeout(t); r('[ERR]'); return; }
      s.on('data', d => out += d); s.stderr.on('data', d => out += d);
      s.on('close', () => { clearTimeout(t); c.end(); r(out.trim()); });
    })).connect({ host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD' });
  });
}

(async () => {
    const N11 = '/www/wwwroot/n11.namainvist.com';
    
    // Get total remaining errors
    console.log(await ssh(`cd ${N11} && npx tsc --noEmit 2>&1 | grep "error TS" | sed 's|${N11}/||g'`));
})();
