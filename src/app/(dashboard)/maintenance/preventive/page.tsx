'use client';
import React, { useEffect, useState } from 'react';
import { Wrench, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function PreventiveMaintenancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/maintenance/preventive')
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
        <Wrench className="text-primary" /> Preventive Maintenance (Due Assets)
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : !data || data.error ? (
        <div className="card p-8 text-center text-red-500 border border-red-200 bg-red-50 rounded-xl shadow-sm">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <p>Failed to load maintenance data. {data?.error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="card p-8 text-center border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
          <p className="text-(--text-muted)">All assets are up to date. No preventive maintenance due.</p>
        </div>
      ) : (
        <div className="overflow-x-auto card border border-(--border) rounded-xl shadow-sm">
          <table className="w-full text-left border-collapse" dir="ltr">
            <thead className="bg-(--bg-secondary) border-b border-(--border)">
              <tr>
                <th className="p-4 font-semibold text-sm">Asset ID</th>
                <th className="p-4 font-semibold text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((asset: any, i: number) => (
                <tr key={i} className="border-b border-(--border) bg-(--bg-primary)">
                  <td className="p-4 font-mono">{asset.id || asset.assetId || 'Unknown'}</td>
                  <td className="p-4">
                    <span className="text-red-500 font-medium">Due Now</span>
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
