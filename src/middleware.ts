import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const OWNER_EMAIL = process.env.ICE_OWNER_EMAIL || 'ialqrashi62@gmail.com';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  // APIs that handle their own auth internally
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

// ICE Panel UI — المالك فقط (redirect to sign-in if not authenticated)
const isIceRoute = createRouteMatcher(['/ice']);

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
  if (isPublicRoute(req)) {
    return;
  }

  // /company-info — إذا كان المستخدم مؤسَّساً بالفعل وجّهه للـ dashboard مباشرة
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
          // المستخدم مؤسَّس → وجّهه لـ subdomain dashboard
          const host = req.headers.get('host') || '';
          const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
          const targetUrl = isLocal
            ? `http://localhost:3500/dashboard`
            : `https://${subdomain}.namainvist.com/dashboard`;
          return NextResponse.redirect(targetUrl);
        }
      } catch {
        // فشل الفحص → اسمح له بصفحة company-info
      }
    }
    return;
  }

  // ── ICE Panel: تسجيل دخول مخصّص (بدون Clerk) ──────────────────────────────
  if (isIceRoute(req)) {
    const iceToken = req.cookies.get('ice_token')?.value;
    if (!iceToken) {
      // لا يوجد token → الصفحة ستعرض نموذج تسجيل الدخول
      return NextResponse.next();
    }
    // التحقق من صلاحية الـ token
    try {
      const [data, sig] = iceToken.split('.');
      const crypto = require('crypto');
      const secret = process.env.ICE_SECRET || 'ice_admin_secret_nama_2026_x9k';
      const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('hex');
      if (sig === expectedSig) {
        const payload = JSON.parse(Buffer.from(data, 'base64').toString());
        if (payload.exp > Date.now()) {
          return NextResponse.next(); // ✅ مصادق عليه
        }
      }
    } catch (e) {
      console.error('[ICE] Token verify error:', e);
    }
    // Token غير صالح → الصفحة ستعرض نموذج تسجيل الدخول
    return NextResponse.next();
  }

  // باقي مسارات الموقع الرئيسي → Clerk protect أولاً
  await auth.protect();
  const { userId } = await auth();

  // ── Onboarding Guard: هل المستخدم مؤسَّس؟ ──────────────────────────────
  if (userId) {
    try {
      // دائماً نستعلم من saas-app (port 3500) الذي يملك السجل الكامل للـ tenants
      // هذا يجنب مشكلة اختلاف قواعد البيانات بين main-site و saas-app
      const SAAS_INTERNAL = process.env.SAAS_INTERNAL_URL || 'http://127.0.0.1:3500';
      const checkRes = await fetch(
        `${SAAS_INTERNAL}/api/tenant/check-status?userId=${userId}`,
        { signal: AbortSignal.timeout(4000) }
      );
      const { provisioned, subdomain } = await checkRes.json().catch(() => ({ provisioned: false }));
      if (!provisioned) {
        return NextResponse.redirect(new URL('/company-info', req.url));
      }
      // إذا كان المستخدم مؤسَّساً وعلى الموقع الرئيسي → وجّهه للـ auto-login أولاً
      const host = req.headers.get('host') || '';
      const isMain = ['namainvist.com', 'www.namainvist.com'].includes(host) || host.startsWith('localhost') || host.startsWith('127.0.0.1');
      if (isMain && subdomain) {
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const base = host.includes('localhost') ? `${protocol}://localhost:3500` : `${protocol}://${subdomain}.namainvist.com`;
        // /auto-login سيُنشئ الـ session الداخلي للـ ERP باستخدام بيانات Clerk ثم يُوجَّه للـ dashboard
        return NextResponse.redirect(new URL('/auto-login', base));
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
