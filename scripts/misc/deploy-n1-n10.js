const { Client } = require('ssh2');
const path = require('path');

const NODES = [
  {dir:'n1.namainvist.com', pm2:'n1-main'},
  {dir:'n2.namainvist.com', pm2:'n2'},
  {dir:'n3.namainvist.com', pm2:'n3'},
  {dir:'n4.namainvist.com', pm2:'n4'},
  {dir:'n5.namainvist.com', pm2:'n5'},
  {dir:'n6.namainvist.com', pm2:'n6'},
  {dir:'n7.namainvist.com', pm2:'n7'},
  {dir:'n8.namainvist.com', pm2:'n8'},
  {dir:'n9.namainvist.com', pm2:'n9'},
  {dir:'n10.namainvist.com', pm2:'n10'},
];

const FILES = [
  'src/app/(dashboard)/settings/page.tsx',
  'src/lib/usePagePermission.ts',
  'prisma/schema.prisma',
];

// SQL لإضافة عمود default_page
const SQL = "ALTER TABLE users ADD COLUMN IF NOT EXISTS default_page VARCHAR;";

async function deployNode(node) {
  return new Promise(resolve => {
    const c = new Client();
    c.on('ready', () => {
      // 1) Migration: add default_page column
      const migCmd = `cd /www/wwwroot/${node.dir} && source .env 2>/dev/null; export $(cat .env | sed 's/#.*//g' | xargs) 2>/dev/null; psql "$DATABASE_URL" -c "${SQL}" 2>&1 | tail -1`;
      c.exec(migCmd, (err, stream) => {
        let out = '';
        if (err) { console.error(node.pm2, 'exec err:', err.message); }
        else {
          stream.on('data', d => out += d);
          stream.stderr.on('data', d => out += d);
          stream.on('close', () => {
            process.stdout.write('[' + node.pm2 + '] SQL: ' + out.trim() + '\n');
          });
        }

        // 2) SFTP Files
        setTimeout(() => {
          c.sftp((e2, sftp) => {
            if (e2) { console.error(node.pm2, 'sftp err'); c.end(); resolve(); return; }
            let i = 0;
            const next = () => {
              if (i >= FILES.length) {
                // 3) Build + Restart
                const buildCmd = `cd /www/wwwroot/${node.dir} && npm run build 2>&1 | tail -3 && pm2 restart ${node.pm2} && echo DONE`;
                c.exec(buildCmd, (e3, s3) => {
                  if (e3) { c.end(); resolve(); return; }
                  s3.on('data', d => process.stdout.write('[' + node.pm2 + '] ' + d));
                  s3.stderr.on('data', () => {});
                  s3.on('close', () => { sftp.end(); c.end(); resolve(); });
                });
                return;
              }
              const f = FILES[i++];
              const localPath = path.join(__dirname, f);
              const remotePath = `/www/wwwroot/${node.dir}/${f}`;
              sftp.fastPut(localPath, remotePath, err3 => {
                if (err3) process.stdout.write('[' + node.pm2 + '] ERR SFTP: ' + f + '\n');
                else process.stdout.write('[' + node.pm2 + '] ✓ ' + path.basename(f) + '\n');
                next();
              });
            };
            next();
          });
        }, 1500);
      });
    }).on('error', e => {
      console.error('[' + node.pm2 + '] Connect Error:', e.message);
      resolve();
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

(async () => {
  for (const node of NODES) {
    console.log('\n=== ' + node.pm2 + ' ===');
    await deployNode(node);
  }
  console.log('\n✅ ALL DONE N1-N10');
})();
