// Removed React import since it's unused in React 17+
import { CheckCircle2, XCircle, AlertCircle, Clock, Server, Database, Key, RefreshCw, Printer } from 'lucide-react';

// Ready for i18n extraction
const i18n = {
  appName: 'نما سوفت | بيئة التشغيل',
  version: 'الإصدار 2.4.8',
  systemStatus: 'حالة النظام',
  items: {
    localDatabase: { label: 'قاعدة البيانات المحلية', status: 'Ready', text: 'جاهز' },
    offlineEngine: { label: 'محرك العمل دون اتصال', status: 'Ready', text: 'جاهز' },
    license: { label: 'الفترة التجريبية', status: 'Not configured', text: 'غير مفعلة' },
    sync: { label: 'المزامنة', status: 'Idle', text: 'خامل' },
    qzTray: { label: 'الطباعة (QZ Tray)', status: 'Not checked', text: 'لم يتم الفحص' },
  },
  btnStart: 'بدء الإعداد',
  deviceFp: 'بصمة الجهاز:',
};

interface WelcomeScreenProps {
  onStartSetup: () => void;
  fingerprint: string;
}

export function WelcomeScreen({ onStartSetup, fingerprint }: WelcomeScreenProps) {
  const renderBadge = (status: string, text: string) => {
    switch (status) {
      case 'Ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {text}
          </span>
        );
      case 'Not configured':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            {text}
          </span>
        );
      case 'Idle':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5" />
            {text}
          </span>
        );
      case 'Not checked':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <AlertCircle className="w-3.5 h-3.5" />
            {text}
          </span>
        );
    }
  };

  return (
    <div dir="rtl" className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 font-sans p-4">
      
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        
        {/* Header Section */}
        <div className="bg-slate-900 p-8 text-center text-white">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Server className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">{i18n.appName}</h1>
          <p className="text-slate-400 font-medium">{i18n.version}</p>
        </div>

        {/* Status Section */}
        <div className="p-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            {i18n.systemStatus}
          </h2>

          <div className="space-y-4">
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Database className="w-5 h-5 text-slate-600" />
                </div>
                <span className="font-medium text-slate-700">{i18n.items.localDatabase.label}</span>
              </div>
              {renderBadge(i18n.items.localDatabase.status, i18n.items.localDatabase.text)}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Server className="w-5 h-5 text-slate-600" />
                </div>
                <span className="font-medium text-slate-700">{i18n.items.offlineEngine.label}</span>
              </div>
              {renderBadge(i18n.items.offlineEngine.status, i18n.items.offlineEngine.text)}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Key className="w-5 h-5 text-slate-600" />
                </div>
                <span className="font-medium text-slate-700">{i18n.items.license.label}</span>
              </div>
              {renderBadge(i18n.items.license.status, i18n.items.license.text)}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <RefreshCw className="w-5 h-5 text-slate-600" />
                </div>
                <span className="font-medium text-slate-700">{i18n.items.sync.label}</span>
              </div>
              {renderBadge(i18n.items.sync.status, i18n.items.sync.text)}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Printer className="w-5 h-5 text-slate-600" />
                </div>
                <span className="font-medium text-slate-700">{i18n.items.qzTray.label}</span>
              </div>
              {renderBadge(i18n.items.qzTray.status, i18n.items.qzTray.text)}
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button 
              onClick={onStartSetup}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 active:scale-[0.98] transition-all font-semibold text-lg"
            >
              {i18n.btnStart}
            </button>
            <p className="mt-4 text-center text-xs text-slate-400">
              {i18n.deviceFp} {fingerprint ? `${fingerprint.slice(0, 16)}...` : 'جاري التحميل...'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
