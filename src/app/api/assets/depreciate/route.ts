import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { FixedAssetsEngine } from '@/lib/fixed-assets-engine';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(_request: NextRequest) {
    try {
        // Delegate to engine: handles all asset types, methods, salvage caps, JE + log
        const depreciatedCount = await FixedAssetsEngine.runDepreciation(new Date());

        return NextResponse.json({
            success: true,
            message: `تم حساب وتطبيق الإهلاك بنجاح على ${depreciatedCount} أصل.`,
        });
    } catch (error: any) {
        console.error('Depreciation Error:', error);
        return apiError(error, 'فشل إجراء دورة الإهلاك الشهرية.', { context: 'assets/depreciate' });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
