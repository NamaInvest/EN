import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const OWNER_EMAIL = process.env.ICE_OWNER_EMAIL || 'ialqrashi62@gmail.com';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
  '/auto-login(.*)',
]);

const isIceRoute = createRouteMatcher(['/ice(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // ── استخراج الـ tenant من الـ subdomain ──────────────────────────
  // namainvist.com            → الموقع الرئيسي (لا tenant)
  // n11.namainvist.com        → tenant: 'n11'
  // company123.namainvist.com → tenant: 'company123'
  const hostname = req.headers.get('host') || '';
  const MAIN_HOSTS = ['namainvist.com', 'www.namainvist.com'];
  const isMainSite =
    MAIN_HOSTS.includes(hostname) ||
    hostname.startsWith('localhost') ||
    hostname.startsWith('127.0.0.1');


  // Tenant subdomains (*.namainvist.com) → inject x-tenant header
  if (!isMainSite && hostname.endsWith('.namainvist.com')) {
    const tenant = hostname.replace('.namainvist.com', ''); // 'n11', 'ice', etc.
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-tenant', tenant);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }


  // ── MARKETING PAGES ────────────────────────────────────────────────────────
  // الصفحات التسويقية متاحة للجميع (مسجل أو غير مسجل) — التوجيه بعد التسجيل
  // يتم عبر NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/company-info في .env
  const marketingRoutes = ['/', '', '/pharmacy', '/retail', '/restaurant', '/factory', '/services'];
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
  if (isPublicRoute(req)) {
    return;
  }

  // /company-info is accessible to all authenticated users (no provisioning check)
  if (req.nextUrl.pathname.startsWith('/company-info')) {
    await auth.protect();
    return;
  }

  // ── ICE Panel: المالك فقط ──────────────────────────────────────────────────
  if (isIceRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
    const clerkUser = await clerkRes.json().catch(() => ({}));
    const email: string = clerkUser?.email_addresses?.[0]?.email_address || '';
    if (email !== OWNER_EMAIL) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return; // ✅ المالك مسموح له
  }

  // باقي مسارات الموقع الرئيسي → Clerk protect أولاً
  await auth.protect();
  const { userId } = await auth();

  // ── Onboarding Guard: هل المستخدم مؤسَّس؟ ──────────────────────────────
  if (userId) {
    try {
      const host = req.headers.get('host') || 'namainvist.com';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const checkRes = await fetch(
        `${protocol}://${host}/api/tenant/check-status?userId=${userId}`,
        { signal: AbortSignal.timeout(3000) }
      );
      const { provisioned } = await checkRes.json().catch(() => ({ provisioned: false }));
      if (!provisioned) {
        return NextResponse.redirect(new URL('/company-info', req.url));
      }
    } catch {
      // إذا فشل الفحص → اسمح بالمرور (لا نريد حجب المستخدمين بسبب خطأ شبكة)
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
