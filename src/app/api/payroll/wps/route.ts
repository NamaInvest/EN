/**
 * WPS File Generator API (A.3)
 * GET  /api/payroll/wps?period=2026-05   — Generate SIF file for period
 * POST /api/payroll/wps { action: 'generate', period, bankCode }
 * POST /api/payroll/wps { action: 'validate', sifContent }
 */
import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getUserFromRequest } from '@/lib/auth';
import { WPSGenerator } from '@/lib/wps-generator';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.payroll.wps' });

async function _GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const period   = searchParams.get('period') || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const bankCode = searchParams.get('bankCode') || 'RJHI';
    const format   = searchParams.get('format') || 'json';

    const payrollRunId = parseInt(searchParams.get('payrollRunId') || '0');
    if (!payrollRunId) return NextResponse.json({ error: 'payrollRunId مطلوب' }, { status: 400 });
    const employerId   = searchParams.get('employerId')   || '1000000000';
    const employerName = searchParams.get('employerName') || 'نما للاستثمار';
    const employerMOL  = searchParams.get('employerMOL')  || '1000000000';

    const result = await WPSGenerator.generateSIF(payrollRunId, bankCode, employerId, employerName, employerMOL).catch((e: any) => ({ error: e.message }));

    if ('error' in (result as any)) {
      return NextResponse.json({ error: (result as any).error }, { status: 500 });
    }

    if (format === 'sif') {
      return new NextResponse((result as any).sifContent || '', {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="WPS_${period}_${bankCode}.txt"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    log.error('WPS GET error:', error);
    return NextResponse.json({ error: 'فشل توليد ملف WPS' }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body   = await request.json();
    const action = body.action;

    if (action === 'generate') {
      const { period, bankCode } = body;
      const { payrollRunId, bankCode: bc, employerId, employerName, employerMOL } = body;
      if (!payrollRunId) return NextResponse.json({ error: 'payrollRunId مطلوب' }, { status: 400 });
      const result = await WPSGenerator.generateSIF(
        parseInt(payrollRunId),
        bc || 'RJHI',
        employerId || '1000000000',
        employerName || 'نما للاستثمار',
        employerMOL  || '1000000000',
      );
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'validate') {
      const { sifContent } = body;
      if (!sifContent) return NextResponse.json({ error: 'sifContent مطلوب' }, { status: 400 });
      const lines  = sifContent.split('\n').length;
      const hasEOH = sifContent.includes('EOH');
      const hasEOF = sifContent.includes('EOF');
      return NextResponse.json({
        valid: hasEOH && hasEOF,
        lineCount: lines,
        issues: [...(hasEOH ? [] : ['Missing EOH']), ...(hasEOF ? [] : ['Missing EOF'])],
      });
    }

    if (action === 'validate-ibans') {
      const result = await WPSGenerator.validateIBANs(body.employees || []);
      return NextResponse.json(result);
    }

    if (action === 'compliance') {
      const errors = await WPSGenerator.validateQiwaCompliance(parseInt(body.payrollRunId));
      return NextResponse.json({ errors, valid: errors.length === 0 });
    }

    if (action === 'dashboard') {
      const dashboard = await WPSGenerator.getComplianceDashboard();
      return NextResponse.json(dashboard);
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
  } catch (error: any) {
    log.error('WPS POST error:', error);
    return NextResponse.json({ error: 'فشل معالجة WPS' }, { status: 500 });
  }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
