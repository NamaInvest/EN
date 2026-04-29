const { Client } = require('ssh2');

function ssh(cmd, timeout = 30000) {
  return new Promise(r => {
    const c = new Client();
    let out = '';
    const timer = setTimeout(() => { c.end(); r(out + '[TIMEOUT]'); }, timeout);
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); r('[ERROR]'); return; }
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { clearTimeout(timer); c.end(); r(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';

(async () => {
  // 1. فحص ما يراه PM2 كـ cwd
  console.log('=== PM2 n11 CWD and script path ===');
  console.log(await ssh(`pm2 describe n11 2>&1 | grep -E "cwd|script|exec interpreter|pm2 home|root directory"`));

  // 2. فحص محتوى .next بالضبط
  console.log('\n=== .next directory contents ===');
  console.log(await ssh(`ls ${N11}/.next/ 2>&1`));

  console.log('\n=== BUILD_ID ===');
  console.log(await ssh(`cat ${N11}/.next/BUILD_ID 2>&1`));

  // 3. فحص ecosystem أو PM2 config
  console.log('\n=== PM2 ecosystem file ===');
  console.log(await ssh(`cat ${N11}/ecosystem.config.js 2>&1 || cat ${N11}/ecosystem.config.cjs 2>&1 || echo "no ecosystem file"`));

  // 4. إنشاء Nginx proxy config لـ N11
  console.log('\n=== Creating Nginx proxy config for N11 ===');
  
  const nginxProxyDir = '/www/server/panel/vhost/nginx/proxy/n11.namainvist.com';
  await ssh(`mkdir -p ${nginxProxyDir} 2>&1`);
  
  const nginxProxyConf = `location / {
    proxy_pass http://localhost:3011;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 90;
}`;

  await ssh(`cat > ${nginxProxyDir}/proxy.conf << 'NGINX_EOF'\n${nginxProxyConf}\nNGINX_EOF`);
  console.log('✅ Nginx proxy config created');

  // 5. اختبار Nginx config
  console.log('\n=== Testing nginx config ===');
  console.log(await ssh(`nginx -t 2>&1`));

  // 6. إعادة تشغيل Nginx
  console.log('\n=== Reloading Nginx ===');
  console.log(await ssh(`nginx -s reload 2>&1`));

  // 7. إعادة تشغيل N11 من مجلده الصحيح
  console.log('\n=== Stopping N11 and restarting correctly ===');
  await ssh(`pm2 stop n11 2>&1`);
  await new Promise(r => setTimeout(r, 2000));
  
  // تأكد من تشغيله من المجلد الصحيح
  console.log(await ssh(`cd ${N11} && pm2 start npm --name n11 --cwd ${N11} -- start -- --port 3011 2>&1 || pm2 restart n11 2>&1`));
  
  await new Promise(r => setTimeout(r, 8000));

  // 8. اختبار نهائي
  console.log('\n=== Final HTTP Test ===');
  console.log(await ssh(`curl -s -o /dev/null -w "%{http_code}" http://localhost:3011/ 2>&1`));
  
  console.log('\n=== Final curl with headers ===');
  console.log(await ssh(`curl -sI http://n11.namainvist.com/ 2>&1 | head -5`));
  
  console.log('\n=== PM2 n11 status ===');
  console.log(await ssh(`pm2 list 2>&1 | grep n11`));

  console.log('\n=== Last error log ===');
  console.log(await ssh(`tail -5 /root/.pm2/logs/n11-error.log 2>&1`));
})();
