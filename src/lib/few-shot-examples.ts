import { logger } from '@/lib/logger';

const log = logger.child({ service: 'few-shot-examples' });

/**
 * AI-04 — Few-shot Examples Registry
 * Provides structured few-shot examples for each AI prompt template.
 * Includes chain-of-thought patterns for analytical tasks.
 */

export interface FewShotExample {
    input: string;
    output: string;
    reasoning?: string; // Chain-of-thought
}

const EXAMPLES: Record<string, FewShotExample[]> = {
    'cfo.daily_summary': [
        {
            input: 'أعطني ملخص مالي سريع',
            reasoning: 'أحلل: 1) إيرادات اليوم مقارنة بالأمس 2) المصروفات المعلقة 3) أرصدة البنوك 4) الذمم المدينة المتأخرة',
            output: '📊 ملخص اليوم:\n• الإيرادات: 45,200 ر.س (↑12% عن أمس)\n• مصروفات معلقة: 3 فواتير بقيمة 18,500 ر.س\n• رصيد البنوك: 1,250,000 ر.س\n• ذمم متأخرة: 67,000 ر.س (4 عملاء)'
        },
        {
            input: 'كيف حال السيولة؟',
            reasoning: 'أفحص: 1) رصيد الحسابات البنكية 2) المتوقع دخوله خلال 7 أيام 3) المتوقع خروجه (رواتب + موردين) 4) الاتجاه العام',
            output: '💧 وضع السيولة:\n• الرصيد الحالي: 850K ر.س\n• متوقع دخوله (7 أيام): +120K من تحصيلات\n• متوقع خروجه: -340K (رواتب 25 الشهر)\n• ⚠️ تنبيه: السيولة ستنخفض لـ 630K — يُنصح بتسريع التحصيل'
        },
    ],

    'copilot.system': [
        {
            input: 'كم رصيد عميل ABC؟',
            output: 'رصيد عميل ABC الحالي هو 12,450 ر.س (3 فواتير مفتوحة). آخر دفعة كانت بتاريخ 2026-04-28 بمبلغ 5,000 ر.س.'
        },
        {
            input: 'أنشئ فاتورة مبيعات لعميل XYZ',
            output: 'تم إنشاء مسودة فاتورة #INV-2026-0891 لعميل XYZ:\n• المنتج: خدمات استشارية\n• المبلغ: 10,000 ر.س + 1,500 ضريبة\n• الإجمالي: 11,500 ر.س\nهل تريد ترحيلها أم تعديلها؟'
        },
    ],

    'fraud.detection': [
        {
            input: 'فاتورة بقيمة 500,000 ر.س من مورد جديد',
            reasoning: '1) مورد جديد = مخاطر عالية 2) المبلغ يتجاوز 100K = يتطلب موافقة مدير 3) لا يوجد أمر شراء مرتبط 4) تحقق من تاريخ التسجيل',
            output: '🚨 تنبيه مخاطر عالي:\n• مورد مسجل منذ 3 أيام فقط\n• لا يوجد PO مرتبط\n• المبلغ يتجاوز الحد (100K)\n• التوصية: إيقاف الدفع + مراجعة المدير المالي'
        },
    ],

    'ocr.invoice': [
        {
            input: 'استخرج بيانات هذه الفاتورة',
            output: '{"vendorName": "شركة التقنية", "vatNumber": "300012345600003", "invoiceNumber": "INV-2026-455", "invoiceDate": "2026-05-01", "subtotal": 15000, "vatAmount": 2250, "totalAmount": 17250, "currency": "SAR", "lineItems": [{"description": "خدمات تقنية", "quantity": 1, "unitPrice": 15000, "total": 15000}]}'
        },
    ],
};

/**
 * Get few-shot examples for a prompt template key.
 */
export function getFewShotExamples(promptKey: string): FewShotExample[] {
    return EXAMPLES[promptKey] || [];
}

/**
 * Format examples as prompt text for injection into system prompt.
 */
export function formatExamplesForPrompt(promptKey: string): string {
    const examples = getFewShotExamples(promptKey);
    if (examples.length === 0) return '';

    return '\n\nExamples:\n' + examples.map((ex, i) => {
        let block = `--- Example ${i + 1} ---\nUser: ${ex.input}\n`;
        if (ex.reasoning) block += `Thinking: ${ex.reasoning}\n`;
        block += `Assistant: ${ex.output}`;
        return block;
    }).join('\n\n');
}

/**
 * Get all available prompt keys with example counts.
 */
export function listExampleKeys(): { key: string; count: number }[] {
    return Object.entries(EXAMPLES).map(([key, examples]) => ({
        key,
        count: examples.length,
    }));
}
