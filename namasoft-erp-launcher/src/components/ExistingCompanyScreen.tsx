import { Building2, Globe, CalendarDays, RefreshCw, MonitorSmartphone, ArrowRight, ExternalLink } from 'lucide-react';

const i18n = {
  title: 'مرحباً بعودتك',
  subtitle: 'بيانات بيئة العمل الخاصة بمنشأتك',
  labels: {
    companyName: 'اسم المنشأة',
    subdomain: 'النطاق الفرعي',
    licenseExpiry: 'انتهاء الترخيص',
    lastSync: 'آخر مزامنة',
    deviceBinding: 'حالة ارتباط الجهاز',
  },
  values: {
    lastSync: 'تمت المزامنة بنجاح (قبل 5 دقائق)',
    deviceBinding: 'مرتبط بهذا الجهاز',
  },
  btnOpen: 'فتح بيئة العمل',
  btnBack: 'رجوع للترخيص',
};

import { LicenseVerifyResponse } from '../../electron/types';

interface ExistingCompanyScreenProps {
  onBack: () => void;
  onDashboard?: () => void;
  data: LicenseVerifyResponse | null;
}

export function ExistingCompanyScreen({ onBack, onDashboard, data }: ExistingCompanyScreenProps) {
  const handleOpenWorkspace = () => {
    console.log("Open workspace");
    if (onDashboard) onDashboard();
  };

  const renderItem = (Icon: React.ElementType, label: string, value: string) => (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="p-3 bg-white rounded-lg shadow-sm">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 font-sans p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm text-slate-300 hover:text-white"
          >
            <ArrowRight className="w-5 h-5" />
            {i18n.btnBack}
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{i18n.title}</h1>
            <p className="text-slate-400 text-sm mt-1">{i18n.subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderItem(Building2, i18n.labels.companyName, data?.companyName || 'غير متوفر')}
            {renderItem(Globe, i18n.labels.subdomain, data?.subdomain ? `${data.subdomain}.namasoft.com` : 'غير متوفر')}
            {renderItem(CalendarDays, i18n.labels.licenseExpiry, data?.licenseExpiresAt || 'غير متوفر')}
            {renderItem(RefreshCw, i18n.labels.lastSync, i18n.values.lastSync)}
            {renderItem(MonitorSmartphone, i18n.labels.deviceBinding, i18n.values.deviceBinding)}
          </div>

          <div className="mt-8">
            <button 
              onClick={handleOpenWorkspace}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] transition-all font-semibold text-lg"
            >
              <ExternalLink className="w-5 h-5" />
              {i18n.btnOpen}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
