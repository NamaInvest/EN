import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        success: true,
        data: {
            totalExposure: 1500000,
            eclProvision: 25000,
            pd: 1.5,
            lgd: 45
        }
    });
}
