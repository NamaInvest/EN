'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export function useOfflineSync() {
    const [isOffline, setIsOffline] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    // Initial check
    useEffect(() => {
        setIsOffline(!navigator.onLine);

        const handleOnline = () => {
            setIsOffline(false);
            toast.success('تمت استعادة الاتصال بالإنترنت', { position: 'top-left' });
            syncPendingInvoices();
        };
        const handleOffline = () => {
            setIsOffline(true);
            toast.error('انقطع الاتصال بالإنترنت - يتم العمل على قاعدة البيانات المحلية', { position: 'top-left', duration: 5000 });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        refreshPendingCount();
        
        // Auto sync every 1 minute if online
        const interval = setInterval(() => {
            if (navigator.onLine) syncPendingInvoices();
        }, 60000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const refreshPendingCount = useCallback(async () => {
        if (typeof window === 'undefined' || !(window as any).electron) return;
        try {
            const pending = await (window as any).electron.invoke('offline-db-get-pending');
            setPendingCount(pending?.length || 0);
        } catch (e) {}
    }, []);

    const syncPendingInvoices = useCallback(async () => {
        if (typeof window === 'undefined' || !(window as any).electron || isSyncing || !navigator.onLine) return;
        
        try {
            const pending = await (window as any).electron.invoke('offline-db-get-pending');
            if (!pending || pending.length === 0) return;

            setIsSyncing(true);
            setPendingCount(pending.length);

            let successCount = 0;
            for (const invoice of pending) {
                try {
                    // Skip if retried too many times
                    if (invoice.retryCount > 10) continue;

                    // Send to server
                    // Send to server using custom endpoint if provided
                    const endpoint = invoice.data._endpoint || '/api/pos';
                    const payload = { ...invoice.data };
                    delete payload._endpoint; // remove internal marker
                    
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();
                    if (data.success) {
                        await (window as any).electron.invoke('offline-db-mark-synced', invoice.uuid);
                        successCount++;
                    } else {
                        await (window as any).electron.invoke('offline-db-increment-retry', invoice.uuid);
                    }
                } catch (e) {
                    await (window as any).electron.invoke('offline-db-increment-retry', invoice.uuid);
                }
            }

            if (successCount > 0) {
                toast.success(`تمت مزامنة ${successCount} فاتورة مع السحابة بنجاح`);
                // Clear synced
                await (window as any).electron.invoke('offline-db-delete-synced');
            }
        } catch (e) {
            console.error('Sync error:', e);
        } finally {
            setIsSyncing(false);
            refreshPendingCount();
        }
    }, [isSyncing, refreshPendingCount]);

    // Save invoice either remotely or locally
    const saveInvoiceWithSync = async (invoiceData: any, endpoint = '/api/pos') => {
        if (isOffline) {
            if ((window as any).electron) {
                const dataWithEndpoint = { ...invoiceData, _endpoint: endpoint };
                const uuid = await (window as any).electron.invoke('offline-db-save-invoice', dataWithEndpoint);
                if (uuid) {
                    toast.success('تم الحفظ محلياً (Offline)', { icon: '💾' });
                    refreshPendingCount();
                    return { success: true, offline: true, uuid };
                }
            }
            toast.error('فشل الحفظ - البرنامج غير متصل بالخادم ولا يدعم الحفظ المحلي');
            return { success: false, error: 'Offline without local DB' };
        } else {
            // Online save
            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceData)
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                return { success: true, offline: false, ...data };
            } catch (e: any) {
                // If it fails due to sudden disconnect, try to save locally
                if ((window as any).electron) {
                    const dataWithEndpoint = { ...invoiceData, _endpoint: endpoint };
                    const uuid = await (window as any).electron.invoke('offline-db-save-invoice', dataWithEndpoint);
                    if (uuid) {
                        toast.error('فشل الاتصال - تم حفظ الفاتورة محلياً وسيتم رفعها لاحقاً');
                        refreshPendingCount();
                        return { success: true, offline: true, uuid };
                    }
                }
                return { success: false, error: e.message };
            }
        }
    };

    const OfflineBadge = () => {
        if (typeof window === 'undefined' || !(window as any).electron) return null; // Only show on desktop

        return (
            <div className="flex items-center gap-3">
                {isOffline ? (
                    <div className="flex items-center gap-2 bg-red-900/40 text-red-400 px-3 py-1.5 rounded-full border border-red-800/50 text-sm font-bold animate-pulse">
                        <WifiOff size={16} />
                        <span>غير متصل (Offline)</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-emerald-900/40 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-800/50 text-sm font-bold">
                        <Wifi size={16} />
                        <span>متصل بالسحابة</span>
                    </div>
                )}

                {pendingCount > 0 && (
                    <button 
                        onClick={() => !isOffline && syncPendingInvoices()}
                        disabled={isOffline || isSyncing}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                            isOffline 
                                ? 'bg-orange-900/40 text-orange-400 border border-orange-800/50 cursor-not-allowed'
                                : 'bg-blue-900/40 text-blue-400 border border-blue-800/50 hover:bg-blue-800/50 cursor-pointer'
                        }`}
                        title="مزامنة الفواتير"
                    >
                        {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : (isOffline ? <CloudOff size={16} /> : <Cloud size={16} />)}
                        <span>{pendingCount} بانتظار الرفع</span>
                    </button>
                )}
            </div>
        );
    };

    // Cache products manually
    const cacheProducts = async (products: any[]) => {
        if ((window as any).electron && products.length > 0) {
            await (window as any).electron.invoke('offline-db-save-products', products);
        }
    };

    return {
        isOffline,
        pendingCount,
        isSyncing,
        saveInvoiceWithSync,
        OfflineBadge,
        syncPendingInvoices,
        cacheProducts,
        refreshPendingCount
    };
}
