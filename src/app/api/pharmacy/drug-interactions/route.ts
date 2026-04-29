/**
 * Drug Interaction Checker API
 * GET  /api/pharmacy/drug-interactions?drugs=123,456,789
 * POST /api/pharmacy/drug-interactions — check interactions for a list of drug IDs
 *
 * يستخدم قاعدة بيانات تفاعلات داخلية + يمكن ربطه بـ DrugBank API مستقبلاً
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// قاعدة تفاعلات أساسية (تُوسّع مع DrugBank API)
const KNOWN_INTERACTIONS: Record<string, { with: string; severity: 'high' | 'moderate' | 'low'; message: string }[]> = {
    'warfarin': [
        { with: 'aspirin', severity: 'high', message: 'خطر نزيف حاد — وارفارين + أسبرين يزيد خطر النزيف بشكل كبير' },
        { with: 'ibuprofen', severity: 'high', message: 'خطر نزيف — وارفارين مع مضادات الالتهاب غير الستيرويدية' },
        { with: 'amoxicillin', severity: 'moderate', message: 'قد يزيد تأثير وارفارين — راقب INR بعناية' },
    ],
    'metformin': [
        { with: 'alcohol', severity: 'high', message: 'خطر الحماض اللبني — تجنب الكحول مع ميتفورمين' },
        { with: 'iodine contrast', severity: 'moderate', message: 'أوقف ميتفورمين قبل صبغة الأشعة بـ 48 ساعة' },
    ],
    'simvastatin': [
        { with: 'clarithromycin', severity: 'high', message: 'خطر اعتلال عضلي — لا تجمع سيمفاستاتين مع كلاريثروميسين' },
        { with: 'amlodipine', severity: 'moderate', message: 'قلل جرعة سيمفاستاتين إلى 20 مج عند الدمج مع أملوديبين' },
    ],
    'amoxicillin': [
        { with: 'warfarin', severity: 'moderate', message: 'قد يزيد تأثير مضاد التخثر — راقب INR' },
        { with: 'methotrexate', severity: 'high', message: 'يزيد سمية ميثوتريكسات — تجنب الدمج' },
    ],
    'fluoxetine': [
        { with: 'tramadol', severity: 'high', message: 'خطر متلازمة السيروتونين — خطر جداً' },
        { with: 'maoi', severity: 'high', message: 'خطر قاتل — لا تجمع SSRIs مع MAOIs أبداً' },
    ],
};

function normalizeGenericName(name: string): string {
    return name.toLowerCase().trim()
        .replace(/\s+\d+.*$/, '') // Remove dosage suffix
        .replace(/كبسول|قرص|حقن|شراب|كريم|mg|mcg|ml/gi, '')
        .trim();
}

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const drugIds = url.searchParams.get('drugs')?.split(',').map(Number).filter(Boolean) || [];

    if (drugIds.length < 2) {
        return NextResponse.json({ interactions: [], message: 'يجب تحديد دواءين على الأقل' });
    }

    return checkInteractions(prisma, drugIds);
}

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json();
    const drugIds: number[] = (body.drugIds || []).map(Number).filter(Boolean);
    const genericNames: string[] = body.genericNames || [];

    if (drugIds.length === 0 && genericNames.length === 0) {
        return NextResponse.json({ interactions: [] });
    }

    return checkInteractions(prisma, drugIds, genericNames);
}

async function checkInteractions(prisma: any, drugIds: number[], extraNames: string[] = []) {
    // @ts-ignore — pharmacy model
    const drugs = drugIds.length > 0 ? await prisma.pharmacyDrug.findMany({
        where: { id: { in: drugIds } },
        select: { id: true, genericName: true, genericNameEn: true, drugClass: true },
    }) : [];

    const allGenerics = [
        ...drugs.map((d: any) => normalizeGenericName(d.genericNameEn || d.genericName)),
        ...extraNames.map(normalizeGenericName),
    ];

    const interactions: any[] = [];

    // Check each pair
    for (let i = 0; i < allGenerics.length; i++) {
        for (let j = i + 1; j < allGenerics.length; j++) {
            const drugA = allGenerics[i];
            const drugB = allGenerics[j];

            // Check A vs B
            const aInteractions = KNOWN_INTERACTIONS[drugA] || [];
            for (const interaction of aInteractions) {
                if (drugB.includes(interaction.with) || interaction.with.includes(drugB)) {
                    interactions.push({
                        drug1: allGenerics[i],
                        drug2: allGenerics[j],
                        severity: interaction.severity,
                        message: interaction.message,
                        action: interaction.severity === 'high' ? 'block' : 'warn',
                    });
                }
            }

            // Check B vs A
            const bInteractions = KNOWN_INTERACTIONS[drugB] || [];
            for (const interaction of bInteractions) {
                if (drugA.includes(interaction.with) || interaction.with.includes(drugA)) {
                    const alreadyFound = interactions.some(i => i.drug1 === drugB && i.drug2 === drugA);
                    if (!alreadyFound) {
                        interactions.push({
                            drug1: allGenerics[j],
                            drug2: allGenerics[i],
                            severity: interaction.severity,
                            message: interaction.message,
                            action: interaction.severity === 'high' ? 'block' : 'warn',
                        });
                    }
                }
            }
        }
    }

    const hasCritical = interactions.some(i => i.severity === 'high');

    return NextResponse.json({
        checked: allGenerics,
        interactions,
        hasCritical,
        summary: interactions.length === 0
            ? '✅ لا توجد تفاعلات دوائية معروفة'
            : `⚠️ ${interactions.length} تفاعل دوائي مكتشف${hasCritical ? ' — 🚨 خطير' : ''}`,
    });
}
