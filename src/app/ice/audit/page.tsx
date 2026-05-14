import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { ShieldAlert, Activity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ICE - سجل التدقيق (Audit Logs)',
};

/**
 * @description
 * Immutable Audit Logs view.
 * Ensures compliance and security by tracking every action taken by Admins in the ICE Panel.
 */
export default async function AuditPage() {
  let logs: any[] = [];
  try {
    logs = await prisma.iceAuditLog.findMany({
      include: { admin: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  } catch (err) {}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#14161c] p-6 rounded-2xl border border-white/5 shadow-lg">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" /> سجل التدقيق والمراقبة
          </h1>
          <p className="text-neutral-400 text-sm font-medium">تتبع جميع العمليات التي ينفذها مسؤولو النظام (لا يمكن حذفها)</p>
        </div>
      </div>

      <div className="bg-[#14161c] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <table className="w-full text-right text-white">
          <thead className="bg-[#0a0a0f] border-b border-white/5 text-neutral-400 text-sm font-bold">
            <tr>
              <th className="p-4">التاريخ والوقت</th>
              <th className="p-4">المدير (Admin)</th>
              <th className="p-4">نوع العملية</th>
              <th className="p-4">الكيان (Entity)</th>
              <th className="p-4">عنوان IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm font-medium">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-white/5">
                <td className="p-4 text-neutral-400">{new Date(log.createdAt).toLocaleString('en-GB')}</td>
                <td className="p-4 font-bold">{log.admin?.fullName || 'غير معروف'}</td>
                <td className="p-4">
                  <span className="bg-white/10 px-2 py-1 rounded font-mono text-xs text-neutral-300">{log.action}</span>
                </td>
                <td className="p-4">
                  {log.entityType} <span className="text-neutral-500">#{log.entityId}</span>
                </td>
                <td className="p-4 font-mono text-neutral-400 text-xs">{log.ipAddress}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-neutral-500">لا يوجد سجلات تدقيق حتى الآن.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
