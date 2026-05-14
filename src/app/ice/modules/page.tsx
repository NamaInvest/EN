import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Boxes, PackagePlus, ToggleLeft, ToggleRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ICE - إدارة الوحدات (Modules)',
};

/**
 * @description
 * Module management page for ICE Super Admin.
 * Handles the enabling/disabling of system-wide modules and plan-specific modules.
 */
export default async function ModulesPage() {
  let modules: any[] = [];
  
  try {
    modules = await prisma.iceSystemModule.findMany({
      include: {
        subModules: true
      },
      where: { parentId: null }
    });
  } catch (error) {
    console.warn("Failed to fetch system modules.", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#14161c] p-6 rounded-2xl border border-white/5 shadow-lg">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
            <Boxes className="w-8 h-8 text-[#0066cc]" />
            إدارة الوحدات (Modules)
          </h1>
          <p className="text-neutral-400 font-medium text-sm">تفعيل وإيقاف أقسام النظام على مستوى الباقات أو الشركات</p>
        </div>
        
        <button className="px-6 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#0052a3] hover:from-[#0052a3] hover:to-[#004080] text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center gap-2">
          <PackagePlus className="w-4 h-4" />
          إضافة وحدة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <div key={mod.id} className="bg-[#14161c] p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">{mod.nameAr}</h3>
                <p className="text-xs text-neutral-500 font-mono mt-1">{mod.code}</p>
              </div>
              {mod.isActive ? (
                <ToggleRight className="w-8 h-8 text-green-500 cursor-pointer" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-neutral-600 cursor-pointer" />
              )}
            </div>
            
            <p className="text-sm text-neutral-400 min-h-[40px]">
              {mod.description || 'لا يوجد وصف متاح لهذه الوحدة.'}
            </p>

            <div className="border-t border-white/5 pt-4 mt-auto">
              <p className="text-xs font-bold text-neutral-500 mb-2">الوحدات الفرعية:</p>
              <div className="flex flex-wrap gap-2">
                {mod.subModules.length > 0 ? mod.subModules.map((sub: any) => (
                  <span key={sub.id} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-neutral-300">
                    {sub.nameAr}
                  </span>
                )) : (
                  <span className="text-xs text-neutral-600">لا يوجد وحدات فرعية</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {modules.length === 0 && (
          <div className="col-span-full p-12 text-center text-neutral-500 font-bold bg-[#14161c] rounded-2xl border border-white/5">
            لم يتم تسجيل أي وحدات في النظام بعد. (Prisma Migration Required)
          </div>
        )}
      </div>
    </div>
  );
}
