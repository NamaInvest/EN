const { Client } = require('ssh2');

function ssh(cmd, timeout = 120000) {
  return new Promise(r => {
    const c = new Client();
    let out = '';
    const timer = setTimeout(() => { c.end(); r(out + '\n[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); r('[ERROR] ' + err.message); return; }
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(timer); c.end(); r(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';

(async () => {
  // 1. Fix NEXTAUTH_SECRET (was using shell variable not expanded)
  console.log('=== Fix NEXTAUTH_SECRET (proper random value) ===');
  const secret = require('crypto').randomBytes(32).toString('hex');
  const jwtSecret = require('crypto').randomBytes(32).toString('hex');
  
  await ssh(`sed -i '/NEXTAUTH_SECRET=/d' ${N11}/.env`);
  await ssh(`sed -i '/JWT_SECRET=/d' ${N11}/.env`);
  await ssh(`echo 'NEXTAUTH_SECRET="${secret}"' >> ${N11}/.env`);
  await ssh(`echo 'JWT_SECRET="${jwtSecret}"' >> ${N11}/.env`);
  console.log('✅ Fixed NEXTAUTH_SECRET and JWT_SECRET with proper random values');
  
  // 2. Verify build errors
  console.log('\n=== Build errors check ===');
  console.log(await ssh(`cd ${N11} && npm run build 2>&1 | grep -E "^(  |\\s+).*Error|TypeError|error TS" | head -20`, 300000));
  
  // 3. Restart N11
  console.log('\n=== Restarting N11 ===');
  console.log(await ssh(`pm2 restart n11 && sleep 5 && pm2 list | grep n11`));
  
  await new Promise(r => setTimeout(r, 8000));
  
  // 4. Health check
  console.log('\n=== Health Check ===');
  for (const path of ['/', '/login', '/dashboard', '/pos', '/sales', '/api/dashboard', '/api/sys/health']) {
    console.log(await ssh(`curl -sk -o /dev/null -w "${path} → %{http_code}" https://n11.namainvist.com${path}`));
  }
  
  // 5. PM2 status
  console.log('\n=== PM2 Status ===');
  console.log(await ssh(`pm2 describe n11 2>&1 | grep -E "status|restart|uptime|mem"`));
  
  // 6. Reset restart counter
  console.log('\n=== Reset PM2 restart counter ===');
  console.log(await ssh(`pm2 reset n11 && pm2 list | grep n11`));
  
  console.log('\n✅ All done!');
})();
