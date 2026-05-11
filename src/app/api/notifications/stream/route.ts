import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { notifications } from '@/lib/notifications';

const log = logger.child({ module: 'sse-notifications' });

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    log.info(`Client connected to SSE stream: User ${userId}`);

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            
            // Send initial connection success event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`));

            // Setup a polling mechanism to check for new notifications in the queue
            // A more advanced implementation would use Redis Pub/Sub, but this works for single instance
            const interval = setInterval(async () => {
                try {
                    // We only want to send notifications targeted to this user
                    // In a real DB-backed scenario, we would query the database here
                    // Since notifications.ts stores them in memory queue, we poll the pending count
                    const pending = notifications.getPending();
                    if (pending > 0) {
                        // Mocking the real-time push for any pending notification
                        // In reality, the queue would be processed and saved to DB
                        // We will simulate a ping event to keep connection alive
                    }

                    // Keep-alive ping
                    controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
                } catch (err) {
                    log.error('Error in SSE interval', { error: (err as Error).message });
                }
            }, 5000); // Poll every 5s

            // Cleanup on close
            request.signal.addEventListener('abort', () => {
                log.info(`Client disconnected from SSE stream: User ${userId}`);
                clearInterval(interval);
                controller.close();
            });
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
