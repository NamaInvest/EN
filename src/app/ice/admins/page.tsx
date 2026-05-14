import { Metadata } from 'next'; // force-reload
import { prisma } from '@/lib/prisma';
import { Users, ShieldCheck, UserPlus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ICE - إدارة المديرين (Admins)',
};

/**
 * @description
 * Internal staff management page.
 * Strictly controls who has Super Admin vs Support vs Sales access.
 */
export default async function AdminsPage() {
  let admins: any[] = [];
  try {
    admins = await prisma.iceAdmin.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#14161c] p-6 rounded-2xl border border-white/5 shadow-lg">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#0066cc]" /> إدارة المديرين
          </h1>
          <p className="text-neutral-400 text-sm font-medium">موظفو Nama Invest، الأدوار، وصلاحيات النظام</p>
        </div>
        <button className="px-6 py-2.5 bg-[#0066cc] text-white font-bold rounded-xl shadow-lg hover:bg-[#0052a3] flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> إضافة مدير
        </button>
      </div>

      <div className="bg-[#14161c] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <table className="w-full text-right text-white">
          <thead className="bg-[#0a0a0f] border-b border-white/5 text-neutral-400 text-sm font-bold">
            <tr>
              <th className="p-4">الموظف</th>
              <th className="p-4">البريد الإلكتروني</th>
              <th className="p-4">الدور (Role)</th>
              <th className="p-4">حالة 2FA</th>
              <th className="p-4">آخر دخول</th>
              <th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm font-medium">
            {admins.map(admin => (
              <tr key={admin.id} className="hover:bg-white/5">
                <td className="p-4 font-bold">{admin.fullName}</td>
                <td className="p-4 text-neutral-400">{admin.email}</td>
                <td className="p-4"><span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">{admin.role?.name || 'غير محدد'}</span></td>
                <td className="p-4">
                  {admin.twoFactorEnabled ? <span className="text-green-400">مفعل</span> : <span className="text-red-400">غير مفعل</span>}
                </td>
                <td className="p-4 text-neutral-400">{admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString('en-GB') : 'لم يسجل دخول'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${admin.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {admin.active ? 'نشط' : 'موقوف'}
                  </span>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-500">لا يوجد بيانات.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
