'use client';
import React, { useEffect, useState } from 'react';
import { Settings2, Loader2, AlertTriangle, Workflow } from 'lucide-react';

export default function StateMachinePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/state-machine')
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
        <Settings2 className="text-primary" /> State Machine Rules (Viewer)
      </h1>
      
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={48} /></div>
      ) : !data || data.error ? (
        <div className="card p-8 text-center text-red-500 border border-red-200 bg-red-50 rounded-xl shadow-sm">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <p>Failed to load state machine data. {data?.error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="card p-8 text-center border border-(--border) bg-(--bg-secondary) rounded-xl shadow-sm">
          <Workflow className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-(--text-muted)">No transitions configured yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto card border border-(--border) rounded-xl shadow-sm">
          <table className="w-full text-left border-collapse" dir="ltr">
            <thead className="bg-(--bg-secondary) border-b border-(--border)">
              <tr>
                <th className="p-4 font-semibold text-sm">Doc Type</th>
                <th className="p-4 font-semibold text-sm">From State</th>
                <th className="p-4 font-semibold text-sm">To State</th>
                <th className="p-4 font-semibold text-sm">Action</th>
                <th className="p-4 font-semibold text-sm">Role</th>
              </tr>
            </thead>
            <tbody>
              {data.map((rule: any, i: number) => (
                <tr key={i} className="border-b border-(--border) bg-(--bg-primary) hover:bg-(--bg-secondary) transition-colors">
                  <td className="p-4 font-medium text-blue-600">{rule.docType}</td>
                  <td className="p-4 font-mono text-sm">{rule.fromState}</td>
                  <td className="p-4 font-mono text-sm">{rule.toState}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 border border-gray-200">
                      {rule.action}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-(--text-muted)">{rule.requiredRole || '*'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
