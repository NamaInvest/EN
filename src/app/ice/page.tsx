import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Building2, KeyRound, CreditCard, ShieldAlert, CheckCircle2, History, ArrowRight, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ICE - Dashboard | Master Panel',
};

// Next.js Server Component
export default async function IceDashboard() {
  // Safe Prisma queries (fail gracefully if db push hasn't happened yet in dev)
  let stats = {
    activeTenants: 0,
    trialTenants: 0,
    activeLicenses: 0,
    totalAdmins: 0,
  };
  
  let recentLogs: any[] = [];

  try {
    const [activeTenants, trialTenants, activeLicenses, totalAdmins] = await Promise.all([
      prisma.iceTenantSubscription.count({ where: { status: 'ACTIVE' } }),
      prisma.iceTenantSubscription.count({ where: { status: 'TRIAL' } }),
      prisma.iceDesktopLicense.count({ where: { status: 'ACTIVE' } }),
      prisma.iceAdmin.count({ where: { active: true } })
    ]);
    stats = { activeTenants, trialTenants, activeLicenses, totalAdmins };
    
    // Fetch actual recent audit logs
    recentLogs = await prisma.iceAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { admin: true }
    });
  } catch (error) {
    console.warn("ICE Dashboard stats fetch failed. Database might need migration.", error);
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[#14161c] p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-[#0066cc]/5 to-transparent z-0 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">نظرة عامة على المنظومة</h1>
          <p className="text-neutral-400 font-bold text-sm">مراقبة لحظية لحالة الشركات، التراخيص، وسجلات الأمان</p>
        </div>
        <div className="relative z-10 mt-4 md:mt-0">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 font-bold rounded-xl text-sm shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <CheckCircle2 className="w-4 h-4" />
            <span>النظام يعمل بكفاءة 100%</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#14161c] p-6 rounded-2xl border border-white/5 flex flex-col gap-4 relative overflow-hidden group hover:border-[#0066cc]/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0066cc]/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-[#0066cc]/10"></div>
          <div className="flex items-center justify-between">
            <h3 className="text-neutral-400 font-bold text-sm">الشركات النشطة</h3>
            <div className="w-10 h-10 rounded-xl bg-[#0066cc]/10 flex items-center justify-center text-[#0066cc]">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-white">{stats.activeTenants}</div>
        </div>

        <div className="bg-[#14161c] p-6 rounded-2xl border border-white/5 flex flex-col gap-4 relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-yellow-500/10"></div>
          <div className="flex items-center justify-between">
            <h3 className="text-neutral-400 font-bold text-sm">النسخ التجريبية</h3>
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-white">{stats.trialTenants}</div>
        </div>

        <div className="bg-[#14161c] p-6 rounded-2xl border border-white/5 flex flex-col gap-4 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-purple-500/10"></div>
          <div className="flex items-center justify-between">
            <h3 className="text-neutral-400 font-bold text-sm">التراخيص المكتبية</h3>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-white">{stats.activeLicenses}</div>
        </div>

        <div className="bg-[#14161c] p-6 rounded-2xl border border-white/5 flex flex-col gap-4 relative overflow-hidden group hover:border-red-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-red-500/10"></div>
          <div className="flex items-center justify-between">
            <h3 className="text-neutral-400 font-bold text-sm">مسؤولي النظام</h3>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-white">{stats.totalAdmins}</div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Quick Actions Panel */}
        <div className="bg-[#14161c] p-6 rounded-2xl border border-white/5">
          <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-[#0066cc]" />
            إجراءات سريعة
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Link href="/ice/tenants/new" className="group p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-[#0066cc]/30 flex flex-col gap-2">
               <span className="font-bold text-white group-hover:text-[#0066cc] transition-colors">إضافة شركة جديدة</span>
               <span className="text-xs text-neutral-500">إعداد مساحة عمل جديدة وتسجيل مستأجر</span>
             </Link>
             <Link href="/ice/licenses" className="group p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-[#0066cc]/30 flex flex-col gap-2">
               <span className="font-bold text-white group-hover:text-[#0066cc] transition-colors">إصدار ترخيص مكتبي</span>
               <span className="text-xs text-neutral-500">توليد مفتاح ترخيص لنسخة Desktop</span>
             </Link>
             <Link href="/ice/billing" className="group p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-[#0066cc]/30 flex flex-col gap-2">
               <span className="font-bold text-white group-hover:text-[#0066cc] transition-colors">تعديل باقات الاشتراك</span>
               <span className="text-xs text-neutral-500">تحديث حدود الاستخدام والفوترة</span>
             </Link>
             <Link href="/ice/audit" className="group p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-[#0066cc]/30 flex flex-col gap-2">
               <span className="font-bold text-white group-hover:text-[#0066cc] transition-colors">مراجعة سجلات الأمان</span>
               <span className="text-xs text-neutral-500">عرض سجل التدقيق (Audit Logs)</span>
             </Link>
          </div>
        </div>

        {/* Audit Log Mini View */}
        <div className="bg-[#14161c] p-6 rounded-2xl border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <History className="w-5 h-5 text-purple-500" />
              أحدث العمليات (Audit Logs)
            </h2>
            <Link href="/ice/audit" className="text-xs font-bold text-[#0066cc] hover:text-white transition-colors flex items-center gap-1">
              عرض الكل
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-3 flex-1">
             {recentLogs.length > 0 ? (
               recentLogs.map((log: any) => (
                 <div key={log.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                    <div>
                       <p className="text-sm font-bold text-white">{log.action}</p>
                       <p className="text-xs text-neutral-500 font-medium mt-1">من قبل: {log.admin?.fullName || 'System'}</p>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-black/20 px-2 py-1 rounded-md">
                      {new Date(log.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute:'2-digit' })}
                    </span>
                 </div>
               ))
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl">
                 <ShieldAlert className="w-8 h-8 text-neutral-600 mb-2" />
                 <p className="text-sm font-bold text-neutral-400">لا توجد سجلات حديثة</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
