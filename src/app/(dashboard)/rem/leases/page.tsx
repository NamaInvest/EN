'use client';

import { useState, useEffect } from 'react';

export default function LeaseContractsPage() {
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rem/leases')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeases(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏢 Real Estate - Lease Contracts</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + New Contract
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading contracts...</div>
        ) : leases.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No lease contracts found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">Contract #</th>
                <th className="p-4 font-semibold">Tenant</th>
                <th className="p-4 font-semibold">Unit</th>
                <th className="p-4 font-semibold">Period</th>
                <th className="p-4 font-semibold text-right">Rent Amount</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {leases.map(lease => (
                <tr key={lease.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-700">{lease.contractNumber}</td>
                  <td className="p-4">{lease.tenant?.name || 'Unknown'}</td>
                  <td className="p-4 text-sm text-slate-600">
                    {lease.unit?.property?.name} - Unit {lease.unit?.unitNumber}
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {new Date(lease.startDate).toLocaleDateString()} - <br/>{new Date(lease.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-medium text-right bg-slate-50/50">
                    {lease.rentAmount.toLocaleString()} SAR <br/><span className="text-xs text-slate-400">{lease.paymentFrequency}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      lease.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      lease.status === 'EXPIRED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {lease.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
