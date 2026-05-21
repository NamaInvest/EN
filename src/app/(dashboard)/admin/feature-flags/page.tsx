import React from 'react';
import { PrismaClient } from '@prisma/client';
import { Settings, Check, X, AlertCircle } from 'lucide-react';

const prisma = new PrismaClient();

export default async function FeatureFlagsDashboard() {
  const flags = await prisma.featureFlag.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feature Flags Management</h1>
        <button className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
          Add New Flag
        </button>
      </div>
      
      <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center gap-3 border border-yellow-200 mb-6">
        <AlertCircle size={20} className="text-yellow-600" />
        <span className="font-medium">Cache is updated every 5 minutes. Changes might not reflect immediately.</span>
      </div>

      <div className="bg-[var(--bg-primary)] border border-(--border) rounded-xl overflow-hidden">
        <table className="w-full text-left" dir="ltr">
          <thead className="bg-[var(--bg-secondary)] border-b border-(--border)">
            <tr>
              <th className="p-4 text-sm font-semibold">Key</th>
              <th className="p-4 text-sm font-semibold">Description</th>
              <th className="p-4 text-sm font-semibold">Status</th>
              <th className="p-4 text-sm font-semibold">Rollout %</th>
              <th className="p-4 text-sm font-semibold">Target Tenants</th>
              <th className="p-4 text-sm font-semibold">Target Users</th>
            </tr>
          </thead>
          <tbody>
            {flags.map(flag => (
              <tr key={flag.id} className="border-b border-(--border) hover:bg-[var(--bg-secondary)]">
                <td className="p-4 text-sm font-medium">{flag.key}</td>
                <td className="p-4 text-sm text-[var(--text-muted)]">{flag.description || '-'}</td>
                <td className="p-4 text-sm">
                  {flag.enabled ? (
                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs font-medium">
                      <Check size={14} /> Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-xs font-medium">
                      <X size={14} /> Disabled
                    </span>
                  )}
                </td>
                <td className="p-4 text-sm">
                  <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2.5 dark:bg-gray-700 mt-1">
                    <div className="bg-[var(--primary)] h-2.5 rounded-full" style={{ width: `${flag.percentage}%` }}></div>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] mt-1 inline-block">{flag.percentage}%</span>
                </td>
                <td className="p-4 text-sm text-[var(--text-muted)] truncate max-w-xs">
                  {flag.targetTenants ? JSON.stringify(flag.targetTenants) : 'All'}
                </td>
                <td className="p-4 text-sm text-[var(--text-muted)] truncate max-w-xs">
                  {flag.targetUsers ? JSON.stringify(flag.targetUsers) : 'All'}
                </td>
              </tr>
            ))}
            {flags.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                  No feature flags found. Create one to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
