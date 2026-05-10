import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { sendMessage, getBotToken, getGeminiKey } from '@/lib/telegram-bot';
import { getPrompt, renderPrompt } from '@/lib/prompts/registry';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai-auditor' });

async function _GET(req: NextRequest) {

    const prisma = getPrisma(req);
    try {
        // Simple security check (in production, use standard CRON_SECRET)
        const secret = req.nextUrl.searchParams.get('secret');
        const expectedSecret = process.env.CRON_SECRET || 'nama2025cron';
        if (secret !== expectedSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch today's transactions
        const sales = await prisma.salesInvoice.findMany({
            take: 100,
            where: { date: { gte: today } },
            include: { details: true, customer: { select: { id: true, name: true, phone: true, taxNumber: true } } }
        });

        const purchases = await prisma.purchaseInvoice.findMany({
            take: 100,
            where: { date: { gte: today } },
            include: { details: true, supplier: { select: { id: true, name: true, phone: true, taxNumber: true } } }
        });

        const expenses = await prisma.expense.findMany({
            take: 100,
            where: { date: { gte: today } }
        });

        // Skip if no activity
        if (sales.length === 0 && purchases.length === 0 && expenses.length === 0) {
            return NextResponse.json({ message: 'No activity to audit today.' });
        }

        // Format data for AI
        const rawData: any = {
            date: today.toISOString().split('T')[0],
            salesCount: sales.length,
            totalSales: sales.reduce((sum: number, s: any) => sum + (s.total || 0), 0),
            salesItems: sales.flatMap((s: any) => (s.details || []).map((d: any) => ({
                product: d.productName,
                qty: d.quantity,
                sellPrice: d.price,
                total: d.total,
                invoiceNo: s.invoiceNo,
                customer: s.customer?.name
            }))),
            purchasesCount: purchases.length,
            totalPurchases: purchases.reduce((sum: number, p: any) => sum + (p.total || 0), 0),
            purchaseItems: purchases.flatMap((p: any) => (p.details || []).map((d: any) => ({
                product: d.productName,
                qty: d.quantity,
                buyPrice: d.price,
                invoiceNo: p.invoiceNo,
                supplier: p.supplier?.name
            }))),
            expensesTotal: expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0),
            expensesDetails: expenses.map((e: any) => ({ amount: e.amount, desc: e.description }))
        };

        const geminiKey = await getGeminiKey();
        if (!geminiKey) return NextResponse.json({ error: 'No Gemini Key' }, { status: 500 });
        
        // Find the admin user to get their Telegram Chat ID (assuming we saved the channel in settings or we broadcast to previous sender)
        // Since we don't have a fixed admin_chat_id setting in DB yet, we can ask the user to send the first message, 
        // but for now, we will notify whoever sent messages recently (or we can just fetch the last known chat_id from an admin log).
        // A better way is to save master_chat_id in Settings. Let's try to get it:
        const masterChatSetting = await prisma.setting.findUnique({ where: { key: 'master_telegram_chat_id' } });
        const masterChatId = masterChatSetting?.value;

        if (!masterChatId) {
            // If we don't know the master chat ID, just return the AI audit as JSON
            log.info('Master Chat ID not set. Skipping Telegram notification.');
        }

        const promptTemplate = await getPrompt('audit.daily_audit', null); // Cron job, no specific tenant, or global

        if (!promptTemplate?.userTemplate) {
            return NextResponse.json({ error: 'Prompt template not found' }, { status: 500 });
        }

        const prompt = renderPrompt(promptTemplate.userTemplate, {
            rawData: JSON.stringify(rawData, null, 2)
        });

        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.replace(/[\"\'\\]/g, '').trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2 }
            })
        });

        if (!aiRes.ok) return NextResponse.json({ error: 'Gemini API Failed' }, { status: 500 });
        const aiData = await aiRes.json();
        const report = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (masterChatId && report) {
            await sendMessage(Number(masterChatId), report);
        }

        return NextResponse.json({ success: true, ai_report: report });
    } catch (e: any) {
        log.error('AI Auditor Cron Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'AI' });
