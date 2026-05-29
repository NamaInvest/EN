const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => c.exec(cmd, (err, stream) => {
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { c.end(); r(out.trim()); });
    })).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

const N11 = '/www/wwwroot/n11.namainvist.com';

(async () => {
  console.log('\n========== [1] PM2 STATUS ==========');
  console.log(await ssh(`pm2 describe n11 2>&1 | tail -30`));

  console.log('\n========== [2] DIRECTORY LISTING ==========');
  console.log(await ssh(`ls ${N11}/`));

  console.log('\n========== [3] .next BUILD EXISTS? ==========');
  console.log(await ssh(`ls ${N11}/.next/ 2>&1 | head -10`));

  console.log('\n========== [4] .env FILE ==========');
  console.log(await ssh(`cat ${N11}/.env 2>&1`));

  console.log('\n========== [5] package.json ==========');
  console.log(await ssh(`cat ${N11}/package.json 2>&1`));

  console.log('\n========== [6] next.config.ts ==========');
  console.log(await ssh(`cat ${N11}/next.config.ts 2>&1`));

  console.log('\n========== [7] LAST BUILD ERRORS (pm2 error log) ==========');
  console.log(await ssh(`tail -60 /root/.pm2/logs/n11-error.log 2>&1`));

  console.log('\n========== [8] DISK SPACE CHECK ==========');
  console.log(await ssh(`df -h / 2>&1`));

  console.log('\n========== [9] NODE/NPM VERSION ==========');
  console.log(await ssh(`node -v && npm -v`));

  console.log('\n========== [10] PRISMA SCHEMA HEAD ==========');
  console.log(await ssh(`head -30 ${N11}/prisma/schema.prisma 2>&1`));

  console.log('\n========== [11] SRC/APP PAGES LIST ==========');
  console.log(await ssh(`find ${N11}/src/app -name "page.tsx" 2>&1 | head -40`));

  console.log('\n========== [12] NGINX CONFIG FOR N11 ==========');
  console.log(await ssh(`cat /www/server/panel/vhost/nginx/n11.namainvist.com.conf 2>&1`));

  console.log('\n========== [13] PORT 3011 CHECK ==========');
  console.log(await ssh(`netstat -tlpn 2>&1 | grep 3011`));

  console.log('\n========== [14] CURL TEST N11 LOCAL ==========');
  console.log(await ssh(`curl -s -o /dev/null -w "%{http_code}" http://localhost:3011/ 2>&1`));

  console.log('\n========== AUDIT COMPLETE ==========');
})();
