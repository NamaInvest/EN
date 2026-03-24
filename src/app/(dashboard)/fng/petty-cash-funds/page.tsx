'use client';

import { useState, useEffect } from 'react';

export default function PettyCashFundsPage() {
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fng/petty-cash-funds')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setFunds(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">💰 Finance - Petty Cash Custodians</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + Establish New Fund
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading petty cash funds...</div>
        ) : funds.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No active petty cash funds.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">Fund Name</th>
                <th className="p-4 font-semibold">Custodian (Employee)</th>
                <th className="p-4 font-semibold text-right">Max Limit</th>
                <th className="p-4 font-semibold text-right">Current Balance</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {funds.map(fund => (
                <tr key={fund.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-700">{fund.fundName}</td>
                  <td className="p-4">{fund.custodian?.name || 'Unknown'}</td>
                  <td className="p-4 text-right text-slate-500 font-medium">SAR {fund.maxLimit.toLocaleString()}</td>
                  <td className="p-4 text-right font-bold text-emerald-600">SAR {fund.currentBalance.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      fund.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {fund.status}
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
