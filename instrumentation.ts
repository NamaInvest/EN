/**
 * Next.js Instrumentation Hook
 * يُشغَّل قبل بداية الـ server — هنا نُسجّل interceptor لكل HTTP request
 * لحقن الـ tenant في AsyncLocalStorage قبل وصول الطلب للـ API handlers
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { tenantContext } = await import('./src/lib/prisma');
        // لا نحتاج أي setup إضافي — الـ tenantContext موجود
        // الـ interceptor يتم عبر الـ API route نفسه أو الـ middleware
        console.log('[Instrumentation] Tenant context initialized');

        // Start Background Task Workers
        try {
            const { startWorkers } = await import('./src/lib/queue');
            startWorkers();
        } catch (err) {
            console.error('[Instrumentation] Failed to start background workers:', err);
        }
    }
}

/**
 * onRequestError hook — يلتقط أخطاء الـ requests
 */
export async function onRequestError(
    err: unknown,
    request: { path: string; headers: Record<string, string> },
    context: { routerKind: string; routeType: string }
) {
    // silent — لا نريد أي side effects
}
