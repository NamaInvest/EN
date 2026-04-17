import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        { status: 'ok', timestamp: Date.now() },
        { 
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            } 
        }
    );
}
