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
        if (err) { console.error('sftp error:', err.message); c.end(); return r(false); }
        const buf = Buffer.from(content, 'utf8');
        const stream = sftp.createWriteStream(remotePath);
        stream.write(buf); stream.end();
        stream.on('close', () => { console.log('[✓] Written', remotePath); c.end(); r(true); });
        stream.on('error', e => { console.error('[✗]', e.message); c.end(); r(false); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

// Read the namainvist.com page.tsx content 
const filePage = fs.readFileSync('src/app/page.tsx', 'utf8');

(async () => {
  // The real fix: force page.tsx to NOT be static by adding a route segment config
  // We need to add export const dynamic = 'force-dynamic' at the top
  // But it's already there! The issue is it's being ignored because it's a client component
  // Solution: Create a wrapper server component 
  
  const serverWrapper = `import { headers } from 'next/headers';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Import the client page
import NamaInvestLanding from './landing';

export default function Page() {
  // Force dynamic by accessing headers
  const headersList = headers();
  return <NamaInvestLanding />;
}
`;

  // Rename current page.tsx to landing.tsx
  console.log('Setting up dynamic page wrapper...');
  
  // Copy page.tsx to landing.tsx
  await writeFile('/www/wwwroot/namainvist.com/src/app/landing.tsx', filePage);
  
  // Write server wrapper as page.tsx
  await writeFile('/www/wwwroot/namainvist.com/src/app/page.tsx', serverWrapper);
  
  // Rebuild
  console.log('\n🔨 Rebuilding with force-dynamic...');
  await ssh('cd /www/wwwroot/namainvist.com && rm -rf .next && export NODE_OPTIONS="--max-old-space-size=4096" && npm run build 2>&1');
  
  console.log('\n🔄 Restarting main-site...');
  await ssh('pm2 restart main-site 2>&1 | tail -3');
  
  console.log('\n✅ DONE');
})();
