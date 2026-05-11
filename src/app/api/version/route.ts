import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '2.4.6';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'version' });

async function _GET() {

    // This API provides the latest version for the desktop application.
    // In production, this can be managed via DB, but hardcoding for now as requested.
    return NextResponse.json({
        success: true,
        version: APP_VERSION,
        mandatory: true,
        downloadUrl: `https://namainvist.com/updates/desktop/NamaInvest-Setup-${APP_VERSION}.exe`,
        releaseNotes: 'تحسينات في نظام ZATCA وإصلاحات لمشاكل الواجهة'
    });
}

export const GET = withRoute(async ({ req }) => _GET(), { rateLimit: 'DEFAULT' });
