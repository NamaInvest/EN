const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client(); let out = '';
    const t = setTimeout(() => { c.end(); r(out + '[TIMEOUT]'); }, 120000);
    c.on('ready', () => c.exec(cmd, (e, s) => {
      if (e) { clearTimeout(t); r('[ERR]'); return; }
      s.on('data', d => out += d); s.stderr.on('data', d => out += d);
      s.on('close', () => { clearTimeout(t); c.end(); r(out.trim()); });
    })).connect({ host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b' });
  });
}

(async () => {
    console.log(await ssh(`cat /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/settings/page.tsx | grep -B 5 -A 20 "fatooraStep"`));
})();
