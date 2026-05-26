import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function ComplianceDashboard() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const complianceStatus = {
    soc2: 95,
    iso27001: 88,
    pdpl: 100
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{_t('حالة الامتثال والأمن الشاملة', 'Compliance & Security Posture')}</h1>
        <button className="bg-(--primary) text-white px-4 py-2 rounded-lg font-medium">
          {_t('توليد تقرير التدقيق والمراجعة', 'Generate Auditor Report')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-(--bg-secondary) border border-(--border) p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{_t('SOC 2 النوع II', 'SOC 2 Type II')}</h3>
            <ShieldCheck className="text-green-600" size={24} />
          </div>
          <div className="w-full bg-(--bg-primary) rounded-full h-2.5 mb-2">
            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${complianceStatus.soc2}%` }}></div>
          </div>
          <p className="text-sm text-(--text-muted)">{complianceStatus.soc2}{_t('٪ من عناصر التحكم تم التحقق منها', '% Controls Verified')}</p>
        </div>

        <div className="bg-(--bg-secondary) border border-(--border) p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">ISO 27001</h3>
            <ShieldCheck className="text-blue-600" size={24} />
          </div>
          <div className="w-full bg-(--bg-primary) rounded-full h-2.5 mb-2">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${complianceStatus.iso27001}%` }}></div>
          </div>
          <p className="text-sm text-(--text-muted)">{complianceStatus.iso27001}{_t('٪ من عناصر التحكم تم التحقق منها', '% Controls Verified')}</p>
        </div>

        <div className="bg-(--bg-secondary) border border-(--border) p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Saudi PDPL</h3>
            <CheckCircle2 className="text-emerald-600" size={24} />
          </div>
          <div className="w-full bg-(--bg-primary) rounded-full h-2.5 mb-2">
            <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${complianceStatus.pdpl}%` }}></div>
          </div>
          <p className="text-sm text-(--text-muted)">{complianceStatus.pdpl}{_t('٪ نسبة الامتثال المكتملة', '% Compliant')}</p>
        </div>
      </div>

      <div className="bg-(--bg-secondary) border border-(--border) rounded-xl overflow-hidden mt-6">
        <div className="p-4 border-b border-(--border) bg-(--bg-primary)">
          <h2 className="font-semibold">{_t('عناصر العمل (عناصر التحكم التي تحتاج لمراجعة)', 'Action Items (Controls Needing Review)')}</h2>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4 pb-4 border-b border-(--border)">
            <AlertTriangle className="text-yellow-600 mt-1" size={20} />
            <div>
              <h4 className="font-medium">{_t('CC7.2 - حادث استجابة إجراءات', 'CC7.2 - Incident Response Procedures')}</h4>
              <p className="text-sm text-(--text-muted)">{_t('المراجعة السنوية مستحقة. يرجى مراجعة IR_PLAN.md وتحديث الأدلة.', 'Annual review is due. Please review IR_PLAN.md and update evidence.')}</p>
              <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded mt-2 inline-block">{_t('مستحق خلال 5 أيام', 'Due in 5 days')}</span>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <FileText className="text-gray-500 mt-1" size={20} />
            <div>
              <h4 className="font-medium">{_t('مراجعة صلاحيات وصول المستخدمين (ISO-A.9.2)', 'ISO-A.9.2 - User Access Reviews')}</h4>
              <p className="text-sm text-(--text-muted)">{_t('مراجعة الوصول الربع سنوية لأدوار المسؤولين معلقة قيد المراجعة.', 'Quarterly access review for Admin roles is pending.')}</p>
              <span className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded mt-2 inline-block">{_t('مستحق خلال 14 يوماً', 'Due in 14 days')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
