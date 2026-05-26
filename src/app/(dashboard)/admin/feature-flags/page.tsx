import React from 'react';
import { PrismaClient } from '@prisma/client';
import { Settings, Check, X, AlertCircle } from 'lucide-react';
import { getServerLang } from "@/lib/server-t";

const prisma = new PrismaClient();

export default async function FeatureFlagsDashboard() {
  const lang = await getServerLang();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const flags = await prisma.featureFlag.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{_t('إدارة ميزات وعلامات النظام', 'Feature Flags Management')}</h1>
        <button className="bg-(--primary) text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
          {_t('إضافة علامة ميزة جديدة', 'Add New Flag')}
        </button>
      </div>
      
      <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center gap-3 border border-yellow-200 mb-6">
        <AlertCircle size={20} className="text-yellow-600" />
        <span className="font-medium">{_t('يتم تحديث التخزين المؤقت كل 5 دقائق. قد لا تنعكس التغييرات فوراً.', 'Cache is updated every 5 minutes. Changes might not reflect immediately.')}</span>
      </div>

      <div className="bg-(--bg-primary) border border-(--border) rounded-xl overflow-hidden">
        <table className="w-full text-left" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <thead className="bg-(--bg-secondary) border-b border-(--border)">
            <tr>
              <th className="p-4 text-sm font-semibold">{_t('مفتاح', 'Key')}</th>
              <th className="p-4 text-sm font-semibold">{_t('الوصف', 'Description')}</th>
              <th className="p-4 text-sm font-semibold">{_t('الحالة', 'Status')}</th>
              <th className="p-4 text-sm font-semibold">{_t('نسبة النشر ٪', 'Rollout %')}</th>
              <th className="p-4 text-sm font-semibold">{_t('المستأجرين المستهدفين', 'Target Tenants')}</th>
              <th className="p-4 text-sm font-semibold">{_t('المستخدمين المستهدفين', 'Target Users')}</th>
            </tr>
          </thead>
          <tbody>
            {flags.map(flag => (
              <tr key={flag.id} className="border-b border-(--border) hover:bg-(--bg-secondary)">
                <td className="p-4 text-sm font-medium">{flag.key}</td>
                <td className="p-4 text-sm text-(--text-muted)">{flag.description || '-'}</td>
                <td className="p-4 text-sm">
                  {flag.enabled ? (
                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs font-medium">
                      <Check size={14} /> {_t('مفعلة', 'Enabled')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-xs font-medium">
                      <X size={14} /> {_t('معطلة', 'Disabled')}
                    </span>
                  )}
                </td>
                <td className="p-4 text-sm">
                  <div className="w-full bg-(--bg-secondary) rounded-full h-2.5 dark:bg-gray-700 mt-1">
                    <div className="bg-(--primary) h-2.5 rounded-full" style={{ width: `${flag.percentage}%` }}></div>
                  </div>
                  <span className="text-xs text-(--text-muted) mt-1 inline-block">{flag.percentage}%</span>
                </td>
                <td className="p-4 text-sm text-(--text-muted) truncate max-w-xs">
                  {flag.targetTenants ? JSON.stringify(flag.targetTenants) : _t('الكل', 'All')}
                </td>
                <td className="p-4 text-sm text-(--text-muted) truncate max-w-xs">
                  {flag.targetUsers ? JSON.stringify(flag.targetUsers) : _t('الكل', 'All')}
                </td>
              </tr>
            ))}
            {flags.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-(--text-muted)">
                  {_t('لم يتم العثور على أي علامات ميزات. أنشئ واحدة للبدء.', 'No feature flags found. Create one to begin.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
