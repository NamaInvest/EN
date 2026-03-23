import { NextResponse } from 'next/server';

export function GET() {
    return new NextResponse('google-site-verification: googlebe8c17f02d7742b4.html', {
        status: 200,
        headers: {
            'Content-Type': 'text/plain'
        }
    });
}
