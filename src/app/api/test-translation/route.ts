import { NextResponse } from 'next/server';
import { translate } from '@/lib/translations';

export async function GET() {
    return NextResponse.json({
        raw_4294: translate('sys.str_4294', 'ar'),
        raw_4295: translate('sys.str_4295', 'ar'),
        raw_4278: translate('sys.str_4278', 'ar')
    });
}
