import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Settings, Save } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ICE - إعدادات النظام',
};

/**
 * @description
 * System-wide global settings management.
 */
export default async function SettingsPage() {
  let settings: any[] = [];
  try {
    settings = await prisma.iceSystemSetting.findMany();
  } catch (err) {}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#14161c] p-6 rounded-2xl border border-white/5 shadow-lg">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#0066cc]" /> إعدادات النظام
          </h1>
          <p className="text-neutral-400 text-sm font-medium">المتغيرات العالمية للمنصة ومفاتيح الربط</p>
        </div>
      </div>

      <div className="bg-[#14161c] rounded-2xl border border-white/5 p-6 shadow-xl">
        <div className="space-y-6 max-w-3xl">
          {settings.map(setting => (
            <div key={setting.id} className="space-y-2">
              <label className="text-sm font-bold text-white">{setting.key}</label>
              <p className="text-xs text-neutral-500 mb-2">{setting.description}</p>
              <input 
                type="text" 
                defaultValue={setting.value} 
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-white text-sm focus:border-[#0066cc] outline-none"
                dir="ltr"
              />
            </div>
          ))}

          {settings.length === 0 && (
            <p className="text-neutral-500 text-sm">لا يوجد إعدادات مسجلة في قاعدة البيانات حالياً.</p>
          )}

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button className="px-6 py-2.5 bg-[#0066cc] text-white font-bold rounded-xl shadow-lg hover:bg-[#0052a3] flex items-center gap-2">
              <Save className="w-4 h-4" /> حفظ الإعدادات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
