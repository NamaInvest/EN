import React from 'react';
import { PrismaClient } from '@prisma/client';
import { PlayCircle, PauseCircle, CheckCircle, XCircle } from 'lucide-react';
import { getServerLang } from "@/lib/server-t";

const prisma = new PrismaClient();

export default async function ChainsDashboard() {
  const lang = await getServerLang();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const states = await prisma.chainState.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50
  });

  return (
    <div className="p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold mb-6 text-start">{_t('تنسيق سلاسل تدفق العمليات (Workflows)', 'Workflow Chains Orchestration')}</h1>
      <div className="bg-(--bg-primary) border border-(--border) rounded-xl overflow-hidden">
        <table className="w-full text-left" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <thead className="bg-(--bg-secondary) border-b border-(--border)">
            <tr>
              <th className="p-4 text-sm font-semibold text-start">{_t('المعرف', 'ID')}</th>
              <th className="p-4 text-sm font-semibold text-start">{_t('اسم السلسلة', 'Chain Name')}</th>
              <th className="p-4 text-sm font-semibold text-start">{_t('المستأجر', 'Tenant')}</th>
              <th className="p-4 text-sm font-semibold text-start">{_t('الفاعل / الممثل', 'Actor')}</th>
              <th className="p-4 text-sm font-semibold text-start">{_t('الحالة', 'Status')}</th>
              <th className="p-4 text-sm font-semibold text-start">{_t('آخر تحديث', 'Last Updated')}</th>
            </tr>
          </thead>
          <tbody>
            {states.map(state => (
              <tr key={state.id} className="border-b border-(--border) hover:bg-(--bg-secondary)">
                <td className="p-4 text-sm text-start">#{state.id}</td>
                <td className="p-4 text-sm font-medium text-start">{state.chainName}</td>
                <td className="p-4 text-sm text-(--text-muted) text-start">{state.tenantId}</td>
                <td className="p-4 text-sm text-(--text-muted) text-start">{state.actor || '-'}</td>
                <td className="p-4 text-sm text-start">
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
                <td className="p-4 text-sm text-(--text-muted) text-start">
                  {new Date(state.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {states.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-(--text-muted)">
                  {_t('لم يتم تسجيل أي حالات سلاسل بعد.', 'No chain states recorded yet.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
