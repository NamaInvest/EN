import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const MAIN_HOSTS = ['namainvist.com', 'www.namainvist.com'];

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/api/ice(.*)',
  '/api/tenant/provision(.*)',
  '/api/tenant/hidden-modules(.*)',
  '/api/tenant/check-status(.*)',
  '/api/tenant/auto-login(.*)',
  '/api/tenant/seed-company(.*)',
  '/api/auth/sso-redirect(.*)',
  '/api/webhooks(.*)',
  '/api/og(.*)',
  '/api/version(.*)',
  '/api/sys(.*)',
  '/auto-login(.*)',
  '/updates(.*)',
]);

const isIceRoute = createRouteMatcher(['/ice', '/ice/(.*)', '/admin/(.*)']);

const clerk = clerkMiddleware(async (auth, req) => {
  const hostname = req.headers.get('host') || '';

  // Marketing pages
  const marketingRoutes = ['/', '', '/pharmacy', '/retail', '/restaurant', '/factory', '/services', '/pricing', '/features'];
  if (marketingRoutes.includes(req.nextUrl.pathname)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-is-marketing', '1');
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.headers.set('CDN-Cache-Control', 'no-store');
    res.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
    return res;
  }

  // Public auth routes
  if (isPublicRoute(req)) return;

  // /company-info — يحتاج auth فقط، بدون توجيه تلقائي
  // المستخدم وصل هنا لأن إيميله ما عنده tenant — نخليه ينشئ شركة جديدة
  if (req.nextUrl.pathname.startsWith('/company-info')) {
    await auth.protect();
    return;
  }

  // ICE Panel
  if (isIceRoute(req)) return NextResponse.next();

  // All other main site routes → Clerk protect
  await auth.protect();
  const { userId } = await auth();

  if (userId) {
    try {
      const host = req.headers.get('host') || '';
      const isMain = MAIN_HOSTS.includes(host) || host.startsWith('localhost') || host.startsWith('127.0.0.1');
      if (isMain) {
        // توجيه لـ sso-redirect API الي يجلب الإيميل من Clerk ويحدد الـ tenant الصحيح
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const base = host.includes('localhost') ? `${protocol}://localhost:3500` : `${protocol}://${host}`;
        return NextResponse.redirect(new URL(`/api/auth/sso-redirect?userId=${userId}`, base));
      }
    } catch {}
  }
});

export default function middleware(req: any, event: any) {
  const hostname = req.headers.get('host') || '';
  const isDesktopMode = process.env.DESKTOP_MODE === 'true';
  const isMainSite =
    MAIN_HOSTS.includes(hostname) ||
    hostname.startsWith('localhost') ||
    hostname.startsWith('127.0.0.1');

  // ══════════════════════════════════════════════════════════════════
  // DESKTOP MODE — bypass Clerk, use ERP token auth
  // ══════════════════════════════════════════════════════════════════
  if (isDesktopMode) {
    const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
    if (isLocalhost && req.nextUrl.pathname.startsWith('/ice')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    const pathname = req.nextUrl.pathname;
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-desktop-mode', '1');

    if (pathname === '/' || pathname === '') {
      const token = req.cookies.get('token')?.value;
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (pathname.startsWith('/ice')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (
      pathname === '/login' ||
      pathname === '/company-setup' ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/uploads/') ||
      pathname.startsWith('/updates/') ||
      pathname.startsWith('/sign-in') ||
      pathname.startsWith('/sign-up') ||
      pathname.startsWith('/sso-callback')
    ) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const token = req.cookies.get('token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ══════════════════════════════════════════════════════════════════
  // TENANT SUBDOMAINS — bypass Clerk auth, use ERP token
  // ══════════════════════════════════════════════════════════════════
  if (!isMainSite && hostname.endsWith('.namainvist.com')) {
    const tenant = hostname.replace('.namainvist.com', '');
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-tenant', tenant);
    const pathname = req.nextUrl.pathname;

    if (pathname === '/' || pathname === '') {
      const token = req.cookies.get('token')?.value;
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      try {
        const payloadB64 = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
        const ADMIN_ROLES = ['admin', 'owner', 'system_admin'];
        if (ADMIN_ROLES.includes(payload.role)) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        return NextResponse.redirect(new URL('/pos', req.url));
      } catch {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    if (pathname.startsWith('/company-info')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (
      pathname === '/login' ||
      pathname.startsWith('/menu') ||
      pathname.startsWith('/api/public') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/auto-login') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/uploads/') ||
      pathname.startsWith('/updates/') ||
      pathname.startsWith('/sign-in') ||
      pathname.startsWith('/sign-up') ||
      pathname.startsWith('/sso-callback')
    ) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const token = req.cookies.get('token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ══════════════════════════════════════════════════════════════════
  // MAIN SITE — Use Clerk Middleware
  // ══════════════════════════════════════════════════════════════════
  return clerk(req, event);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
