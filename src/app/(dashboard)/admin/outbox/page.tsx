'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from "@/lib/i18n";

type OldestPendingEvent = {
  id: number;
  createdAt: string;
  eventType: string;
};

type OutboxDiagnostics = {
  pendingCount: number;
  processingCount: number;
  processedCount: number;
  failedCount: number;
  oldestPendingEvent: OldestPendingEvent | null;
  exceededRetryLimitCount: number;
};

type DiagnosticsResponse = {
  ok: boolean;
  tenantAware: boolean;
  tenant: string;
  fetchedAt: string;
  diagnostics: OutboxDiagnostics;
  error?: string;
};

type Tone = 'sky' | 'amber' | 'emerald' | 'rose';

const toneClasses: Record<Tone, string> = {
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rose: 'border-rose-200 bg-rose-50 text-rose-800',
};

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AdminOutboxDiagnosticsPage() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [data, setData] = useState<DiagnosticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/outbox/diagnostics', { cache: 'no-store' });
      const body = (await response.json()) as DiagnosticsResponse;

      if (!response.ok || !body.ok) {
        throw new Error(body.error || `Request failed with ${response.status}`);
      }

      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load outbox diagnostics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDiagnostics();
  }, [loadDiagnostics]);

  const diagnostics = data?.diagnostics;
  const totalEvents = useMemo(() => {
    if (!diagnostics) return 0;
    return diagnostics.pendingCount + diagnostics.processingCount + diagnostics.processedCount + diagnostics.failedCount;
  }, [diagnostics]);

  const health = useMemo(() => {
    if (!diagnostics) return { label: 'Loading', tone: 'sky' as Tone };
    if (diagnostics.exceededRetryLimitCount > 0 || diagnostics.failedCount > 0) {
      return { label: 'Attention', tone: 'rose' as Tone };
    }
    if (diagnostics.processingCount > 0 || diagnostics.pendingCount > 0) {
      return { label: 'Active', tone: 'amber' as Tone };
    }
    return { label: 'Healthy', tone: 'emerald' as Tone };
  }, [diagnostics]);

  const statusCards = [
    { label: 'Pending', value: diagnostics?.pendingCount ?? 0, tone: 'amber' as Tone, icon: Clock3 },
    { label: 'Processing', value: diagnostics?.processingCount ?? 0, tone: 'sky' as Tone, icon: Activity },
    { label: 'Processed', value: diagnostics?.processedCount ?? 0, tone: 'emerald' as Tone, icon: CheckCircle2 },
    { label: 'Failed', value: diagnostics?.failedCount ?? 0, tone: 'rose' as Tone, icon: AlertTriangle },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6" dir="ltr">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-gray-950">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
            Outbox Diagnostics
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span>Tenant: {data?.tenant ?? '-'}</span>
            <span className="text-gray-300">|</span>
            <span>Last fetched: {formatDate(data?.fetchedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`rounded-md border px-3 py-2 text-sm font-medium ${toneClasses[health.tone]}`}>
            {health.label}
          </span>
          <Button type="button" variant="outline" onClick={() => void loadDiagnostics()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {_t('تحديث', 'Refresh')}</Button>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="rounded-md border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">{item.label}</p>
                  <span className={`rounded-md border p-2 ${toneClasses[item.tone]}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold tabular-nums text-gray-950">
                  {item.value.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-md border-gray-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Oldest Pending Event</CardTitle>
          </CardHeader>
          <CardContent>
            {diagnostics?.oldestPendingEvent ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">{_t('المعرف', 'ID')}</th>
                      <th className="px-4 py-3 font-medium">{_t('حدث النوع', 'Event Type')}</th>
                      <th className="px-4 py-3 font-medium">{_t('تم الإنشاء في', 'Created At')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-3 font-mono text-xs">{diagnostics.oldestPendingEvent.id}</td>
                      <td className="px-4 py-3 font-medium">{diagnostics.oldestPendingEvent.eventType}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(diagnostics.oldestPendingEvent.createdAt)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-6 text-center text-sm font-medium text-emerald-800">
                {_t('لا قيد الانتظار أحداث', 'No pending events')}</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Retry Limit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm text-gray-600">Exceeded retry limit</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-gray-950">
                {(diagnostics?.exceededRetryLimitCount ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="border-t pt-5">
              <p className="text-sm text-gray-600">{_t('الإجمالي أحداث in نطاق', 'Total events in scope')}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-gray-950">
                {totalEvents.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
