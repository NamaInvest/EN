'use client';

import { useState, useEffect } from 'react';

export default function SystemAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sys/alerts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAlerts(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🔔 System Alerts & Workflow Inbox</h1>
        <button className="text-slate-500 hover:text-slate-800 font-medium transition">
          Mark All As Read
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading inbox...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No active alerts or tasks in your inbox. 🎉</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map(al => (
              <div key={al.id} className={`p-4 flex gap-4 items-start hover:bg-slate-50 transition border-l-4 ${
                al.alertType === 'URGENT' ? 'border-l-red-500 bg-red-50/10' :
                al.alertType === 'WORKFLOW' ? 'border-l-blue-500' :
                al.alertType === 'WARNING' ? 'border-l-amber-500' : 'border-l-slate-200'
              } ${!al.read ? 'font-semibold' : ''}`}>
                
                <div className={`p-2 rounded-full mt-1 ${
                  al.alertType === 'URGENT' ? 'bg-red-100 text-red-500' : 
                  al.alertType === 'WORKFLOW' ? 'bg-blue-100 text-blue-500' : 'bg-slate-100 text-slate-500'
                }`}>
                   {al.alertType === 'URGENT' ? '❗' : al.alertType === 'WORKFLOW' ? '📝' : '💬'}
                </div>

                <div className="flex-1">
                  <h3 className={`text-sm text-slate-800 ${!al.read ? 'font-bold' : ''}`}>{al.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{al.message}</p>
                </div>

                <div className="text-xs text-slate-400">
                  {new Date(al.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
