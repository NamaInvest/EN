import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { LifeBuoy, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ICE - الدعم الفني',
};

/**
 * @description
 * Internal Support Ticket Dashboard.
 * Allows ICE admins to view and respond to tickets raised by Tenants.
 */
export default async function SupportPage() {
  let tickets: any[] = [];
  try {
    tickets = await prisma.iceSupportTicket.findMany({
      include: { assignee: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#14161c] p-6 rounded-2xl border border-white/5 shadow-lg">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <LifeBuoy className="w-8 h-8 text-[#0066cc]" /> الدعم الفني
          </h1>
          <p className="text-neutral-400 text-sm font-medium">تذاكر الشركات، الاستفسارات، ومعالجة المشاكل</p>
        </div>
      </div>

      <div className="bg-[#14161c] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <table className="w-full text-right text-white">
          <thead className="bg-[#0a0a0f] border-b border-white/5 text-neutral-400 text-sm font-bold">
            <tr>
              <th className="p-4">رقم التذكرة</th>
              <th className="p-4">الشركة (Tenant)</th>
              <th className="p-4">الموضوع</th>
              <th className="p-4">الأولوية</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">المسؤول</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm font-medium">
            {tickets.map(ticket => (
              <tr key={ticket.id} className="hover:bg-white/5 cursor-pointer">
                <td className="p-4 font-mono text-neutral-300">#{ticket.ticketNo}</td>
                <td className="p-4 font-bold">{ticket.tenantId}</td>
                <td className="p-4 text-neutral-400">{ticket.subject}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${ticket.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-white/10'}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${ticket.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="p-4 text-neutral-400">{ticket.assignee?.fullName || 'غير معين'}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-500">لا يوجد تذاكر مفتوحة.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
