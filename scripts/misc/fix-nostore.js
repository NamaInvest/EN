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
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
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
      .connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

// Middleware adds Cache-Control: no-store for root path
// Middleware ALWAYS runs dynamically - its headers override Next.js static headers
const newMiddleware = `import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const OWNER_EMAIL = process.env.ICE_OWNER_EMAIL || 'ialqrashi62@gmail.com';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
  '/manifest(.*)',
  '/googlebe8c17f02d7742b4.html',
]);

const isIceRoute = createRouteMatcher(['/ice(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const hostname = req.headers.get('host') || '';

  const isMainSite =
    hostname === 'namainvist.com' ||
    hostname === 'www.namainvist.com' ||
    hostname.startsWith('localhost');

  if (!isMainSite) {
    return NextResponse.next();
  }

  // ✅ For root path: force no-cache so page is always fresh
  if (req.nextUrl.pathname === '/') {
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.headers.set('CDN-Cache-Control', 'no-store');
    res.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
    return res;
  }

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (isIceRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    const clerkRes = await fetch(\`https://api.clerk.com/v1/users/\${userId}\`, {
      headers: { Authorization: \`Bearer \${process.env.CLERK_SECRET_KEY}\` },
    });
    const clerkUser = await clerkRes.json().catch(() => ({}));
    const email: string = clerkUser?.email_addresses?.[0]?.email_address || '';
    if (email !== OWNER_EMAIL) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
`;

// Page.tsx: use unstable_noStore which is the official Next.js way to opt out of static
const newPageTsx = `import LandingPage from './_landing';
import { unstable_noStore as noStore } from 'next/cache';

export default function Page() {
  // Opt out of static generation - forces server-side render every request
  noStore();
  return <LandingPage />;
}
`;

(async () => {
  // Write both files
  console.log('=== Writing middleware.ts ===');
  await writeFile('/www/wwwroot/namainvist.com/src/middleware.ts', newMiddleware);
  
  console.log('\n=== Writing page.tsx with noStore() ===');
  await writeFile('/www/wwwroot/namainvist.com/src/app/page.tsx', newPageTsx);
  
  // Clean rebuild
  console.log('\n=== Clean rebuild ===');
  await ssh('cd /www/wwwroot/namainvist.com && rm -rf .next && npm run build 2>&1 | grep -E "○|ƒ|Route|Error" | head -15');
  
  // Restart
  await ssh('pm2 restart main-site 2>&1 | tail -2');
  await new Promise(r => setTimeout(r, 3000));
  
  // Verify: check if / is now ƒ (dynamic)
  const buildOutput = await ssh('cd /www/wwwroot/namainvist.com && cat .next/BUILD_ID && ls .next/server/app/index.html 2>/dev/null && echo "STATIC EXISTS" || echo "NO STATIC FILE ✅"');
  console.log('\nBuild check:', buildOutput);
  
  // Check headers
  console.log('\n=== Live headers ===');
  await ssh('curl -sI https://namainvist.com/ 2>/dev/null | grep -iE "cache-control|x-nextjs|cf-cache"');
  
  console.log('\n✅ Done!');
})();
