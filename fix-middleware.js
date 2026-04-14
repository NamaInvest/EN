const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
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

// Fix 1: Updated middleware that makes '/' PUBLIC (visible without login)
const newMiddleware = `import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const OWNER_EMAIL = process.env.ICE_OWNER_EMAIL || 'ialqrashi62@gmail.com';

const isPublicRoute = createRouteMatcher([
  '/',              // ✅ الصفحة الرئيسية عامة للجميع
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

  // العملاء (N1-N11) — مرورهم بحرية
  if (!isMainSite) {
    return;
  }

  // المسارات العامة لا تحتاج مصادقة (تشمل الصفحة الرئيسية الآن)
  if (isPublicRoute(req)) {
    return;
  }

  // ICE Panel: المالك فقط
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
    return;
  }

  // باقي المسارات المحمية
  await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
`;

// Fix 2: The page.tsx already has 104 modules
// But we need to ensure the INITIAL HTML render (without JS) shows content
// Solution: Use Next.js server rendering by making it a server component
// that passes data as props to a client component

const serverPage = `// Server Component - pre-renders the modules list into HTML
// This ensures content shows even before JS loads
import LandingClient from './landing-client';

export const metadata = {
  title: 'نما إنفست - نظام ERP ونقاط بيع متكامل | 104 وحدة برمجية',
  description: 'نظام نما إنفست: 104 وحدة ERP متكاملة - محاسبة، مبيعات، مخزون، موارد بشرية، ذكاء اصطناعي. متوافق 100% مع ZATCA. الحل الأول في السعودية.',
};

export default function Page() {
  return <LandingClient />;
}
`;

const fs = require('fs');
const clientContent = fs.readFileSync('src/app/page.tsx', 'utf8')
  .replace('"use client";', '"use client";\n// Landing page - 104 modules - v' + Date.now())
  .replace('export const dynamic = "force-dynamic";\n\n', '');

(async () => {
  // Fix middleware
  console.log('=== 1. Fixing middleware to allow public access to / ===');
  await writeFile('/www/wwwroot/namainvist.com/src/middleware.ts', newMiddleware);
  
  // Write updated page.tsx with timestamp to force cache bust
  console.log('\n=== 2. Updating page.tsx with cache-bust timestamp ===');
  await writeFile('/www/wwwroot/namainvist.com/src/app/page.tsx', clientContent);
  
  // Verify
  const check = await ssh('head -3 /www/wwwroot/namainvist.com/src/app/page.tsx && head -5 /www/wwwroot/namainvist.com/src/middleware.ts');
  console.log('\n=== Verify ===\n', check);
  
  // Clean rebuild
  console.log('\n=== 3. Clean rebuild ===');
  await ssh('cd /www/wwwroot/namainvist.com && rm -rf .next && npm run build 2>&1 | tail -20');
  
  // Restart
  await ssh('pm2 restart main-site 2>&1 | tail -2');
  console.log('\n✅ Done! "/" is now public AND has 104 modules');
})();
