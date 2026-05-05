import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    
    // Auth Check: usually validated via cron secret header
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow for local testing
        if (process.env.NODE_ENV !== 'development') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        // Just call the main GET calculation logic from ECL API
        // For cron, we fetch the data and then post the JE automatically.
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const eclRes = await fetch(`${baseUrl}/api/finance/ecl`);
        const eclData = await eclRes.json();

        if (!eclData.success) {
            throw new Error(eclData.error || 'Failed to calculate ECL');
        }

        const totalECL = eclData.data.portfolioECL.totalECL;

        // Post the Journal Entry
        const postRes = await fetch(`${baseUrl}/api/finance/ecl`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ totalECL })
        });

        const postData = await postRes.json();

        // Also create a System Alert / Audit Log
        await prisma.systemAlert.create({
            data: {
                userId: 1, // Fallback system admin ID
                title: 'ECL Monthly Cron Executed',
                message: `ECL calculation generated successfully. Total ECL: ${totalECL.toFixed(2)} SAR. ${postData.message || ''}`,
                alertType: 'INFO',
                read: false,
                createdAt: new Date()
            }
        });

        return NextResponse.json({ success: true, message: 'Monthly ECL cron executed successfully.', totalECL });
    } catch (error: any) {
        console.error('CRON ECL ERROR:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
