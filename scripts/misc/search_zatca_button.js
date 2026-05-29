const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client(); let out = '';
    c.on('ready', () => c.exec(cmd, (e, s) => {
      if (e) { r('[ERR]'); return; }
      s.on('data', d => out += d); s.stderr.on('data', d => out += d);
      s.on('close', () => { c.end(); r(out.trim()); });
    })).connect({ host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD' });
  });
}

(async () => {
    console.log("Searching for zatca files...");
    console.log(await ssh(`cd /www/wwwroot/n11.namainvist.com/src && find app -name "*zatca*" `));
    
    console.log("\nSearching for onboard keyword in tsx files...");
    console.log(await ssh(`cd /www/wwwroot/n11.namainvist.com/src && grep -rnw . -e "onboard" | grep -v "node_modules" | head -10`));
    
    console.log("\nSearching for connect or rb6 (ربط) in company-info or settings...");
    console.log(await ssh(`cd /www/wwwroot/n11.namainvist.com/src && grep -rnw app/\\(dashboard\\) -e "Zatca" -e "API" | head -20 `));
})();
