import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        success: true,
        data: {
            score: 85,
            trend: "positive",
            details: "Mock Quality Management data."
        }
    });
}
