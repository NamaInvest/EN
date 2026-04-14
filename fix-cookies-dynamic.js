const { Client } = require('ssh2');
const fs = require('fs');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { c.end(); return r(false); }
        const ws = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
        ws.on('close', () => { console.log('[✓]', remotePath.split('/').pop()); c.end(); r(true); });
        ws.on('error', e => { console.error('[✗]', e.message); c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', e => { console.error(e.message); r(false); })
      .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

// The definitive fix: use cookies() which FORCES Next.js into dynamic mode 100%
// When a server page reads cookies(), Next.js cannot pre-render it statically
// This means Cloudflare gets "no-store" header and won't cache it
const serverPageContent = `import { cookies } from 'next/headers';
import LandingPage from './_landing';

// Reading cookies forces Next.js to render this page dynamically (server-side)
// Result: no s-maxage header → Cloudflare cannot cache this page
export default async function Page() {
  cookies(); // Forces dynamic rendering
  return <LandingPage />;
}
`;

(async () => {
  // Write the new server page
  console.log('=== Writing page.tsx with cookies() ===');
  await writeFile('/www/wwwroot/namainvist.com/src/app/page.tsx', serverPageContent);
  
  const check = await ssh('cat /www/wwwroot/namainvist.com/src/app/page.tsx');
  console.log(check);
  
  // Rebuild
  console.log('\n=== Rebuilding ===');
  await ssh('cd /www/wwwroot/namainvist.com && rm -rf .next && npm run build 2>&1 | grep -E "Route|○|ƒ|error" | head -20');
  
  // Check if / is now ƒ (dynamic)
  const routes = await ssh('cd /www/wwwroot/namainvist.com && npm run build 2>&1 | grep "^[[:space:]]*[○ƒ]" | head -5 || cat /www/wwwroot/namainvist.com/.next/server/app/index.html 2>/dev/null | wc -c');
  console.log('\nRoutes output:', routes);
  
  await ssh('pm2 restart main-site 2>&1 | tail -2');
  await new Promise(r => setTimeout(r, 2000));
  
  // Check headers
  console.log('\n=== Headers check ===');
  const headers = await ssh('curl -sI https://namainvist.com/ 2>/dev/null | grep -iE "cache-control|x-nextjs-prerender|cf-cache"');
  console.log(headers);
  const noMaxAge = !headers.includes('s-maxage');
  console.log(noMaxAge ? '✅ s-maxage GONE - Cloudflare will not cache!' : '❌ s-maxage still present');
})();
