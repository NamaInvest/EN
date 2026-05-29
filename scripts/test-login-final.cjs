// test-login-final.cjs
'use strict';
const { Client } = require('ssh2');
const conn = new Client();
function exec(conn, cmd, to=20000) { return new Promise(r => { const t=setTimeout(()=>r('TIMEOUT'),to); conn.exec(cmd,(e,s)=>{ if(e){clearTimeout(t);r('ERR:');return;} let o=''; s.on('data',d=>o+=d); s.stderr.on('data',d=>o+=d); s.on('close',()=>{clearTimeout(t);r(o.trim());}); }); }); }

conn.on('ready', async () => {
  // restart
  console.log('Restarting all...');
  await exec(conn, 'cd /www/wwwroot/namainvist.com && pm2 restart all --update-env && sleep 10', 25000);

  // test logins
  const tests = [
    [3500, 'n11',     'admin', 'O_O772040030'],
    [3600, 'staging', 'admin', 'O_O772040030'],
  ];

  console.log('\n🔍 Login tests:');
  for (const [port, site, user, pass] of tests) {
    const r = await exec(conn,
      `curl -s -X POST http://localhost:${port}/api/auth/login \
        -H 'Content-Type: application/json' \
        -H 'Host: ${site}.namainvist.com' \
        -d '{"username":"${user}","password":"${pass}"}' | head -c 200`,
      12000
    );
    const ok = r.includes('token') || r.includes('"user"');
    console.log(`  ${ok ? '✅' : '❌'} ${site}: ${r.substring(0,120)}`);
  }

  conn.end();
});
conn.on('error', e=>console.error(e.message));
conn.connect({ host:'46.4.188.170', port:22, username:'root', password:'process.env.SSH_PASSWORD', readyTimeout:10000 });
