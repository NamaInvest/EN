import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || '2026';
        
        // Mock data since we might not have Opportunity models yet
        const forecast = [
            { month: 'Jan', won: 120000, lost: 30000, inProgress: 80000, pipeline: 200000 },
            { month: 'Feb', won: 140000, lost: 25000, inProgress: 90000, pipeline: 230000 },
            { month: 'Mar', won: 110000, lost: 40000, inProgress: 110000, pipeline: 220000 },
            { month: 'Apr', won: 150000, lost: 20000, inProgress: 150000, pipeline: 300000 },
            { month: 'May', won: 180000, lost: 15000, inProgress: 180000, pipeline: 360000 },
            { month: 'Jun', won: 200000, lost: 10000, inProgress: 210000, pipeline: 410000 },
        ];

        return NextResponse.json({ period, data: forecast });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
