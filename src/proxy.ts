import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Server-side proxy: redirects unauthenticated users to /login
// and prevents authenticated users from accessing /login
export function proxy(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Public paths - no auth required
    if (
        pathname === '/login' ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/favicon') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.ico')
    ) {
        // If already logged in and trying to access login, redirect to dashboard
        if (pathname === '/login' && token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // Protected paths - require auth
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Root path - redirect to dashboard
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
