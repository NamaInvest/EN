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
const N11 = '/www/wwwroot/n11.namainvist.com';
(async () => {
  // restart
  console.log('=== Restarting N11 ===');
  console.log(await ssh('pm2 restart n11 && sleep 6 && pm2 list | grep n11'));
  
  await new Promise(r => setTimeout(r, 8000));
  
  // health
  console.log('\n=== Health Check ===');
  for (const p of ['/api/notifications','/api/attendances','/api/zatca/config','/api/sys/health','/api/accounting/accounts','/dashboard','/pos']) {
    console.log(await ssh(`curl -sk -o /dev/null -w "${p} → %{http_code}" https://n11.namainvist.com${p}`));
  }
  
  // remaining TS errors
  console.log('\n=== Remaining TypeScript Errors ===');
  const count = await ssh(`cd ${N11} && npx tsc --noEmit 2>&1 | grep -c "error TS" 2>/dev/null || echo "0"`, 120000);
  console.log(`Total remaining errors: ${count}`);
  
  // error files breakdown
  console.log('\n=== Error breakdown ===');
  console.log(await ssh(`cd ${N11} && npx tsc --noEmit 2>&1 | grep "error TS" | sed 's|${N11}/||g' | grep -oP "^[^:]+\\.tsx?" | sort | uniq -c | sort -rn | head -20`, 120000));
  
  // PM2 status
  console.log('\n=== PM2 Status ===');
  console.log(await ssh(`pm2 describe n11 2>&1 | grep -E "status|restart|uptime|mem"`));
})();
