import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Document Expiry Alert Actions
 * POST /api/hr/documents/expiry/[id] — تجديد أو تجاهل تنبيه
 */
import { NextResponse } from 'next/server';
import { DocumentExpiryEngine } from '@/lib/document-expiry';
import { z } from 'zod';


const _POSTSchema = z.object({
  action: z.any().optional(),
  newExpiryDate: z.string().optional(),
  renewalCost: z.number().optional(),
  dismissReason: z.any().optional(),
}).passthrough();

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const alertId = parseInt((await params).id);

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { action, newExpiryDate, renewalCost, dismissReason } = body;

        if (action === 'renew') {
            if (!newExpiryDate) {
                return NextResponse.json({ error: 'يجب تحديد تاريخ انتهاء جديد' }, { status: 400 });
            }
            await DocumentExpiryEngine.markRenewed(alertId, new Date(newExpiryDate), user.userId, renewalCost);
            return NextResponse.json({ success: true, message: 'تم التجديد بنجاح' });
        } else if (action === 'dismiss') {
            await DocumentExpiryEngine.dismissAlert(alertId, dismissReason || 'تم التجاهل يدوياً');
            return NextResponse.json({ success: true, message: 'تم التجاهل' });
        } else {
            return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
        }
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
