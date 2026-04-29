const { Client } = require('ssh2');
const path = require('path');

const files = [
  ['src/app/api/manufacturing/recipes/[id]/route.ts', 'src/app/api/manufacturing/recipes/[id]/route.ts'],
  ['src/app/api/manufacturing/orders/[id]/route.ts', 'src/app/api/manufacturing/orders/[id]/route.ts'],
  ['src/app/api/fixed-assets/[id]/route.ts', 'src/app/api/fixed-assets/[id]/route.ts'],
  ['src/app/api/fixed-assets/[id]/depreciate/route.ts', 'src/app/api/fixed-assets/[id]/depreciate/route.ts'],
];

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    let done = 0;
    for (const [local, remote] of files) {
      const lp = path.resolve('c:/Users/1/Desktop/alfa', local);
      const rp = '/var/www/namasoft/' + remote;
      sftp.fastPut(lp, rp, (e) => {
        done++;
        if (e) console.error('FAIL', local, e.message);
        else console.log('OK', local);
        if (done === files.length) {
          console.log('\nAll [id] files uploaded!');
          // Also rm the old status and trigger fresh build
          conn.exec('rm -f /tmp/rebuild_modules_status.txt && cd /var/www/namasoft && nohup bash -c "npm run build > /tmp/rebuild_modules.log 2>&1 && pm2 restart namasoft && echo DONE > /tmp/rebuild_modules_status.txt" > /dev/null 2>&1 &', (e2, s2) => {
            if (e2) throw e2;
            s2.on('close', () => { console.log('Build kicked off!'); conn.end(); });
          });
        }
      });
    }
  });
}).connect({
  host: '185.197.195.202', port: 22, username: 'root', password: 'VmJUML2LuezRSws', keepaliveInterval: 10000
});
