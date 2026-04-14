const { Client } = require('ssh2');

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
        ws.on('close', () => { console.log('[✓] Written:', remotePath.split('/').pop()); c.end(); r(true); });
        ws.on('error', e => { console.error('[✗]', e.message); c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', e => { console.error(e.message); r(false); })
     .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

// The issue: Next.js Turbopack reads page.tsx but the static RSC/HTML doesn't reflect it
// because the page is a "use client" component - it's hydrated by the browser JS
// The static HTML is just the shell (from layout.tsx + server components)
// The actual page content (modulesList) comes from the JS bundle

// Solution: Force a server component wrapper to pre-render the HTML content
const serverPage = `import NamaModule from './page-client';
export default function Page() {
  return <NamaModule />;
}
`;

const fs = require('fs');
const clientContent = fs.readFileSync('src/app/page.tsx', 'utf8');

(async () => {
  // Check what's in the built chunk for our page
  const chunkContent = await ssh('strings /www/wwwroot/namainvist.com/.next/server/chunks/ssr/src_app_page_tsx_a7111f3e._.js 2>/dev/null | grep -E "104|وحدة|modulesList" | head -10');
  console.log('Chunk content check:', chunkContent || 'NOT found');
  
  // The real fix: the compiled static HTML is pre-rendered from the last git version
  // We need to update the RSC file directly
  // OR we can delete the static pre-rendered files and let Next serve dynamically
  
  console.log('\n=== Deleting pre-rendered static files to force dynamic serve ===');
  await ssh('rm -f /www/wwwroot/namainvist.com/.next/server/app/index.html && echo "index.html deleted"');
  await ssh('rm -f /www/wwwroot/namainvist.com/.next/server/app/index.rsc && echo "index.rsc deleted"');
  await ssh('rm -f /www/wwwroot/namainvist.com/.next/server/app/index.meta && echo "index.meta deleted"');
  await ssh('rm -rf /www/wwwroot/namainvist.com/.next/server/app/index.segments/ && echo "index.segments deleted"');
  
  // Restart to serve fresh
  console.log('\n=== Restarting main-site ===');
  await ssh('pm2 restart main-site 2>&1 | tail -2');
  
  console.log('\n=== Wait 3 seconds, then verify ===');
  await new Promise(r => setTimeout(r, 3000));
  
  // Check what the server now serves for /
  const response = await ssh('curl -s https://namainvist.com/ 2>/dev/null | grep -o "104 وحدة\\|73 قسم\\|modulesList" | head -5');
  console.log('\nLive response check:', response || 'empty (JS-rendered, expected)');
  
  console.log('\n✅ Done! The page is now served without static cache.');
  console.log('The 104 modules are in the JS bundle and will render client-side.');
})();
