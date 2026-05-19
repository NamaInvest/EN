import { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Download, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { AppUpdateInfo } from '../../electron/types';

const i18n = {
  title: 'تحديث النظام',
  subtitle: 'التحقق من توفر إصدارات جديدة لمنصة التشغيل',
  btnCheck: 'فحص التحديثات',
  btnBack: 'رجوع للوحة التحكم',
  status: {
    checking: 'جاري البحث عن تحديثات...',
    upToDate: 'أنت تستخدم أحدث إصدار',
    updateAvailable: 'يتوفر تحديث جديد',
    mandatory: 'تحديث إجباري',
    error: 'فشل في التحقق من التحديثات',
  },
  labels: {
    currentVersion: 'الإصدار الحالي',
    latestVersion: 'أحدث إصدار',
    changelog: 'ما الجديد في هذا الإصدار؟',
    downloadUrl: 'رابط التحميل',
    sha256: 'التحقق (SHA256)',
  }
};

interface AppUpdateScreenProps {
  onBack: () => void;
}

export function AppUpdateScreen({ onBack }: AppUpdateScreenProps) {
  const [loading, setLoading] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [error, setError] = useState(false);
  const currentVersion = '2.4.8'; // Hardcoded for this phase as per requirements

  const handleCheckUpdates = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.checkUpdates();
      setUpdateInfo(res);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCheckUpdates();
  }, []);

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
        <div className="p-8">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{i18n.labels.currentVersion}</p>
                <p className="text-2xl font-bold text-slate-800">v{currentVersion}</p>
              </div>
            </div>
            
            <button 
              onClick={handleCheckUpdates}
              disabled={loading}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? i18n.status.checking : i18n.btnCheck}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p className="font-medium">{i18n.status.error}</p>
            </div>
          )}

          {!error && updateInfo && (
            <div className={`p-6 rounded-xl border ${updateInfo.updateAvailable ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-start gap-4">
                {updateInfo.updateAvailable ? (
                  <Download className="w-8 h-8 text-amber-600 shrink-0 mt-1" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-lg font-bold ${updateInfo.updateAvailable ? 'text-amber-800' : 'text-emerald-800'}`}>
                      {updateInfo.updateAvailable ? i18n.status.updateAvailable : i18n.status.upToDate}
                    </h3>
                    {updateInfo.mandatory && (
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-md">
                        {i18n.status.mandatory}
                      </span>
                    )}
                  </div>
                  
                  {updateInfo.updateAvailable && (
                    <div className="space-y-4 mt-4">
                      <div className="flex gap-4 border-b border-amber-200/50 pb-4">
                        <div>
                          <p className="text-xs font-semibold text-amber-700/70 mb-1">{i18n.labels.latestVersion}</p>
                          <p className="font-bold text-amber-900">v{updateInfo.latestVersion}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-700/70 mb-1">{i18n.labels.sha256}</p>
                          <p className="font-mono text-xs text-amber-900 truncate w-32" title={updateInfo.sha256}>{updateInfo.sha256.slice(0, 16)}...</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-amber-900 mb-2">{i18n.labels.changelog}</p>
                        <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                          {updateInfo.changelog.map((log, idx) => (
                            <li key={idx}>{log}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2">
                        <p className="text-xs font-semibold text-amber-700/70 mb-1">{i18n.labels.downloadUrl}</p>
                        <p className="text-sm font-mono text-amber-900 bg-amber-100/50 p-2 rounded truncate">
                          {updateInfo.downloadUrl.replace(/https?:\/\//, '********')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
