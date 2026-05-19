import { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, Key, Database, RefreshCw, Printer, ShieldCheck, 
  ArrowRight, ExternalLink, Download, Play, AlertTriangle 
} from 'lucide-react';
import { api } from '../lib/api';
import { SyncStatusReport } from '../../electron/types';

const i18n = {
  title: 'لوحة تحكم التشغيل (Offline Dashboard)',
  subtitle: 'مراقبة حالة النظام والمزامنة المحلية',
  cards: {
    connection: 'حالة الاتصال',
    license: 'حالة الترخيص',
    database: 'قاعدة البيانات المحلية',
    syncQueue: 'قائمة المزامنة',
    qzTray: 'خدمة الطباعة (QZ Tray)',
    appVersion: 'إصدار النظام',
  },
  status: {
    online: 'متصل بالإنترنت',
    offline: 'غير متصل',
    active: 'نشط',
    gracePeriod: 'فترة سماح',
    expired: 'منتهي',
    ready: 'جاهز للعمل',
    error: 'يوجد خطأ',
    notChecked: 'لم يتم الفحص',
    installed: 'مثبت ويعمل',
    notInstalled: 'غير مثبت',
  },
  syncStats: {
    pending: 'قيد الانتظار',
    failed: 'فشل',
    lastSync: 'آخر مزامنة',
  },
  monitor: {
    title: 'مراقبة أحداث المزامنة (Sync Monitor)',
    empty: 'لا توجد أحداث مزامنة حالياً',
    columns: {
      event: 'نوع الحدث',
      status: 'الحالة',
      retries: 'محاولات الإعادة',
      createdAt: 'تاريخ الإنشاء',
      lastAttempt: 'آخر محاولة',
    }
  },
  buttons: {
    runSync: 'تشغيل المزامنة الآن',
    checkQz: 'فحص خدمة الطباعة',
    checkUpdate: 'البحث عن تحديثات',
    openWorkspace: 'فتح بيئة العمل',
    back: 'رجوع',
    refreshSync: 'تحديث بيانات المزامنة',
  }
};

interface OfflineDashboardProps {
  onBack: () => void;
  onCheckUpdates: () => void;
}

export function OfflineDashboard({ onBack, onCheckUpdates }: OfflineDashboardProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [qzStatus, setQzStatus] = useState<'notChecked' | 'installed' | 'notInstalled'>('notChecked');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatusReport | null>(null);
  
  // Mock data for dashboard
  const [stats] = useState({
    license: 'active',
    database: 'ready',
    version: '2.4.8'
  });

  const loadSyncStatus = async () => {
    try {
      const status = await api.getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSyncStatus();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRunSync = async () => {
    setSyncLoading(true);
    try {
      const res = await api.runSync();
      console.log('Sync result:', res);
      await loadSyncStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setSyncLoading(false), 1000); // Simulate slightly longer for UX
    }
  };

  const handleCheckQz = async () => {
    try {
      const res = await api.getQzStatus();
      setQzStatus(res.running ? 'installed' : 'notInstalled');
    } catch (err) {
      setQzStatus('notInstalled');
    }
  };

  const handleOpenWorkspace = () => {
    console.log('Open workspace');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <ArrowRight className="w-5 h-5 text-slate-600" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900">{i18n.title}</h1>
            </div>
            <p className="text-slate-500 mt-1 mr-12">{i18n.subtitle}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleCheckQz}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm flex items-center gap-2 font-medium transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" /> {i18n.buttons.checkQz}
            </button>
            <button 
              onClick={onCheckUpdates}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm flex items-center gap-2 font-medium transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" /> {i18n.buttons.checkUpdate}
            </button>
            <button 
              onClick={handleRunSync}
              disabled={syncLoading}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-70"
            >
              <Play className={`w-4 h-4 ${syncLoading ? 'animate-pulse' : ''}`} /> 
              {syncLoading ? 'جاري المزامنة...' : i18n.buttons.runSync}
            </button>
            <button 
              onClick={handleOpenWorkspace}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-md flex items-center gap-2 font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> {i18n.buttons.openWorkspace}
            </button>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Connection */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{i18n.cards.connection}</p>
              <p className="font-bold text-slate-800">{isOnline ? i18n.status.online : i18n.status.offline}</p>
            </div>
          </div>

          {/* License */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{i18n.cards.license}</p>
              <p className="font-bold text-slate-800">
                {stats.license === 'active' ? i18n.status.active : 
                 stats.license === 'grace' ? i18n.status.gracePeriod : i18n.status.expired}
              </p>
            </div>
          </div>

          {/* Local Database */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{i18n.cards.database}</p>
              <p className="font-bold text-slate-800">{stats.database === 'ready' ? i18n.status.ready : i18n.status.error}</p>
            </div>
          </div>

          {/* Sync Queue */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 mb-1">{i18n.cards.syncQueue}</p>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-800">
                <span className="text-amber-600">{syncStatus?.pendingCount ?? 0} {i18n.syncStats.pending}</span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-600">{syncStatus?.failedCount ?? 0} {i18n.syncStats.failed}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{i18n.syncStats.lastSync}: {syncStatus?.lastSyncAt || 'غير متوفر'}</p>
            </div>
          </div>

          {/* QZ Tray */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              qzStatus === 'installed' ? 'bg-emerald-100 text-emerald-600' :
              qzStatus === 'notInstalled' ? 'bg-rose-100 text-rose-600' :
              'bg-slate-100 text-slate-600'
            }`}>
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{i18n.cards.qzTray}</p>
              <p className="font-bold text-slate-800">
                {qzStatus === 'installed' ? i18n.status.installed : 
                 qzStatus === 'notInstalled' ? i18n.status.notInstalled : i18n.status.notChecked}
              </p>
            </div>
          </div>

          {/* App Version */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-100 text-teal-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{i18n.cards.appVersion}</p>
              <p className="font-bold text-slate-800">v{stats.version}</p>
            </div>
          </div>

        </div>

        {/* Sync Monitor Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
          <div className="bg-slate-900 p-5 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-slate-300" />
              <h2 className="text-lg font-bold">{i18n.monitor.title}</h2>
            </div>
            <button onClick={loadSyncStatus} className="text-sm px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> {i18n.buttons.refreshSync}
            </button>
          </div>
          
          {!syncStatus?.recentEvents?.length ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <RefreshCw className="w-12 h-12 text-slate-200 mb-3" />
              <p>{i18n.monitor.empty}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">{i18n.monitor.columns.event}</th>
                    <th className="px-6 py-4">{i18n.monitor.columns.status}</th>
                    <th className="px-6 py-4 text-center">{i18n.monitor.columns.retries}</th>
                    <th className="px-6 py-4">{i18n.monitor.columns.createdAt}</th>
                    <th className="px-6 py-4">{i18n.monitor.columns.lastAttempt}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {syncStatus.recentEvents.map((evt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700 font-mono text-xs">{evt.eventType}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          evt.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          evt.status === 'FAILED' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {evt.status === 'FAILED' && <AlertTriangle className="w-3 h-3 ml-1" />}
                          {evt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">{evt.retryCount}</td>
                      <td className="px-6 py-4 text-slate-500 dir-ltr text-right">{evt.createdAt}</td>
                      <td className="px-6 py-4 text-slate-500 dir-ltr text-right">{evt.lastAttemptAt || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
