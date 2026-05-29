const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = '46.4.188.170';

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { c.end(); return r(false); }
        const ws = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
        ws.on('close', () => { c.end(); r(true); });
        ws.on('error', (e) => { console.error('  SFTP error:', e.message); c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', e => { console.error('SSH err:', e.message); r(false); })
      .connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => { out += d; process.stdout.write('[ERR] ' + d.toString()); });
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).on('error', e => { console.error('SSH err:', e.message); r(''); })
      .connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

const L = (m) => console.log(m);
const ok = (m) => console.log('  ✅', m);
const err = (m) => console.log('  ❌', m);

const BASE = '/www/wwwroot/namainvist.com';

(async () => {
  L('\n═══════════════════════════════════════════════════');
  L('  PHASE 1: Upload new files to server');
  L('═══════════════════════════════════════════════════\n');

  const files = [
    { local: 'src/middleware.ts',          remote: `${BASE}/src/middleware.ts` },
    { local: 'src/app/layout.tsx',         remote: `${BASE}/src/app/layout.tsx` },
    { local: 'src/app/_landing.tsx',       remote: `${BASE}/src/app/_landing.tsx` },
    { local: 'src/app/_module-filter.tsx', remote: `${BASE}/src/app/_module-filter.tsx` },
    { local: 'src/components/GlobalAuthGuard.tsx', remote: `${BASE}/src/components/GlobalAuthGuard.tsx` },
  ];

  for (const f of files) {
    const content = fs.readFileSync(f.local, 'utf8');
    const uploaded = await writeFile(f.remote, content);
    uploaded ? ok(f.local.split('/').pop()) : err(f.local.split('/').pop() + ' FAILED');
  }

  L('\n═══════════════════════════════════════════════════');
  L('  PHASE 2: Clean build (remove .next cache)');
  L('═══════════════════════════════════════════════════\n');

  await ssh(`
    cd ${BASE}
    echo "→ Removing .next cache..."
    rm -rf .next
    echo "→ Building..."
    npm run build 2>&1 | tail -15
  `);

  L('\n═══════════════════════════════════════════════════');
  L('  PHASE 3: Restart + Verify');
  L('═══════════════════════════════════════════════════\n');

  await ssh(`
    cd ${BASE}
    pm2 restart main-site 2>&1 | tail -2
    sleep 3
    echo ""
    echo "=== Port check ==="
    nc -z 127.0.0.1 2999 && echo "✅ Port 2999 OK" || echo "❌ Port 2999 DEAD"
    echo ""
    echo "=== SSR body check ==="
    curl -s http://localhost:2999/ 2>/dev/null | python3 -c "
import sys
html = sys.stdin.read()
print('HTTP body length:', len(html))
body = html[html.find('<body'):html.find('</body>')]
print('Has dark bg (0f172a):', '0f172a' in html)
print('Has 104 (modules):', '104' in html)
print('Has hidden div (clerk issue):', '<div hidden=' in html)
print('Body content (first 400 chars):', repr(body[:400]))
" 2>/dev/null
  `);

  L('\n✅ Deploy complete!\n');
  L('NEXT: Open https://namainvist.com in a new incognito window to verify');
})();
