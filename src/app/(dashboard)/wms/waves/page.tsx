'use client';
import React, { useEffect, useState } from 'react';
import { Layers, Loader2, AlertTriangle, Search } from 'lucide-react';

export default function WMSWavesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wms/waves')
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
        <Layers className="text-primary" /> WMS Waves Monitor
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : !data || data.error ? (
        <div className="card p-8 text-center text-red-500 border border-red-200 bg-red-50 rounded-xl shadow-sm">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <p>Failed to load WMS waves. {data?.error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="card p-8 text-center border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm">
          <Search className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-(--text-muted)">No active picking waves found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto card border border-(--border) rounded-xl shadow-sm">
          <table className="w-full text-left border-collapse" dir="ltr">
            <thead className="bg-(--bg-secondary) border-b border-(--border)">
              <tr>
                <th className="p-4 font-semibold text-sm">Wave ID</th>
                <th className="p-4 font-semibold text-sm">Warehouse</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm">Tasks</th>
              </tr>
            </thead>
            <tbody>
              {data.map((wave: any, i: number) => (
                <tr key={i} className="border-b border-(--border) bg-(--bg-primary) hover:bg-(--bg-secondary) transition-colors">
                  <td className="p-4 font-mono">{wave.id}</td>
                  <td className="p-4">{wave.warehouseId}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{wave.status}</span>
                  </td>
                  <td className="p-4">{wave.tasks?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
