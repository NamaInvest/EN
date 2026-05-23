'use client';
import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, Loader2, AlertTriangle, Building2 } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function InterCompanyPage() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/accounting/inter-company?view=summary')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ArrowRightLeft className="text-primary" /> Inter-Company Balances (Monitoring)
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : !data || data.error ? (
        <div className="card p-8 text-center text-red-500 border border-red-200 bg-red-50 rounded-xl shadow-sm">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <p>Failed to load IC balances. {data?.error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm">
              <div className="text-sm text-(--text-muted) mb-1">Total Receivable</div>
              <div className="text-3xl font-bold text-green-600" dir="ltr">{data.summary?.totalReceivable || 0}</div>
            </div>
            <div className="card p-6 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm">
              <div className="text-sm text-(--text-muted) mb-1">Total Payable</div>
              <div className="text-3xl font-bold text-red-600" dir="ltr">{data.summary?.totalPayable || 0}</div>
            </div>
            <div className="card p-6 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm">
              <div className="text-sm text-(--text-muted) mb-1">{_t('Net الرصيد', 'Net Balance')}</div>
              <div className="text-3xl font-bold text-blue-600" dir="ltr">{data.summary?.netBalance || 0}</div>
            </div>
          </div>

          <div className="card p-6 border border-(--border) bg-(--bg-primary) rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Building2 className="text-gray-500" size={20} /> Counterparty Details
            </h2>
            {data.balances?.length === 0 ? (
              <p className="text-(--text-muted) text-center p-4">No active inter-company transactions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" dir="ltr">
                  <thead className="bg-(--bg-secondary) border-b border-(--border)">
                    <tr>
                      <th className="p-3 font-semibold text-sm">Counterparty Tenant</th>
                      <th className="p-3 font-semibold text-sm">Receivable</th>
                      <th className="p-3 font-semibold text-sm">Payable</th>
                      <th className="p-3 font-semibold text-sm">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.balances.map((b: any, i: number) => (
                      <tr key={i} className="border-b border-(--border) hover:bg-(--bg-secondary) transition-colors">
                        <td className="p-3 font-medium">{b.counterparty}</td>
                        <td className="p-3 text-green-600 font-mono">{b.receivable}</td>
                        <td className="p-3 text-red-600 font-mono">{b.payable}</td>
                        <td className="p-3 font-bold font-mono">{b.net}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
