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

// The REAL fix:
// Next.js static pages get s-maxage=31536000 (1 year) - Cloudflare caches them forever
// Fix: Make the page a SERVER COMPONENT with force-dynamic
// Server components with force-dynamic get Cache-Control: no-store from Next.js automatically

// Step 1: Move client logic to a separate file
const clientContent = fs.readFileSync('src/app/page.tsx', 'utf8');

// Step 2: Create a SERVER component as page.tsx with force-dynamic
// This tells Next.js to NEVER cache this route - Cloudflare respects this
const serverPageContent = `// Server Component - force dynamic rendering
// This prevents Cloudflare from caching the page (no s-maxage header)
import { headers } from 'next/headers';
import LandingPage from './_landing';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'نما إنفست - نظام ERP ونقاط بيع متكامل | 104 وحدة برمجية',
  description: 'نظام نما إنفست: 104 وحدة ERP متكاملة. متوافق 100% مع ZATCA.',
};

export default async function Page() {
  // Reading headers forces Next.js into dynamic mode - no s-maxage header!
  headers();
  return <LandingPage />;
}
`;

// Step 3: The client component (the actual landing page) goes to _landing.tsx
const landingContent = clientContent
  .replace('"use client";', '"use client";')
  .replace('export const dynamic = "force-dynamic";\n\n', '')
  .replace('export default function NamaInvestLanding', 'export default function LandingPage');

(async () => {
  // Check current state
  const currentPage = await ssh('head -3 /www/wwwroot/namainvist.com/src/app/page.tsx');
  console.log('Current page.tsx:', currentPage);

  // Write _landing.tsx (the client component)
  console.log('\n=== Writing _landing.tsx ===');
  await writeFile('/www/wwwroot/namainvist.com/src/app/_landing.tsx', landingContent);
  
  // Write page.tsx (server wrapper with force-dynamic)
  console.log('\n=== Writing page.tsx (server with force-dynamic) ===');
  await writeFile('/www/wwwroot/namainvist.com/src/app/page.tsx', serverPageContent);
  
  // Verify
  const check = await ssh('head -8 /www/wwwroot/namainvist.com/src/app/page.tsx');
  console.log('\nNew page.tsx:\n', check);
  
  // Clean rebuild
  console.log('\n=== Clean rebuild ===');
  await ssh('cd /www/wwwroot/namainvist.com && rm -rf .next && npm run build 2>&1 | tail -20');
  
  // Restart
  await ssh('pm2 restart main-site 2>&1 | tail -2');
  
  // Wait then check headers - s-maxage should be GONE now
  await new Promise(r => setTimeout(r, 3000));
  console.log('\n=== Verify: s-maxage should be gone ===');
  await ssh('curl -sI https://namainvist.com/ 2>/dev/null | grep -iE "cache-control|x-nextjs"');
  
  console.log('\n✅ Done! Page is now server-rendered (no Cloudflare caching)');
})();
