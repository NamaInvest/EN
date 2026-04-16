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
    console.log("Searching for ZATCA environment...");
    const cmd = `cd /www/wwwroot/n11.namainvist.com/src && grep -rnw . -e "ZATCA Environment" -e "Environment" | grep -v "node_modules" | head -20`;
    console.log(await ssh(cmd));
    
    console.log("\nSearching for Company Data...");
    const cmd2 = `cd /www/wwwroot/n11.namainvist.com/src && grep -rnw . -e "company" | grep "page.tsx" | head -10`;
    console.log(await ssh(cmd2));
})();
