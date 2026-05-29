const { Client } = require('ssh2');

function ssh(cmd, timeout = 300000) {
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

const N11 = '/www/wwwroot/n11.namainvist.com';

(async () => {
    console.log("Fixing login/page.tsx...");
    
    // Read the file
    let content = await ssh(`cat ${N11}/src/app/login/page.tsx`);
    
    // Fix: Remove the improper first line if it's there
    let lines = content.split('\n');
    if (lines[0].includes("'use client';") || lines[0] === "'use client'") {
        // It's probably correct, but maybe there's a problem, let's make it standard
        lines = lines.filter(l => !l.includes("'use client';") && !l.includes("import { signIn }"));
    }
    
    // Let's just make sure 'use client' is the absolute first line
    lines.unshift("'use client';");
    lines.unshift("// cleaned top");
    
    const newContentStr = lines.join('\n');
    
    const b64 = Buffer.from(newContentStr, 'utf8').toString('base64');
    await ssh(`echo '${b64}' | base64 -d > '${N11}/src/app/login/page.tsx'`);
    
    console.log("File fixed. Rebuilding...");
    const buildResult = await ssh(`cd ${N11} && npm run build 2>&1 | tail -25`);
    console.log(buildResult);
    
    console.log("Restarting N11...");
    await ssh(`pm2 restart n11`);
    
    console.log("Done!");
})();
