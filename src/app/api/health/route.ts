import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Test Database Connection
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = Date.now() - start;

        // In a real app, also test Redis cache, Queue (RabbitMQ/Bull), External APIs (ZATCA)
        
        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    status: 'up',
                    latency: `${dbLatency}ms`
                },
                redis: {
                    status: 'skipped', // placeholder
                    latency: 'N/A'
                },
                zatca_integration: {
                    status: 'skipped', // placeholder
                    latency: 'N/A'
                }
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        }, { status: 503 });
    }
}
