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
        <div className="card p-6 border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="text-blue-500" size={20} /> Spend Analytics Cube
          </h2>
          
          <div className="overflow-hidden border border-(--border) rounded-xl bg-(--bg-primary)">
            <table className="min-w-full divide-y divide-(--border)">
              <thead className="bg-(--bg-secondary)">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transactions Count</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Visual Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border) text-(--text)">
                {(data.cube || []).map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-(--bg-secondary)/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono">Category #{item.categoryId}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">{item.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 max-w-xs">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, item.count * 10)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
                {(data.cube || []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No spend classifications found. Add transactions to see analytics.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
