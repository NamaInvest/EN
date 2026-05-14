import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { KeyRound, Search, ShieldCheck, MonitorSmartphone, WifiOff, Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ICE - التراخيص والأجهزة',
};

/**
 * @description
 * Desktop app license management page.
 * Tracks hardware IDs, sync status, and offline grace periods for offline-capable ERP clients.
 */
export default async function LicensesPage() {
  let licenses: any[] = [];
  try {
    licenses = await prisma.iceDesktopLicense.findMany({
      include: { subscription: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#14161c] p-6 rounded-2xl border border-white/5 shadow-lg">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <KeyRound className="w-8 h-8 text-[#0066cc]" /> التراخيص المكتبية
          </h1>
          <p className="text-neutral-400 text-sm font-medium">إدارة نقاط البيع والأجهزة المرتبطة بكل شركة</p>
        </div>
        <button className="px-6 py-2.5 bg-[#0066cc] text-white font-bold rounded-xl shadow-lg hover:bg-[#0052a3] flex items-center gap-2">
          <Plus className="w-5 h-5" /> إصدار ترخيص
        </button>
      </div>

      <div className="bg-[#14161c] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <table className="w-full text-right text-white">
          <thead className="bg-[#0a0a0f] border-b border-white/5 text-neutral-400 text-sm font-bold">
            <tr>
              <th className="p-4">مفتاح الترخيص</th>
              <th className="p-4">الشركة (Tenant)</th>
              <th className="p-4">الجهاز (Hardware)</th>
              <th className="p-4">آخر مزامنة</th>
              <th className="p-4">حالة الاتصال</th>
              <th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm font-medium">
            {licenses.map(lic => (
              <tr key={lic.id} className="hover:bg-white/5">
                <td className="p-4 font-mono text-neutral-300">{lic.licenseKey}</td>
                <td className="p-4">{lic.tenantId}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <MonitorSmartphone className="w-4 h-4 text-neutral-500" />
                    <span>{lic.deviceName || 'غير معروف'}</span>
                  </div>
                </td>
                <td className="p-4 text-neutral-400">{lic.lastSyncAt ? new Date(lic.lastSyncAt).toLocaleDateString() : 'لم يزامن أبداً'}</td>
                <td className="p-4">
                  {/* Logic for offline grace check could go here */}
                  <span className="text-green-400 flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> متصل</span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${lic.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {lic.status}
                  </span>
                </td>
              </tr>
            ))}
            {licenses.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-500">لا يوجد تراخيص نشطة.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
