'use client';
import React, { useEffect, useState } from 'react';
import { Target, Loader2, AlertTriangle, TrendingUp } from 'lucide-react';

export default function SalesCoachPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/sales-coach', { method: 'POST', body: JSON.stringify({}) })
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
        <Target className="text-primary" /> AI Sales Coach
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : !data || data.error ? (
        <div className="card p-8 text-center text-red-500 border border-red-200 bg-red-50 rounded-xl shadow-sm">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <p>Could not load sales performance. Check if you have sales data in the last 30 days.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-5 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm text-center">
              <div className="text-sm text-gray-500 mb-1">Coach Score</div>
              <div className="text-3xl font-bold text-blue-600">{data.score}/100</div>
            </div>
            <div className="card p-5 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm text-center">
              <div className="text-sm text-gray-500 mb-1">Total Sales ({data.period})</div>
              <div className="text-2xl font-bold">{data.performance?.totalSales || 0}</div>
            </div>
            <div className="card p-5 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm text-center">
              <div className="text-sm text-gray-500 mb-1">Total Invoices</div>
              <div className="text-2xl font-bold">{data.performance?.totalInvoices || 0}</div>
            </div>
            <div className="card p-5 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm text-center">
              <div className="text-sm text-gray-500 mb-1">Credit Ratio</div>
              <div className="text-2xl font-bold text-orange-500">{data.performance?.creditRatio || 0}%</div>
            </div>
          </div>
          
          <div className="card p-6 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-500" size={20} /> AI Recommendations
            </h2>
            <ul className="space-y-3">
              {data.recommendations?.map((r: string, i: number) => (
                <li key={i} className="p-4 bg-(--bg-primary) rounded-lg border border-(--border) shadow-sm text-(--text)">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
