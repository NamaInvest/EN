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
    console.log("Searching for sys.str_4434 usage...");
    const cmd = `cd /www/wwwroot/n11.namainvist.com/src && grep -rnw . -e "str_4434"`;
    console.log(await ssh(cmd));
    
    console.log("\nSearching for company info page path...");
    const cmd2 = `cd /www/wwwroot/n11.namainvist.com/src && find . -name "page.tsx" | grep company`;
    console.log(await ssh(cmd2));
})();
