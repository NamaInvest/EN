import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 1. Gather live contextual metrics from the ERP Database to feed the AI
    const salesCount = await prisma.salesInvoice.count();
    const activeLeases = await prisma.leaseContract.count({ where: { status: 'ACTIVE' } });
    const expiredLeases = await prisma.leaseContract.count({ where: { status: 'EXPIRED' } });
    const activeTrips = await prisma.fleetTrip.count({ where: { status: 'IN_PROGRESS' } });
    const totalEmployees = await prisma.employee.count({ where: { active: true } });
    const totalStudents = await prisma.student.count({ where: { status: 'ENROLLED' } });
    const totalVehicles = await prisma.vehicle.count();

    // Summing today's sales (simplified for POC)
    const today = new Date();
    today.setHours(0,0,0,0);
    const todaySales = await prisma.salesInvoice.aggregate({
      where: { date: { gte: today } },
      _sum: { total: true }
    });

    const systemContext = `
      You are 'المستشار التنفيذي الذكي نظام نما (Nama AI CFO)', an expert AI Operations Manager and CFO embedded inside the Nama Invest ERP system.
      Always answer in Arabic in a highly professional, constructive, and business-focused tone. Do not use markdown backticks unless strictly necessary. Give insights, actionable advice, and highlight risks.
      
      Here is the LIVE real-time snapshot of the company's Database Operations:
      - Total Invoices Generated Globally: ${salesCount}
      - Today's Sales Revenue (SAR): Mismatched calculation / or ${todaySales._sum?.total || 0}
      - Real Estate: ${activeLeases} Active Leases, ${expiredLeases} Expired (Needs Renewal Follow-up!).
      - Supply Chain & Fleet: ${totalVehicles} Vehicles in fleet. ${activeTrips} Trips currently active on the road.
      - HR: ${totalEmployees} active employees currently drawing salaries.
      - Schools: ${totalStudents} students currently enrolled.

      Your objective is to answer the CEO's prompt based on this context. Be insightful!
    `;

    const result = await model.generateContent([
      { text: systemContext },
      { text: `CEO Prompt: ${prompt}` }
    ]);
    const responseText = result.response.text();

    // 2. Also return the raw metrics for the React frontend to chart them!
    return NextResponse.json({ 
        answer: responseText, 
        metrics: { salesCount, todaySales: todaySales._sum?.total || 0, activeLeases, expiredLeases, activeTrips, totalEmployees, totalStudents } 
    });
  } catch (error: any) {
    console.error('AI CFO Error:', error);
    return NextResponse.json({ error: 'Failed to communicate with AI Engine' }, { status: 500 });
  }
}
