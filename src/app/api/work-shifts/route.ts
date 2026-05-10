import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'work-shifts' });
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/work-shifts — قائمة الورديات
 * POST /api/work-shifts — إنشاء وردية جديدة
 */
async function _GET(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const shifts = await (prisma as any).workShift?.findMany?.({ take: 100,
      orderBy: { id: 'asc' },
    });

    if (!shifts) {
      // إرجاع ورديات افتراضية إذا لم يتم ترحيل قاعدة البيانات
      return NextResponse.json({
        shifts: [
          { id: 1, name: 'صباحي', startTime: '08:00', endTime: '16:00', breakMins: 60, active: true },
          { id: 2, name: 'مسائي', startTime: '16:00', endTime: '00:00', breakMins: 60, active: true },
          { id: 3, name: 'ليلي', startTime: '00:00', endTime: '08:00', breakMins: 60, active: true },
        ],
        generated: true,
      });
    }

    return NextResponse.json({ shifts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  startTime: z.any().optional(),
  endTime: z.any().optional(),
  breakMins: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'صلاحية المدير مطلوبة' }, { status: 403 });
  }

  try {
    const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const { name, startTime, endTime, breakMins } = body;

    if (!name || !startTime || !endTime) {
      return NextResponse.json({ error: 'الاسم ووقت البداية والنهاية مطلوبة' }, { status: 400 });
    }

    const shift = await (prisma as any).workShift?.create?.({
      data: {
        name,
        startTime,
        endTime,
        breakMins: parseInt(breakMins) || 60,
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'يحتاج ترحيل قاعدة البيانات' }, { status: 500 });
    }

    return NextResponse.json({ success: true, shift });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
