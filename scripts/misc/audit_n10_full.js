const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { c.end(); r(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

const N10 = '/www/wwwroot/n10.namainvist.com';

(async () => {
  console.log('\n========== [1] PM2 N10 STATUS ==========');
  console.log(await ssh(`pm2 describe n10 2>&1`));

  console.log('\n========== [2] DIRECTORY LISTING ==========');
  console.log(await ssh(`ls -la ${N10}/ 2>&1`));

  console.log('\n========== [3] .next BUILD EXISTS? ==========');
  console.log(await ssh(`ls ${N10}/.next/ 2>&1 | head -10`));

  console.log('\n========== [4] BUILD-ID FILE (confirms successful build) ==========');
  console.log(await ssh(`cat ${N10}/.next/BUILD_ID 2>&1`));

  console.log('\n========== [5] .env FILE ==========');
  console.log(await ssh(`cat ${N10}/.env 2>&1`));

  console.log('\n========== [6] next.config.ts ==========');
  console.log(await ssh(`cat ${N10}/next.config.ts 2>&1`));

  console.log('\n========== [7] PRISMA SCHEMA ==========');
  console.log(await ssh(`cat ${N10}/prisma/schema.prisma 2>&1 | head -80`));

  console.log('\n========== [8] PM2 ERROR LOG (last 80 lines) ==========');
  console.log(await ssh(`tail -80 /root/.pm2/logs/n10-error.log 2>&1`));

  console.log('\n========== [9] PM2 OUT LOG (last 30 lines) ==========');
  console.log(await ssh(`tail -30 /root/.pm2/logs/n10-out.log 2>&1`));

  console.log('\n========== [10] PORT 3010 CHECK ==========');
  console.log(await ssh(`netstat -tlpn 2>&1 | grep 3010`));

  console.log('\n========== [11] CURL TEST N10 LOCAL ==========');
  console.log(await ssh(`curl -s -o /dev/null -w "%{http_code}" http://localhost:3010/ 2>&1`));

  console.log('\n========== [12] NGINX CONFIG FOR N10 ==========');
  console.log(await ssh(`cat /www/server/panel/vhost/nginx/n10.namainvist.com.conf 2>&1`));

  console.log('\n========== [13] NGINX PROXY CONFIG N10 ==========');
  console.log(await ssh(`cat /www/server/panel/vhost/nginx/proxy/n10.namainvist.com/*.conf 2>&1`));

  console.log('\n========== [14] PAGES LIST ==========');
  console.log(await ssh(`find ${N10}/src/app -name "page.tsx" 2>&1 | head -50`));

  console.log('\n========== [15] API ROUTES LIST ==========');
  console.log(await ssh(`find ${N10}/src/app/api -name "route.ts" 2>&1 | head -50`));

  console.log('\n========== [16] DISK SPACE ==========');
  console.log(await ssh(`df -h / && du -sh ${N10}/ 2>&1`));

  console.log('\n========== [17] NODE/NPM VERSION ==========');
  console.log(await ssh(`node -v && npm -v 2>&1`));

  console.log('\n========== [18] MIDDLEWARE CHECK ==========');
  console.log(await ssh(`cat ${N10}/src/middleware.ts 2>&1`));

  console.log('\n========== [19] PACKAGE.JSON ==========');
  console.log(await ssh(`cat ${N10}/package.json 2>&1`));

  console.log('\n========== [20] LAST BUILD LOG (nohup/build) ==========');
  console.log(await ssh(`ls ${N10}/*.log 2>&1 | head -5 && tail -30 ${N10}/build.log 2>&1 || echo "no build log"`));

  console.log('\n========== AUDIT N10 COMPLETE ==========');
})();
