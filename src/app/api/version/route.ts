import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import packageJson from '../../../../package.json';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'version' });

async function _GET() {

    // This API provides the latest version for the desktop application.
    // In production, this can be managed via DB, but hardcoding for now as requested.
    return NextResponse.json({
        success: true,
        version: packageJson.version,
        mandatory: true,
        downloadUrl: `https://namainvist.com/updates/desktop/NamaInvest-Setup-${packageJson.version}.exe`,
        releaseNotes: 'تحسينات في نظام ZATCA وإصلاحات لمشاكل الواجهة'
    });
}

export const GET = withRoute(async ({ req }) => _GET(), { rateLimit: 'DEFAULT' });
