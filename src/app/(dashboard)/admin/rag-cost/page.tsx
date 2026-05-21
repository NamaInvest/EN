import React from 'react';
import { Activity, DollarSign, Database, AlertCircle } from 'lucide-react';

export default function RagCostDashboard() {
  // Mock data for the dashboard
  const stats = {
    dailyCost: 12.45,
    tokensUsed: 622500,
    activeTenants: 15,
    totalChunks: 145000
  };

  const costLimit = 50.00;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">RAG Analytics & Cost Monitoring</h1>
        <button className="bg-(--primary) text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
          Download Report
        </button>
      </div>

      {stats.dailyCost > costLimit && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3 border border-red-200">
          <AlertCircle size={20} className="text-red-600" />
          <span className="font-medium">Warning: Daily cost limit (${costLimit}) exceeded!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-(--bg-secondary) border border-(--border) p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-green-600" size={24} />
            <h3 className="font-semibold text-(--text-muted)">Daily Cost</h3>
          </div>
          <p className="text-3xl font-bold">${stats.dailyCost.toFixed(2)}</p>
        </div>

        <div className="bg-(--bg-secondary) border border-(--border) p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-blue-600" size={24} />
            <h3 className="font-semibold text-(--text-muted)">Tokens Embedded</h3>
          </div>
          <p className="text-3xl font-bold">{stats.tokensUsed.toLocaleString()}</p>
        </div>

        <div className="bg-(--bg-secondary) border border-(--border) p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Database className="text-purple-600" size={24} />
            <h3 className="font-semibold text-(--text-muted)">Total Chunks</h3>
          </div>
          <p className="text-3xl font-bold">{stats.totalChunks.toLocaleString()}</p>
        </div>

        <div className="bg-(--bg-secondary) border border-(--border) p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-orange-600" size={24} />
            <h3 className="font-semibold text-(--text-muted)">Active Tenants</h3>
          </div>
          <p className="text-3xl font-bold">{stats.activeTenants}</p>
        </div>
      </div>
    </div>
  );
}
