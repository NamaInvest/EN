'use client';
import React, { useEffect, useState } from 'react';
import { Calculator, Loader2, AlertTriangle, MonitorPlay } from 'lucide-react';

export default function POSAccountantPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pos/accountant')
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
        <Calculator className="text-primary" /> POS Sessions Monitor
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : !data || data.error ? (
        <div className="card p-8 text-center text-red-500 border border-red-200 bg-red-50 rounded-xl shadow-sm">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <p>Failed to load POS sessions. {data?.error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="card p-8 text-center border border-[var(--border)] bg-[var(--bg-secondary)] rounded-xl shadow-sm">
          <MonitorPlay className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-[var(--text-muted)]">No POS sessions found for this tenant.</p>
        </div>
      ) : (
        <div className="overflow-x-auto card border border-[var(--border)] rounded-xl shadow-sm">
          <table className="w-full text-left border-collapse" dir="ltr">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <tr>
                <th className="p-4 font-semibold text-sm">Session ID</th>
                <th className="p-4 font-semibold text-sm">User</th>
                <th className="p-4 font-semibold text-sm">Opened At</th>
                <th className="p-4 font-semibold text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s: any, i: number) => (
                <tr key={i} className="border-b border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="p-4 font-mono">{s.id}</td>
                  <td className="p-4 font-medium">{s.user?.name || 'Unknown'}</td>
                  <td className="p-4 text-sm text-[var(--text-muted)]">{new Date(s.openedAt).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${s.closedAt ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                      {s.closedAt ? 'Closed' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
