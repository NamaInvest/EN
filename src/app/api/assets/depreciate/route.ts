import { NextResponse, NextRequest } from 'next/server';
import { FixedAssetsEngine } from '@/lib/fixed-assets-engine';
import { apiError } from '@/lib/api-error';

export async function POST(_request: NextRequest) {
    try {
        // Delegate to engine: handles all asset types, methods, salvage caps, JE + log
        const depreciatedCount = await FixedAssetsEngine.runDepreciation(new Date());

        return NextResponse.json({
            success: true,
            message: `تم حساب وتطبيق الإهلاك بنجاح على ${depreciatedCount} أصل.`,
        });
    } catch (error) {
        console.error('Depreciation Error:', error);
        return apiError(error, 'فشل إجراء دورة الإهلاك الشهرية.', { context: 'assets/depreciate' });
    }
}
