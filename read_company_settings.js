const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client(); let out = '';
    c.on('ready', () => c.exec(cmd, (e, s) => {
      if (e) { r('[ERR]'); return; }
      s.on('data', d => out += d); s.stderr.on('data', d => out += d);
      s.on('close', () => { c.end(); r(out.trim()); });
    })).connect({ host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b' });
  });
}

(async () => {
    console.log("=== settings/page.tsx around line 56 ===");
    console.log(await ssh(`cat /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/settings/page.tsx | grep -B 5 -A 20 "sys.str_4434"`));
    
    console.log("\n=== company-info/page.tsx imports and structure ===");
    console.log(await ssh(`cat /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/company-info/page.tsx | head -50`));
})();
