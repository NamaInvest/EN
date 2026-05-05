import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const leads = await prisma.lead.findMany({
            orderBy: { expectedRevenue: 'desc' }
        });
        
        // Calculate scoring dynamically if we want, or rely on a score field.
        // For simplicity, we can calculate score here based on completeness or expectedRevenue.
        const scoredLeads = leads.map((lead: any) => {
            let score = 0;
            if (lead.email) score += 10;
            if (lead.phone) score += 10;
            if (lead.expectedRevenue > 50000) score += 20;
            if (lead.expectedRevenue > 100000) score += 30;
            if (lead.industry === 'Technology' || lead.industry === 'Finance') score += 15;
            
            return { ...lead, score };
        });

        return NextResponse.json({ success: true, data: scoredLeads });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();
        const { action, payload } = body;

        if (action === 'CREATE') {
            const newLead = await prisma.lead.create({
                data: {
                    companyName: payload.companyName,
                    contactPerson: payload.contactPerson,
                    email: payload.email,
                    phone: payload.phone,
                    source: payload.source || 'Website',
                    industry: payload.industry,
                    expectedRevenue: Number(payload.expectedRevenue) || 0,
                    status: 'NEW'
                }
            });
            return NextResponse.json({ success: true, data: newLead });
        }

        if (action === 'UPDATE_STATUS') {
            const updated = await prisma.lead.update({
                where: { id: Number(payload.leadId) },
                data: { status: payload.status }
            });
            return NextResponse.json({ success: true, data: updated });
        }

        if (action === 'CONVERT_TO_OPPORTUNITY') {
            // This would normally create a Customer and an Opportunity.
            // For now, we just update status to CONVERTED
            const updated = await prisma.lead.update({
                where: { id: Number(payload.leadId) },
                data: { status: 'CONVERTED' }
            });
            return NextResponse.json({ success: true, data: updated });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
