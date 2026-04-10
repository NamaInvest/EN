import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const isLoginPage = request.nextUrl.pathname.startsWith('/login');
    const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');
    const isPublicStatic = request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.includes('.');

    // For simplicity, we don't block static files or auth API routes
    if (isLoginPage || isApiAuthRoute || isPublicStatic) {
        return NextResponse.next();
    }


    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
        // Redirect to login preserving the requested URL
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

