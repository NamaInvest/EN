import { logger } from '@/lib/logger';

const log = logger.child({ service: 'compliance-kb-seed' });

/**
 * AI-18 — ZATCA / SOCPA / Saudi Labor Law Knowledge Base Seed
 * Pre-built knowledge chunks for Saudi compliance questions.
 */

export const COMPLIANCE_KB_SEED = [
    // === ZATCA VAT ===
    {
        title: 'ضريبة القيمة المضافة — النسبة الأساسية',
        content: 'نسبة ضريبة القيمة المضافة في المملكة العربية السعودية هي 15% اعتباراً من 1 يوليو 2020. تُطبق على معظم السلع والخدمات باستثناء التوريدات المعفاة والخاضعة لنسبة صفر.',
        source: 'ZATCA_VAT',
        tags: ['vat', 'zatca', 'tax']
    },
    {
        title: 'التوريدات الخاضعة لنسبة الصفر',
        content: 'التوريدات الخاضعة لنسبة صفر تشمل: الصادرات خارج دول مجلس التعاون، خدمات النقل الدولي، الأدوية والمعدات الطبية المعتمدة، المعادن الاستثمارية (الذهب والفضة بنقاء 99%).',
        source: 'ZATCA_VAT',
        tags: ['vat', 'zero-rated']
    },
    {
        title: 'الفاتورة الإلكترونية — المرحلة الثانية',
        content: 'المرحلة الثانية (الربط والتكامل) تتطلب: ربط أنظمة الفوترة بمنصة فاتورة، ختم التشفير (Cryptographic Stamp)، رمز QR يحتوي على: اسم البائع، الرقم الضريبي، التاريخ والوقت، الإجمالي مع الضريبة، قيمة الضريبة. يجب تقديم CSR والحصول على شهادة CCSID.',
        source: 'ZATCA_EINVOICE',
        tags: ['zatca', 'einvoice', 'phase2']
    },
    {
        title: 'غرامات مخالفات الفوترة الإلكترونية',
        content: 'عدم إصدار فاتورة إلكترونية: غرامة من 5,000 إلى 50,000 ر.س. حذف أو تعديل فاتورة بعد إصدارها: غرامة 10,000 ر.س. عدم حفظ الفواتير: غرامة حتى 50,000 ر.س. عدم تضمين رمز QR: غرامة تبدأ من تنبيه وتصل لـ 50,000 ر.س.',
        source: 'ZATCA_PENALTIES',
        tags: ['zatca', 'penalties']
    },

    // === نظام العمل السعودي ===
    {
        title: 'ساعات العمل — المادة 98',
        content: 'لا يجوز تشغيل العامل أكثر من 8 ساعات يومياً أو 48 ساعة أسبوعياً. في شهر رمضان تُخفض لـ 6 ساعات يومياً أو 36 ساعة أسبوعياً للعمال المسلمين.',
        source: 'LABOR_LAW',
        tags: ['labor', 'working-hours']
    },
    {
        title: 'الإجازة السنوية — المادة 109',
        content: 'يستحق العامل إجازة سنوية لا تقل عن 21 يوماً، تُزاد إلى 30 يوماً إذا أمضى العامل 5 سنوات متصلة. الإجازة مدفوعة الأجر مقدماً.',
        source: 'LABOR_LAW',
        tags: ['labor', 'leave', 'annual']
    },
    {
        title: 'مكافأة نهاية الخدمة — المادة 84',
        content: 'يستحق العامل مكافأة نهاية خدمة: نصف شهر عن كل سنة من السنوات الخمس الأولى، وشهر عن كل سنة بعد ذلك. في حالة الاستقالة: ثلث المكافأة بعد سنتين، ثلثاها بعد 5 سنوات، وكاملة بعد 10 سنوات.',
        source: 'LABOR_LAW',
        tags: ['labor', 'eos', 'end-of-service']
    },
    {
        title: 'تأخير الرواتب — المادة 90',
        content: 'يجب دفع الأجور خلال 7 أيام عمل من نهاية الفترة المستحقة. في حالة التأخير: غرامة 3,000 ر.س عن كل عامل عن كل شهر تأخير عبر نظام حماية الأجور (مُدد).',
        source: 'LABOR_LAW',
        tags: ['labor', 'salary', 'mudad', 'wps']
    },

    // === GOSI ===
    {
        title: 'نسب اشتراك التأمينات الاجتماعية (GOSI)',
        content: 'السعودي: 21.5% (9.75% صاحب العمل + 9.75% العامل + 2% ساند). غير السعودي: 2% أخطار مهنية (يتحملها صاحب العمل فقط). الحد الأقصى للأجر الخاضع: 45,000 ر.س شهرياً.',
        source: 'GOSI',
        tags: ['gosi', 'social-insurance']
    },

    // === الزكاة ===
    {
        title: 'وعاء الزكاة — الطريقة المباشرة',
        content: 'وعاء الزكاة = رأس المال المدفوع + الأرباح المبقاة + الاحتياطيات + الالتزامات طويلة الأجل + صافي الربح المعدّل − الأصول الثابتة − الاستثمارات طويلة الأجل − الخسائر المرحلة. نسبة الزكاة: 2.5% من الوعاء.',
        source: 'ZAKAT',
        tags: ['zakat', 'tax']
    },

    // === PDPL (نظام حماية البيانات الشخصية) ===
    {
        title: 'نظام حماية البيانات الشخصية — الأساسيات',
        content: 'PDPL يلزم جميع الجهات بـ: الحصول على موافقة صريحة قبل جمع البيانات الشخصية، تحديد الغرض من المعالجة، حق الوصول والتصحيح والحذف للفرد، تعيين مسؤول حماية بيانات (DPO) للجهات الكبيرة، الإبلاغ عن الاختراقات خلال 72 ساعة.',
        source: 'PDPL',
        tags: ['pdpl', 'privacy', 'data-protection']
    },

    // === نطاقات ===
    {
        title: 'نظام نطاقات — التصنيف',
        content: 'نطاقات يصنف المنشآت حسب نسبة السعودة: البلاتيني (أعلى من المطلوب)، الأخضر المرتفع، الأخضر المنخفض، الأحمر (أقل من المطلوب). المنشآت في النطاق الأحمر لا يمكنها: إصدار تأشيرات، نقل خدمات، تجديد رخص العمل.',
        source: 'NITAQAT',
        tags: ['nitaqat', 'saudization', 'hr']
    },
];

/**
 * Get all seed data for initial knowledge base population.
 */
export function getComplianceSeeds() {
    return COMPLIANCE_KB_SEED;
}

/**
 * Search seeds by tag or keyword (for quick reference without vector DB).
 */
export function searchSeeds(query: string): typeof COMPLIANCE_KB_SEED {
    const q = query.toLowerCase();
    return COMPLIANCE_KB_SEED.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.tags.some(t => t.includes(q))
    );
}
