import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Activity, ShieldAlert, Users, Database, HardDrive, Cpu, Server } from 'lucide-react';
import os from 'os';

export const metadata: Metadata = {
  title: 'ICE System Health',
  description: 'Super Admin System Monitoring',
};

export const dynamic = 'force-dynamic';

export default async function IceHealthPage() {
  // 1. Gather System Vitals
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
  const uptime = os.uptime();
  const cpuCores = os.cpus().length;
  const loadAvg = os.loadavg();

  // 2. Gather DB Metrics
  const failedLogins = await prisma.iceLoginLog.count({
    where: {
      status: { startsWith: 'FAILED' },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });

  const activeTenants = await prisma.tenantAccount.count({
    // Note: status filter removed as TenantAccount doesn't have it natively, 
    // it's handled via IceTenantSubscription or similar in this architecture.
  });

  const totalAuditLogs = await prisma.iceAuditLog.count({
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });

  const recentAlerts = await prisma.iceLoginLog.findMany({
    where: { status: { startsWith: 'FAILED' } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { admin: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-indigo-600" />
            مراقبة الأداء والنظام
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            حالة الخوادم، التنبيهات الأمنية، ومؤشرات الأداء الحية
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          النظام مستقر
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Memory */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{memUsagePercent}%</h3>
            <p className="text-sm text-slate-500 font-bold mt-1">استهلاك الذاكرة (RAM)</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${memUsagePercent}%` }}></div>
          </div>
        </div>

        {/* CPU */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{cpuCores} Cores</h3>
            <p className="text-sm text-slate-500 font-bold mt-1">المعالجات المتاحة</p>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-mono">Load: {loadAvg[0].toFixed(2)} | {loadAvg[1].toFixed(2)} | {loadAvg[2].toFixed(2)}</p>
        </div>

        {/* Failed Logins */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{failedLogins}</h3>
            <p className="text-sm text-slate-500 font-bold mt-1">محاولات دخول فاشلة (24h)</p>
          </div>
          {failedLogins > 5 && (
            <p className="text-xs text-red-500 mt-4 font-bold">تنبيه: محاولات اختراق محتملة</p>
          )}
        </div>

        {/* Active Tenants */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{activeTenants}</h3>
            <p className="text-sm text-slate-500 font-bold mt-1">الشركات النشطة حالياً</p>
          </div>
          <p className="text-xs text-slate-400 mt-4">Uptime: {(uptime / 3600).toFixed(1)} hrs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">سجل التنبيهات الأمنية الأخير</h2>
            <button className="text-sm text-indigo-600 font-bold hover:underline">عرض الكل</button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">لا توجد تنبيهات أمنية حديثة.</div>
            ) : (
              recentAlerts.map(alert => (
                <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">محاولة دخول فاشلة</p>
                      <p className="text-xs text-slate-500">
                        {alert.username} | IP: {alert.ipAddress}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {alert.status}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{alert.createdAt.toLocaleString('ar-SA')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="relative z-10">
            <h2 className="font-black text-xl mb-6">ملخص النظام</h2>
            <div className="space-y-6">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">بيئة التشغيل</p>
                <p className="font-mono text-sm">{os.type()} {os.release()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">الذاكرة الكلية</p>
                <p className="font-mono text-sm">{(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">عمليات التدقيق (24h)</p>
                <p className="font-mono text-sm text-cyan-400">{totalAuditLogs} عملية</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
