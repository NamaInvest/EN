import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const OWNER_EMAIL = process.env.ICE_OWNER_EMAIL || 'admin@namainvist.com';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/api(.*)',
  '/api/zatca/callbacks(.*)'
]);

const isIceRoute = createRouteMatcher(['/ice(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const hostname = req.headers.get('host') || '';
  
  // Determine if this is the main landing site or localhost
  const isLandingSite = hostname === 'namainvist.com' || hostname === 'www.namainvist.com' || hostname.startsWith('localhost');

  if (isPublicRoute(req)) {
      return;
  }

  // ── ICE Panel: Owner-only guard ───────────────────────────────────────────
  if (isIceRoute(req)) {
      const { userId } = await auth();
      if (!userId) {
          return NextResponse.redirect(new URL('/', req.url));
      }
      // Verify owner email via Clerk
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
          headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
      });
      const clerkUser = await clerkRes.json().catch(() => ({}));
      const email: string = clerkUser?.email_addresses?.[0]?.email_address || '';
      if (email !== OWNER_EMAIL) {
          return NextResponse.redirect(new URL('/', req.url));
      }
      return; // ✅ Owner is allowed
  }

  // If path is exactly '/', only allow it publicly if it's the landing site
  if (req.nextUrl.pathname === '/') {
      if (!isLandingSite) {
          // If it's an ERP node (e.g. n2.namainvist.com), protect '/' so they are forced to login
          await auth.protect();
      }
      return;
  }

  // Protect all other routes
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
