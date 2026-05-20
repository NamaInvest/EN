'use client';
import React, { useEffect, useState } from 'react';
import { LineChart, Loader2, AlertTriangle, Wallet } from 'lucide-react';

export default function CashForecastPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/treasury/cash-forecast')
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
        <LineChart className="text-primary" /> Cash Forecast (Read-only)
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : !data || data.error ? (
        <div className="card p-8 text-center text-red-500 border border-red-200 bg-red-50 rounded-xl shadow-sm">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <p>Failed to load forecast data. {data?.error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="card p-8 text-center border border-[var(--border)] bg-[var(--bg-secondary)] rounded-xl shadow-sm">
          <Wallet className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-[var(--text-muted)]">No cash forecasts generated for this tenant yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((f: any, i: number) => (
            <div key={i} className="card p-5 border border-[var(--border)] bg-[var(--bg-secondary)] rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-2 text-[var(--text)]">Forecast Date: <span dir="ltr">{new Date(f.forecastDate).toLocaleDateString()}</span></h3>
              <div className="text-sm text-[var(--text-muted)] mb-4">Period: {f.period}</div>
              <div className="flex justify-between items-center text-sm border-t border-[var(--border)] pt-3">
                <span>Net Position:</span>
                <span className={`font-bold ${f.netPosition >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                  {f.netPosition?.toLocaleString() || 0} {f.currency || 'SAR'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
