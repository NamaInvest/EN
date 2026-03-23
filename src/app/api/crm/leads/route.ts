import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const lead = await prisma.lead.create({
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || 'Direct',
        status: data.status || 'NEW',
        expectedRevenue: parseFloat(data.expectedRevenue || 0),
        probability: parseInt(data.probability || 10),
      }
    });
    return NextResponse.json(lead);
  } catch (error) {
    console.error("Lead Creation Error:", error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
