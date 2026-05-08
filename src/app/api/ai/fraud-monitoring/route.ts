import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ success: false, error: ' ' }, { status: 401 });

        const allowed = await hasPermission(auth.userId, 'view_fraud_ai', prisma);
        // Fallback: If not explicitly allowed, at least let admin access it
        if (!allowed && auth.role !== 'admin') {
            return NextResponse.json({ success: false, error: '     ' }, { status: 403 });
        }

        // 1. Fetch Suspicious Data Points
        // - Deleted Invoices
        const deletedAudits = await prisma.auditLog.findMany({
            where: { action: 'DELETE_SALES_INVOICE' },
            include: { user: { select: { fullName: true, username: true } } },
            orderBy: { date: 'desc' },
            take: 50
        });

        // - Extremely High Discounts (>20%)
        const highDiscounts = await prisma.salesInvoice.findMany({
            where: { discountRate: { gt: 20 } },
            include: { user: { select: { fullName: true } } },
            orderBy: { date: 'desc' },
            take: 20
        });

        // - After-hours operations (Assuming normal hours 08:00 to 23:00)
        // For MVP, we'll just pull recent treasury OUT ops with no descriptions
        const suspiciousTreasury = await prisma.treasury.findMany({
            where: {
                type: 'out',
                OR: [
                    { description: '' },
                    { description: null },
                    { amount: { gt: 5000 } }
                ]
            },
            include: { user: { select: { fullName: true } } },
            orderBy: { date: 'desc' },
            take: 20
        });

        // 2. Prepare context for Gemini
        const contextData = {
            deleted_invoices_by_staff: deletedAudits.map(a => ({
                employee: a.user?.fullName || ' ',
                actionDate: a.date,
                details: a.details
            })),
            unusual_high_discounts: highDiscounts.map(d => ({
                employee: d.user?.fullName || ' ',
                discountRatio: d.discountRate,
                invoiceTotal: d.total,
                date: d.date
            })),
            suspicious_cash_withdrawals: suspiciousTreasury.map(t => ({
                employee: t.user?.fullName || ' ',
                amount: t.amount,
                reason: t.description || ' ',
                date: t.date
            }))
        };

        // 3. Ask AI to analyze
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
             return NextResponse.json({ success: false, error: '     (GEMINI_API_KEY)' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
            (AI Fraud Detector)       (NAMA INVEST).
                    ȡ        (  )      .
        
          :
        ${JSON.stringify(contextData, null, 2)}

        :
            JSON ء    Markdown (   \`\`\`json)      (Interface):
        {
           "securityScore": number, //  0  100 (100    0   )
           "status": "Safe" | "Warning" | "Critical",
           "alerts": [
               {
                   "severity": "low" | "medium" | "high",
                   "title": " ",
                   "description": "       "
               }
           ],
           "recommendation": "     "
        }
        `;

        const result = await model.generateContent(prompt);
        let aiText = result.response.text().trim();
        if (aiText.startsWith('```json')) {
             aiText = aiText.substring(7);
        }
        if (aiText.endsWith('```')) {
             aiText = aiText.substring(0, aiText.length - 3);
        }

        const parsedInsights = JSON.parse(aiText);

        return NextResponse.json({ success: true, insights: parsedInsights });

    } catch (error: any) {
        console.error('Fraud AI Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
