import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { redactPII, maskEntityNames } from '@/lib/privacy-filter';
import { getPrompt, renderPrompt } from '@/lib/prompts/registry';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai-cfo' });

const _POSTSchema = z.object({
  metrics: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const user = getUserFromRequest(req as any);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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

        // Apply Privacy Filter to prevent PII leakage
        const safeProducts = metrics.topProducts ? maskEntityNames(metrics.topProducts, 'name') : [];

        const topProductsList = safeProducts.map((p: any) => `- ${p.name}: ${p.quantity} وحدة`).join('\n') || 'لا يوجد بيانات';
        
        const promptTemplate = await getPrompt('cfo.daily_summary', user.tenantId);
        
        if (!promptTemplate?.userTemplate) {
            return NextResponse.json({ error: 'Prompt template not found' }, { status: 500 });
        }

        let promptText = renderPrompt(promptTemplate.userTemplate, {
            todaySales: metrics.todaySales,
            todayPurchases: metrics.todayPurchases,
            todayExpenses: metrics.todayExpenses,
            todayProfit: metrics.todayProfit,
            treasuryBalance: metrics.treasuryBalance,
            lowStockCount: metrics.lowStockCount,
            topProductsList: topProductsList
        });

        promptText = redactPII(promptText);

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.replace(/[\"\'\\]/g, '').trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.2 }
            })
        });

        if (!aiRes.ok) {
            log.error('Gemini API Error:', await aiRes.text());
            return NextResponse.json({ error: 'Failed to fetch AI insights' }, { status: 500 });
        }

        const aiData = await aiRes.json();
        let text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Clean markdown JSON formatting if present
        text = text.replace(/^\\s*\`\`\`json/i, '').replace(/\`\`\`\\s*$/i, '').trim();
        
        try {
            const parsed = JSON.parse(text);
            return NextResponse.json(parsed);
        } catch (parseError: unknown) {
            log.error('Failed to parse Gemini JSON:', text);
            return NextResponse.json({ 
                alerts: [{ type: 'info', title: 'ملاحظة', message: 'لم يتمكن الذكاء الاصطناعي من توليد نصائح بالصيغة المطلوبة.' }] 
            });
        }
    } catch (err: any) {
        log.error('AI CFO Route Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AI' });
