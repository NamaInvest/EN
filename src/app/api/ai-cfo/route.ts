import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const user = getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { metrics } = body;

        if (!metrics) {
            return NextResponse.json({ error: 'Metrics data is required' }, { status: 400 });
        }

        // Fetch Gemini API Key
        const setting = await prisma.setting.findUnique({ where: { key: 'gemini_api_key' } });
        const geminiKey = setting?.value;

        if (!geminiKey) {
            return NextResponse.json({ 
                alerts: [{ type: 'info', title: 'الذكاء الاصطناعي غير مفعل', message: 'يرجى إضافة مفتاح Gemini API في الإعدادات لتفعيل التحليلات الذكية.' }] 
            });
        }

        const promptText = `
أنت المالي الذكي (AI CFO) لشركة تجارية تعمل بنظام نما إنفست.
مهمتك هي تحليل البيانات المالية الحالية للمبيعات والمشتريات وإصدار 3 تنبيهات أو نصائح مختصرة ومفيدة للمدير.

البيانات الحالية:
إجمالي مبيعات اليوم: ${metrics.todaySales}
إجمالي مشتريات اليوم: ${metrics.todayPurchases}
إجمالي مصروفات اليوم: ${metrics.todayExpenses}
الأرباح المتوقعة اليوم: ${metrics.todayProfit}
رصيد الخزينة: ${metrics.treasuryBalance}
المنتجات منخفضة المخزون: ${metrics.lowStockCount}

المنتجات الأكثر مبيعاً:
${metrics.topProducts?.map((p: any) => `- ${p.name}: ${p.quantity} وحدة`).join('\n') || 'لا يوجد بيانات'}

المطلوب:
1. قم بتحليل هذه البيانات واستخرج 3 نقاط فقط.
2. يمكن أن تكون نصيحة لزيادة المبيعات، تحذير من نقص المخزون، أو تنبيه مالي بخصوص المصروفات أو الخزينة.
3. التزم بالرد بصيغة JSON حصراً بهذا التنسيق:
{
  "alerts": [
    { "type": "success|warning|danger|info", "title": "عنوان قصير", "message": "نصيحة أو تنبيه مختصر" }
  ]
}
لا تقم بإضافة أي نصوص أخرى خارج الـ JSON.
`;

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.replace(/[\"\'\\]/g, '').trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.2 }
            })
        });

        if (!aiRes.ok) {
            console.error('Gemini API Error:', await aiRes.text());
            return NextResponse.json({ error: 'Failed to fetch AI insights' }, { status: 500 });
        }

        const aiData = await aiRes.json();
        let text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Clean markdown JSON formatting if present
        text = text.replace(/^\\s*\`\`\`json/i, '').replace(/\`\`\`\\s*$/i, '').trim();
        
        try {
            const parsed = JSON.parse(text);
            return NextResponse.json(parsed);
        } catch (parseError) {
            console.error('Failed to parse Gemini JSON:', text);
            return NextResponse.json({ 
                alerts: [{ type: 'info', title: 'ملاحظة', message: 'لم يتمكن الذكاء الاصطناعي من توليد نصائح بالصيغة المطلوبة.' }] 
            });
        }
    } catch (err: any) {
        console.error('AI CFO Route Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
