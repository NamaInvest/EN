import React from 'react';
import { PrismaClient } from '@prisma/client';
import { PlayCircle, PauseCircle, CheckCircle, XCircle } from 'lucide-react';

const prisma = new PrismaClient();

export default async function ChainsDashboard() {
  const states = await prisma.chainState.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Workflow Chains Orchestration</h1>
      <div className="bg-(--bg-primary) border border-(--border) rounded-xl overflow-hidden">
        <table className="w-full text-left" dir="ltr">
          <thead className="bg-(--bg-secondary) border-b border-(--border)">
            <tr>
              <th className="p-4 text-sm font-semibold">ID</th>
              <th className="p-4 text-sm font-semibold">Chain Name</th>
              <th className="p-4 text-sm font-semibold">Tenant</th>
              <th className="p-4 text-sm font-semibold">Actor</th>
              <th className="p-4 text-sm font-semibold">Status</th>
              <th className="p-4 text-sm font-semibold">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {states.map(state => (
              <tr key={state.id} className="border-b border-(--border) hover:bg-(--bg-secondary)">
                <td className="p-4 text-sm">#{state.id}</td>
                <td className="p-4 text-sm font-medium">{state.chainName}</td>
                <td className="p-4 text-sm text-(--text-muted)">{state.tenantId}</td>
                <td className="p-4 text-sm text-(--text-muted)">{state.actor || '-'}</td>
                <td className="p-4 text-sm">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${state.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      state.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                      state.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                    {state.status === 'COMPLETED' && <CheckCircle size={14} />}
                    {state.status === 'PAUSED' && <PauseCircle size={14} />}
                    {state.status === 'FAILED' && <XCircle size={14} />}
                    {['RUNNING', 'PENDING'].includes(state.status) && <PlayCircle size={14} />}
                    {state.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-(--text-muted)">
                  {new Date(state.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {states.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-(--text-muted)">
                  No chain states recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
