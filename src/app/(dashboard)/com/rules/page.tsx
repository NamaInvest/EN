'use client';

import { useState, useEffect } from 'react';

export default function CommissionRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/com/rules')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRules(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🎯 Sales Commissions - Rules & Tiers</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + Add New Target Rule
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading commission rules...</div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No commission rules defined.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">Rule Name</th>
                <th className="p-4 font-semibold">Sales Target</th>
                <th className="p-4 font-semibold">Reward Value</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-700">{rule.name}</td>
                  <td className="p-4 text-emerald-600 font-medium">SAR {rule.targetAmount.toLocaleString()}</td>
                  <td className="p-4 font-bold text-blue-600">
                    {rule.rewardType === 'PERCENTAGE' ? `${rule.rewardValue}%` : `SAR ${rule.rewardValue}`}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      rule.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
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
