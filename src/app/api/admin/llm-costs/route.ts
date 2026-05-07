import { NextResponse } from 'next/server';
import { getPrisma, resolveTenant } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

/**
 * AI Cost Dashboard data.
 *
 * Query params:
 *   - days  (1..90, default 30) — window for time-series + aggregates.
 *
 * Returns:
 *   - stats         : totals across the whole window
 *   - byPromptKey   : top-10 prompts by token consumption
 *   - byModel       : breakdown per model (gemini-2.5-flash, gpt-4o-mini, ...)
 *   - byDay         : time-series (last `days` calendar days, missing days = 0)
 *   - logs          : 100 most-recent rows for the table view
 */
export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = resolveTenant(request as any);
        const url = new URL(request.url);
        const daysParam = Number(url.searchParams.get('days') ?? 30);
        const days = Math.min(Math.max(Number.isFinite(daysParam) ? daysParam : 30, 1), 90);

        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const where = { tenantId, createdAt: { gte: since } };

        // ─── Aggregate totals ───────────────────────────────────────────
        const [aggregates, successCount, errorCount] = await Promise.all([
            prisma.promptUsageLog.aggregate({
                where,
                _sum: { promptTokens: true, completionTokens: true, costUsd: true },
                _avg: { latencyMs: true },
                _count: { id: true },
            }),
            prisma.promptUsageLog.count({ where: { ...where, success: true } }),
            prisma.promptUsageLog.count({ where: { ...where, success: false } }),
        ]);

        // ─── Top-10 prompt keys by token spend ──────────────────────────
        const promptGroups = await prisma.promptUsageLog.groupBy({
            by: ['promptKey'],
            where,
            _count: { id: true },
            _sum: { promptTokens: true, completionTokens: true, costUsd: true },
            _avg: { latencyMs: true },
            orderBy: { _sum: { promptTokens: 'desc' } },
            take: 10,
        });

        const byPromptKey = promptGroups.map((g) => ({
            promptKey: g.promptKey,
            calls: g._count.id,
            promptTokens: g._sum.promptTokens ?? 0,
            completionTokens: g._sum.completionTokens ?? 0,
            totalTokens: (g._sum.promptTokens ?? 0) + (g._sum.completionTokens ?? 0),
            costUsd: Number(g._sum.costUsd ?? 0),
            avgLatencyMs: Math.round(g._avg.latencyMs ?? 0),
        }));

        // ─── Per-model breakdown ────────────────────────────────────────
        const modelGroups = await prisma.promptUsageLog.groupBy({
            by: ['model'],
            where,
            _count: { id: true },
            _sum: { promptTokens: true, completionTokens: true, costUsd: true },
            orderBy: { _sum: { promptTokens: 'desc' } },
        });

        const byModel = modelGroups.map((g) => ({
            model: g.model,
            calls: g._count.id,
            promptTokens: g._sum.promptTokens ?? 0,
            completionTokens: g._sum.completionTokens ?? 0,
            totalTokens: (g._sum.promptTokens ?? 0) + (g._sum.completionTokens ?? 0),
            costUsd: Number(g._sum.costUsd ?? 0),
        }));

        // ─── Daily time-series (zero-filled) ────────────────────────────
        const rawDailyRows = await prisma.promptUsageLog.findMany({
            take: 100,
            where,
            select: { createdAt: true, promptTokens: true, completionTokens: true, costUsd: true, success: true },
        });

        const dayBuckets = new Map<string, { calls: number; tokens: number; costUsd: number; errors: number }>();
        // Pre-fill calendar days so the chart has an even x-axis.
        for (let i = 0; i < days; i++) {
            const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().slice(0, 10);
            dayBuckets.set(key, { calls: 0, tokens: 0, costUsd: 0, errors: 0 });
        }
        for (const row of rawDailyRows) {
            const key = row.createdAt.toISOString().slice(0, 10);
            const b = dayBuckets.get(key);
            if (!b) continue;
            b.calls += 1;
            b.tokens += (row.promptTokens ?? 0) + (row.completionTokens ?? 0);
            b.costUsd += Number(row.costUsd ?? 0);
            if (!row.success) b.errors += 1;
        }
        const byDay = [...dayBuckets.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, v]) => ({ day, ...v }));

        // ─── Recent logs for the table ──────────────────────────────────
        const logs = await prisma.promptUsageLog.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        const totalCalls = aggregates._count.id;
        return NextResponse.json({
            window: { days, since: since.toISOString() },
            stats: {
                totalRequests: totalCalls,
                totalTokens: (aggregates._sum.promptTokens ?? 0) + (aggregates._sum.completionTokens ?? 0),
                promptTokens: aggregates._sum.promptTokens ?? 0,
                completionTokens: aggregates._sum.completionTokens ?? 0,
                totalCostUsd: Number(aggregates._sum.costUsd ?? 0),
                avgLatency: Math.round(aggregates._avg.latencyMs ?? 0),
                successCount,
                errorCount,
                successRate: totalCalls > 0 ? Math.round((successCount / totalCalls) * 100) : 100,
            },
            byPromptKey,
            byModel,
            byDay,
            logs,
        });
    } catch (e) {
        console.error('[llm-costs] route error:', e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
