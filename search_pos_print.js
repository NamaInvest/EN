const fs = require('fs');
const { Client } = require('ssh2');

(async () => {
    function sshCmd(cmd) {
      return new Promise(r => {
        const c = new Client(); let out = '';
        c.on('ready', () => c.exec(cmd, (e, s) => {
          s.on('data', d => out+=d); s.stderr.on('data', d => out+=d);
          s.on('close', () => { c.end(); r(out); });
        })).connect({ host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b' });
      });
    }

    console.log("=== POS Page Printer Logic ===");
    console.log(await sshCmd(`cd /www/wwwroot/n11.namainvist.com/src && grep -rnw app/\\(dashboard\\)/pos/page.tsx -e "print" -A 5 -B 5 | head -30`));

    console.log("\n=== Restaurant POS Page Printer Logic ===");
    console.log(await sshCmd(`cd /www/wwwroot/n11.namainvist.com/src && grep -rnw app/\\(dashboard\\)/restaurant-pos/page.tsx -e "print" -A 5 -B 5 | head -30`));
    
    console.log("\n=== Sales Page Printer Logic ===");
    console.log(await sshCmd(`cd /www/wwwroot/n11.namainvist.com/src && grep -rnw app/\\(dashboard\\)/sales/page.tsx -e "Print" -A 5 -B 5 | head -30`));
    
    console.log("\n=== Components ===");
    console.log(await sshCmd(`cd /www/wwwroot/n11.namainvist.com/src && ls -1 components | grep -i print`));
    console.log(await sshCmd(`cd /www/wwwroot/n11.namainvist.com/src && ls -1 components | grep -i invoice`));
})();
