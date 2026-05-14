import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Building2, Search, Filter, MoreVertical, Play, Pause, Trash2, Key } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ICE - إدارة الشركات (Tenants)',
};

/**
 * @description
 * Page for managing all SaaS Tenants.
 * Features: View tenants, toggle status (Suspend/Active), Impersonate, and Edit.
 */
export default async function TenantsPage() {
  let tenants: any[] = [];
  
  try {
    tenants = await prisma.iceTenantSubscription.findMany({
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.warn("Failed to fetch tenants. Prisma migration might be pending.", error);
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#14161c] p-6 rounded-2xl border border-white/5 shadow-lg">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-[#0066cc]" />
            إدارة الشركات
          </h1>
          <p className="text-neutral-400 font-medium text-sm">إدارة الاشتراكات، الصلاحيات، وحالة المشتركين</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 right-0 pl-3 pr-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-500" />
            </div>
            <input
              type="text"
              placeholder="ابحث عن شركة أو دومين..."
              className="block w-full pl-3 pr-10 py-2.5 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-[#0066cc] text-sm"
            />
          </div>
          <button className="p-2.5 bg-[#0a0a0f] border border-white/10 rounded-xl text-neutral-400 hover:text-white transition-colors">
            <Filter className="w-5 h-5" />
          </button>
          <button className="px-6 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#0052a3] hover:from-[#0052a3] hover:to-[#004080] text-white font-bold rounded-xl shadow-lg transition-all text-sm">
            إضافة شركة جديدة
          </button>
        </div>
      </div>

      {/* Tenants Data Table */}
      <div className="bg-[#14161c] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-white">
            <thead className="bg-[#0a0a0f] border-b border-white/5 text-neutral-400 text-sm font-bold">
              <tr>
                <th className="p-4">الشركة (Subdomain)</th>
                <th className="p-4">الباقة</th>
                <th className="p-4">تاريخ الاشتراك</th>
                <th className="p-4">نهاية الاشتراك</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-sm">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0066cc]/10 flex items-center justify-center text-[#0066cc] font-bold">
                        {tenant.tenantId.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white">{tenant.tenantId}</p>
                        <p className="text-xs text-neutral-500">https://{tenant.tenantId}.namainvist.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-white/5 rounded-lg text-neutral-300 font-bold text-xs border border-white/5">
                      {tenant.plan?.name || 'مخصص'}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-400">
                    {new Date(tenant.startDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="p-4 text-neutral-400">
                    {new Date(tenant.endDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      tenant.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                      tenant.status === 'TRIAL' ? 'bg-yellow-500/20 text-yellow-500' :
                      tenant.status === 'SUSPENDED' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Impersonate Button */}
                      <button className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="دخول كمدير للشركة (Impersonate)">
                        <Key className="w-4 h-4" />
                      </button>
                      
                      {/* Suspend / Activate Toggle */}
                      {tenant.status === 'ACTIVE' || tenant.status === 'TRIAL' ? (
                        <button className="p-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors" title="إيقاف مؤقت">
                          <Pause className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors" title="إعادة تفعيل">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* More options */}
                      <button className="p-2 bg-white/5 text-neutral-400 hover:text-white rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500 font-bold">
                    لا يوجد شركات مسجلة في هذا النظام حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
