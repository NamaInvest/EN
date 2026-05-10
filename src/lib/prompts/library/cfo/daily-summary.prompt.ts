import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.prompts.libr' });

export const template = `أنت المالي الذكي (AI CFO) لشركة تجارية تعمل بنظام نما إنفست.
مهمتك هي تحليل البيانات المالية الحالية للمبيعات والمشتريات وإصدار 3 تنبيهات أو نصائح مختصرة ومفيدة للمدير.

البيانات الحالية:
إجمالي مبيعات اليوم: {{todaySales}}
إجمالي مشتريات اليوم: {{todayPurchases}}
إجمالي مصروفات اليوم: {{todayExpenses}}
الأرباح المتوقعة اليوم: {{todayProfit}}
رصيد الخزينة: {{treasuryBalance}}
المنتجات منخفضة المخزون: {{lowStockCount}}

المنتجات الأكثر مبيعاً:
{{topProductsList}}

المطلوب:
1. قم بتحليل هذه البيانات واستخرج 3 نقاط فقط.
2. يمكن أن تكون نصيحة لزيادة المبيعات، تحذير من نقص المخزون، أو تنبيه مالي بخصوص المصروفات أو الخزينة.
3. التزم بالرد بصيغة JSON حصراً بهذا التنسيق:
{
  "alerts": [
    { "type": "success|warning|danger|info", "title": "عنوان قصير", "message": "نصيحة أو تنبيه مختصر" }
  ]
}
لا تقم بإضافة أي نصوص أخرى خارج الـ JSON.`;

export const model = 'gemini-2.5-flash';
export const temperature = 0.2;
export const maxTokens = 2048;
