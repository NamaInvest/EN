import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'copa.value-fields' });

// COPA Value Fields — الحقول الكمية لنظام المحاسبة الربحية
async function _GET() {
    return NextResponse.json({
        fields: [
            { key: 'revenue', label: 'الإيراد', type: 'currency' },
            { key: 'directCost', label: 'التكلفة المباشرة', type: 'currency' },
            { key: 'grossMargin', label: 'هامش الربح الإجمالي', type: 'currency' },
            { key: 'overheadAllocation', label: 'توزيع المصاريف العامة', type: 'currency' },
            { key: 'netMargin', label: 'صافي الهامش', type: 'currency' },
            { key: 'quantity', label: 'الكمية', type: 'number' },
            { key: 'unitPrice', label: 'سعر الوحدة', type: 'currency' },
        ]
    });
}

export const GET = withRoute(async ({ req }) => _GET(), { rateLimit: 'DEFAULT' });
