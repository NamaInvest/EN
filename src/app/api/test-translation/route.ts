import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { translate } from '@/lib/translations';

async function _GET() {

    return NextResponse.json({
        raw_4294: translate('sys.str_4294', 'ar'),
        raw_4295: translate('sys.str_4295', 'ar'),
        raw_4278: translate('sys.str_4278', 'ar')
    });
}

export const GET = withRoute(async ({ req }) => _GET(), { rateLimit: 'DEFAULT' });
