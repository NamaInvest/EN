'use client';

import { useState, useEffect } from 'react';

export default function SerialNumbersPage() {
  const [serials, setSerials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/inv/serials')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSerials(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📦 Inventory - Serial Numbers</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + Init Serial Number
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading tracking data...</div>
        ) : serials.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No individual scanned items found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">Serial Number (SN)</th>
                <th className="p-4 font-semibold">Product Name</th>
                <th className="p-4 font-semibold">Warehouse</th>
                <th className="p-4 font-semibold">Item Status</th>
                <th className="p-4 font-semibold">Reg. Date</th>
              </tr>
            </thead>
            <tbody>
              {serials.map((sn, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-mono font-bold text-slate-800 tracking-wider font-medium">{sn.serialNumber}</td>
                  <td className="p-4 text-slate-700">{sn.product?.name || 'Unknown Item'}</td>
                  <td className="p-4 text-slate-600">{sn.stock?.name || 'Main Warehouse'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      sn.status === 'IN_STOCK' ? 'bg-green-100 text-green-700' : 
                      sn.status === 'SOLD' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                    }`}>
                      {sn.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">{new Date(sn.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
