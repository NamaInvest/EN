'use client';
import React, { useEffect, useState } from 'react';
import { PieChart, Loader2, AlertTriangle, Layers } from 'lucide-react';

export default function SpendAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/procurement/spend-analytics')
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
        <PieChart className="text-primary" /> Spend Analytics
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : !data || data.error ? (
        <div className="card p-8 text-center text-red-500 border border-red-200 bg-red-50 rounded-xl shadow-sm">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <p>No spend analytics data available. Missing tenant or data.</p>
        </div>
      ) : (
        <div className="card p-6 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Layers className="text-blue-500" size={20} /> Analytics Cube
          </h2>
          <div className="bg-(--bg-primary) p-4 rounded-lg border border-(--border)">
            <pre className="overflow-auto text-sm text-(--text-muted)" dir="ltr" style={{ maxHeight: '500px' }}>
              {JSON.stringify(data.cube || data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
