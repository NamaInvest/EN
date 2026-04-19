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
  '/api/webhooks(.*)',
  '/api/og(.*)',
  '/auto-login(.*)',
]);

const isIceRoute = createRouteMatcher(['/ice']);

export default clerkMiddleware(async (auth, req) => {
  const hostname = req.headers.get('host') || '';
  const isMainSite =
    MAIN_HOSTS.includes(hostname) ||
    hostname.startsWith('localhost') ||
    hostname.startsWith('127.0.0.1');

  // ══════════════════════════════════════════════════════════════════
  // TENANT SUBDOMAINS — bypass Clerk auth, use ERP token
  // ══════════════════════════════════════════════════════════════════
  if (!isMainSite && hostname.endsWith('.namainvist.com')) {
    const tenant = hostname.replace('.namainvist.com', '');
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-tenant', tenant);
    const pathname = req.nextUrl.pathname;

    // Root → redirect
    if (pathname === '/' || pathname === '') {
      const token = req.cookies.get('token')?.value;
      return NextResponse.redirect(new URL(token ? '/dashboard' : '/login', req.url));
    }

    // Public tenant routes — pass through
    if (
      pathname === '/login' ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/auto-login') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/uploads/')
    ) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Protected routes — check ERP token
    const token = req.cookies.get('token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ══════════════════════════════════════════════════════════════════
  // MAIN SITE — Clerk auth
  // ══════════════════════════════════════════════════════════════════

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

  // /company-info
  if (req.nextUrl.pathname.startsWith('/company-info')) {
    await auth.protect();
    const { userId } = await auth();
    if (userId) {
      try {
        const SAAS_INTERNAL = process.env.SAAS_INTERNAL_URL || 'http://127.0.0.1:3500';
        const checkRes = await fetch(
          `${SAAS_INTERNAL}/api/tenant/check-status?userId=${userId}`,
          { signal: AbortSignal.timeout(4000) }
        );
        const { provisioned, subdomain } = await checkRes.json().catch(() => ({ provisioned: false }));
        if (provisioned && subdomain) {
          const host = req.headers.get('host') || '';
          const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
          return NextResponse.redirect(
            isLocal ? 'http://localhost:3500/dashboard' : `https://${subdomain}.namainvist.com/dashboard`
          );
        }
      } catch {}
    }
    return;
  }

  // ICE Panel
  if (isIceRoute(req)) return NextResponse.next();

  // All other main site routes → Clerk protect
  await auth.protect();
  const { userId } = await auth();

  if (userId) {
    try {
      const SAAS_INTERNAL = process.env.SAAS_INTERNAL_URL || 'http://127.0.0.1:3500';
      const checkRes = await fetch(
        `${SAAS_INTERNAL}/api/tenant/check-status?userId=${userId}`,
        { signal: AbortSignal.timeout(4000) }
      );
      const { provisioned, subdomain } = await checkRes.json().catch(() => ({ provisioned: false }));
      if (!provisioned) {
        return NextResponse.redirect(new URL('/company-info', req.url));
      }
      const host = req.headers.get('host') || '';
      const isMain = MAIN_HOSTS.includes(host) || host.startsWith('localhost') || host.startsWith('127.0.0.1');
      if (isMain && subdomain) {
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const base = host.includes('localhost') ? `${protocol}://localhost:3500` : `${protocol}://${subdomain}.namainvist.com`;
        return NextResponse.redirect(new URL('/auto-login', base));
      }
    } catch {}
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
