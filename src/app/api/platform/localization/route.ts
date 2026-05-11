import { NextRequest, NextResponse } from 'next/server';
import { LocalizationEngine } from '@/lib/localization-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') ?? 'ar-SA';
  const view   = searchParams.get('view') ?? 'config';

  if (view === 'config') return NextResponse.json({ config: LocalizationEngine.getConfig(locale) });
  if (view === 'locales') return NextResponse.json({ locales: LocalizationEngine.getSupportedLocales() });
  if (view === 'format') {
    const value  = Number(searchParams.get('value') ?? 0);
    const type   = searchParams.get('type') ?? 'currency';
    if (type === 'currency') return NextResponse.json({ formatted: LocalizationEngine.formatCurrency(value, locale) });
    if (type === 'number')   return NextResponse.json({ formatted: LocalizationEngine.formatNumber(value, locale) });
    if (type === 'date')     return NextResponse.json({ formatted: LocalizationEngine.formatDate(new Date(searchParams.get('date') ?? new Date()), locale) });
  }
  return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
}
