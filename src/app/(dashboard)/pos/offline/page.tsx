'use client';
import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, CloudOff, Check, AlertTriangle, Trash2, Download } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useTranslation } from '@/lib/i18n';

export default function POSOfflinePage() {
  const { success: ts, error: te } = useToast();
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [online, setOnline] = useState(true);
  const [swStatus, setSwStatus] = useState<'none'|'installing'|'active'>('none');
  const [pendingCount, setPendingCount] = useState(0);
  const [cachedProducts, setCachedProducts] = useState(0);
  const [cachedCustomers, setCachedCustomers] = useState(0);
  const [unsyncedSales, setUnsyncedSales] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [caching, setCaching] = useState(false);
  const [lastCached, setLastCached] = useState<string|null>(null);
  const [lastSync, setLastSync] = useState<string|null>(null);

  // Monitor online status
  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => { setOnline(true); ts(_t('تم الاتصال بالإنترنت','Back online')); };
    const goOffline = () => { setOnline(false); te(_t('انقطع الاتصال - وضع أوفلاين','Connection lost - Offline mode')); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/pos-sw.js').then((reg) => {
        setSwStatus(reg.active ? 'active' : 'installing');
        reg.addEventListener('updatefound', () => setSwStatus('installing'));
        if (reg.active) setSwStatus('active');
      }).catch(() => setSwStatus('none'));

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data.type === 'QUEUE_OFFLINE') {
          await addToLocalQueue(event.data.data);
          refreshStats();
        }
        if (event.data.type === 'SYNC_START') {
          syncNow();
        }
      });
    }
  }, []);

  // Load stats
  const refreshStats = useCallback(async () => {
    try {
      const script = document.createElement('script');
      script.src = '/pos-db.js';
      script.onload = async () => {
        const db = new (window as any).PosDB();
        await db.open();
        const products = await db.getProducts();
        const unsynced = await db.getUnsyncedSales();
        const queue = await db.getPendingQueue();
        setCachedProducts(products.length);
        setUnsyncedSales(unsynced);
        setPendingCount(queue.length);
      };
      if (!(window as any).PosDB) document.head.appendChild(script);
      else {
        const db = new (window as any).PosDB();
        await db.open();
        const products = await db.getProducts();
        const unsynced = await db.getUnsyncedSales();
        const queue = await db.getPendingQueue();
        setCachedProducts(products.length);
        setUnsyncedSales(unsynced);
        setPendingCount(queue.length);
      }
    } catch {}
  }, []);

  useEffect(() => { refreshStats(); }, [refreshStats]);

  // Add to local queue
  const addToLocalQueue = async (item: any) => {
    try {
      const db = new (window as any).PosDB();
      await db.open();
      await db.addToQueue(item);
    } catch {}
  };

  // Cache products for offline use
  const cacheData = async () => {
    setCaching(true);
    try {
      const res = await fetch('/api/pos/sync', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.ok) {
        const data = await res.json();
        const db = new (window as any).PosDB();
        await db.open();
        await db.cacheProducts(data.products || []);
        setCachedProducts(data.products?.length || 0);
        setCachedCustomers(data.customers?.length || 0);
        setLastCached(new Date().toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US'));
        ts(_t(`تم تخزين ${data.products?.length} منتج`, `Cached ${data.products?.length} products`));
      }
    } catch (e: any) { te(e?.message || 'Cache error'); }
    finally { setCaching(false); };
  };

  // Sync offline sales
  const syncNow = async () => {
    if (!online) { te(_t('لا يوجد اتصال','No connection')); return; }
    setSyncing(true);
    try {
      const db = new (window as any).PosDB();
      await db.open();
      const unsynced = await db.getUnsyncedSales();
      if (unsynced.length === 0) { ts(_t('لا يوجد شيء للمزامنة','Nothing to sync')); setSyncing(false); return; }

      const res = await fetch('/api/pos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ sales: unsynced })
      });
      if (res.ok) {
        const result = await res.json();
        // Mark synced
        for (const r of result.results) {
          if (r.status === 'synced') await db.markSaleSynced(r.offlineId);
        }
        setLastSync(new Date().toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US'));
        ts(_t(`تم مزامنة ${result.synced} عملية`, `Synced ${result.synced} transactions`));
        refreshStats();
      }
    } catch (e: any) { te(e?.message || 'Sync error'); }
    finally { setSyncing(false); }
  };

  // Clear synced data
  const clearSynced = async () => {
    try {
      const db = new (window as any).PosDB();
      await db.open();
      const count = await db.clearSyncedQueue();
      ts(_t(`تم حذف ${count} عنصر`, `Cleared ${count} items`));
      refreshStats();
    } catch {}
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {online ? <Wifi size={28} color="#22C55E" /> : <WifiOff size={28} color="#EF4444" />}
            {_t('نقطة البيع - وضع أوفلاين', 'POS - Offline Mode')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t('Service Worker + IndexedDB + Background Sync', 'Service Worker + IndexedDB + Background Sync')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={cacheData} disabled={caching || !online} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={16} /> {caching ? _t('جاري التخزين...', 'Caching...') : _t('تخزين البيانات', 'Cache Data')}
          </button>
          <button className="btn btn-primary" onClick={syncNow} disabled={syncing || !online} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#22C55E' }}>
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? _t('جاري المزامنة...', 'Syncing...') : _t('مزامنة الآن', 'Sync Now')}
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { l: _t('حالة الاتصال', 'Connection'), v: online ? _t('متصل', 'Online') : _t('غير متصل', 'Offline'), c: online ? '#22C55E' : '#EF4444', ic: online ? <Wifi size={20} /> : <WifiOff size={20} /> },
          { l: _t('Service Worker', 'Service Worker'), v: swStatus === 'active' ? _t('نشط', 'Active') : swStatus === 'installing' ? _t('يُثبَّت', 'Installing') : _t('غير مفعل', 'Inactive'), c: swStatus === 'active' ? '#22C55E' : '#EAB308', ic: <Database size={20} /> },
          { l: _t('منتجات مخزنة', 'Cached Products'), v: cachedProducts.toLocaleString(), c: '#3B82F6', ic: <Database size={20} /> },
          { l: _t('عمليات غير متزامنة', 'Unsynced Sales'), v: unsyncedSales.length, c: unsyncedSales.length > 0 ? '#F97316' : '#22C55E', ic: <CloudOff size={20} /> },
          { l: _t('في الانتظار', 'Queue Pending'), v: pendingCount, c: pendingCount > 0 ? '#EAB308' : '#22C55E', ic: <AlertTriangle size={20} /> },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px', borderTop: `3px solid ${s.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.l}</span>
              <span style={{ color: s.c }}>{s.ic}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px', color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--primary)" /> {_t('التخزين المحلي', 'Local Storage')}
          </h3>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '2' }}>
            <div>📦 {_t('المنتجات', 'Products')}: <strong>{cachedProducts}</strong></div>
            <div>👥 {_t('العملاء', 'Customers')}: <strong>{cachedCustomers}</strong></div>
            <div>📅 {_t('آخر تخزين', 'Last Cached')}: <strong>{lastCached || _t('لم يتم', 'Never')}</strong></div>
            <div>🔄 {_t('آخر مزامنة', 'Last Sync')}: <strong>{lastSync || _t('لم يتم', 'Never')}</strong></div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={18} color="#22C55E" /> {_t('كيف يعمل الأوفلاين', 'How Offline Works')}
          </h3>
          <ul style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '2', paddingRight: '20px', margin: 0 }}>
            <li>{_t('خزّن المنتجات محلياً قبل انقطاع الإنترنت', 'Cache products locally before going offline')}</li>
            <li>{_t('أكمل عمليات البيع بدون إنترنت', 'Complete sales without internet')}</li>
            <li>{_t('تُحفظ المعاملات في IndexedDB', 'Transactions saved to IndexedDB')}</li>
            <li>{_t('عند عودة الاتصال: مزامنة تلقائية', 'When back online: auto-sync')}</li>
          </ul>
        </div>
      </div>

      {/* Unsynced Sales Table */}
      {unsyncedSales.length > 0 && (
        <div className="card" style={{ overflow: 'auto', marginBottom: '16px' }}>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
              <CloudOff size={16} style={{ display: 'inline', marginLeft: '6px' }} /> {_t('عمليات غير متزامنة', 'Unsynced Transactions')}
            </h3>
            <button className="btn btn-ghost" onClick={clearSynced} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Trash2 size={14} /> {_t('حذف المتزامن', 'Clear Synced')}
            </button>
          </div>
          <table className="table">
            <thead><tr><th>{_t('المعرف', 'ID')}</th><th>{_t('الإجمالي', 'Total')}</th><th>{_t('الأصناف', 'Items')}</th><th>{_t('التاريخ', 'Date')}</th><th>{_t('الحالة', 'Status')}</th></tr></thead>
            <tbody>
              {unsyncedSales.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{s.id?.substring(0, 16)}...</td>
                  <td style={{ fontWeight: '700' }}>{s.total || 0} {_t('ر.س', 'SAR')}</td>
                  <td>{s.items?.length || 0}</td>
                  <td style={{ fontSize: '12px' }}>{s.createdAt ? new Date(s.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US') : '-'}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', background: s.synced ? '#22C55E20' : '#F9731620', color: s.synced ? '#22C55E' : '#F97316' }}>{s.synced ? _t('متزامن', 'Synced') : _t('في الانتظار', 'Pending')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
