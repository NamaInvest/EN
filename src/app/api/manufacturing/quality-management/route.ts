import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

async function _GET() {

    return NextResponse.json({
        success: true,
        data: {
            score: 85,
            trend: "positive",
            details: "Mock Quality Management data."
        }
    });
}

export const GET = withRoute(async ({ req }) => _GET(), { rateLimit: 'DEFAULT' });
