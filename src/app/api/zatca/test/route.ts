
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export async function GET(req: NextRequest) {
    try {
        const settings = await prisma.setting.findMany();
        const dict: any = {};
        settings.forEach((s: any) => dict[s.key] = s.value);
        return NextResponse.json({
            vat: dict.tax_number,
            crn: dict.zatca_crn,
            company: dict.company_name_en,
            city_en: dict.zatca_city_en,
            street: dict.zatca_street,
            branch_en: dict.branch_name_en,
            csr: dict.zatca_csr_base64
        });
    } catch (e: any) { return NextResponse.json({ error: e.message }); }
}
