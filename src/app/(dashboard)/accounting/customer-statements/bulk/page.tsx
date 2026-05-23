'use client';
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { FileText, Play, Eye, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function BulkRunPage() {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [segment, setSegment] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [templates, setTemplates] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [previewCount, setPreviewCount] = useState<number | null>(null);

    useEffect(() => {
        // Set default dates to current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        setDateFrom(firstDay.toISOString().split('T')[0]);
        setDateTo(now.toISOString().split('T')[0]);

        fetchTemplates();
        fetchBatches();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/accounting/customer-statements/templates');
            const data = await res.json();
            if (Array.isArray(data)) {
                setTemplates(data);
                const def = data.find(t => t.isDefault);
                if (def) setTemplateId(def.id.toString());
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchBatches = async () => {
        try {
            const res = await fetch('/api/accounting/customer-statements/bulk/history');
            const data = await res.json();
            if (Array.isArray(data)) {
                setBatches(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handlePreview = async () => {
        setPreviewLoading(true);
        try {
            const res = await fetch(`/api/accounting/customer-statements/bulk/preview?segment=${segment}`);
            const data = await res.json();
            if (data.count !== undefined) {
                setPreviewCount(data.count);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleRun = async () => {
        if (!dateFrom || !dateTo) {
            toastWarning('يرجى تحديد تاريخ البداية والنهاية');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/accounting/customer-statements/bulk/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ segment, dateFrom, dateTo, templateId })
            });
            const data = await res.json();
            if (res.ok) {
                toastSuccess(`تم بدء تشغيل الدفعة ${data.batch.batchNumber} بنجاح!`);
                fetchBatches();
            } else {
                toastError(data.error || 'حدث خطأ أثناء التشغيل');
            }
        } catch (e) {
            console.error(e);
            toastError('حدث خطأ بالاتصال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    التشغيل المجمع (Bulk Statement Run)
                </h1>
                <p className="text-gray-500 mt-2">إنشاء وإرسال كشوف حسابات لعدة عملاء دفعة واحدة وتتبع الإرساليات.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Configuration Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">إعدادات الدُفعة (Batch Parameters)</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">شريحة العملاء</label>
                            <select 
                                value={segment}
                                onChange={(e) => setSegment(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">{_t('كل العملاء النشطين (All نشط)', 'كل العملاء النشطين (All Active)')}</option>
                                <option value="vip">كبار العملاء (VIP)</option>
                                <option value="overdue">{_t('متأخرين في السداد (متأخر الرصيد)', 'متأخرين في السداد (Overdue Balance)')}</option>
                            </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">من تاريخ</label>
                                <input 
                                    type="date" 
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">إلى تاريخ</label>
                                <input 
                                    type="date" 
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">القالب المخصص (Template Override)</label>
                            <select 
                                value={templateId}
                                onChange={(e) => setTemplateId(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">استخدام القالب الافتراضي</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {previewCount !== null && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
                                <Eye className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900">العدد التقديري للعملاء: {previewCount}</p>
                                    <p className="text-xs text-blue-700 mt-1">هؤلاء العملاء سيتم إرسال كشوف الحساب إليهم.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        <button 
                            onClick={handlePreview}
                            disabled={previewLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${previewLoading ? 'animate-spin' : ''}`} />
                            معاينة العدد
                        </button>
                        <button 
                            onClick={handleRun} 
                            disabled={loading || previewCount === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Play className="w-4 h-4" />
                            {loading ? 'جاري التنفيذ...' : 'بدء التشغيل المجمع'}
                        </button>
                    </div>
                </div>

                {/* History Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">سجل الدفعات (Batches History)</h2>
                        <button onClick={fetchBatches} className="text-gray-500 hover:text-blue-600">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-0">
                        {batches.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">لا يوجد دفعات سابقة</div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {batches.map(batch => (
                                    <li key={batch.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900">{batch.batchNumber}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(batch.startedAt).toLocaleString('ar-SA')}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                                                    batch.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                    batch.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {batch.status === 'COMPLETED' && <CheckCircle className="w-3 h-3" />}
                                                    {batch.status === 'PROCESSING' && <RefreshCw className="w-3 h-3 animate-spin" />}
                                                    {batch.status === 'FAILED' && <AlertTriangle className="w-3 h-3" />}
                                                    {batch.status === 'COMPLETED' ? 'مكتمل' : batch.status === 'PROCESSING' ? 'جاري التشغيل' : 'فشل'}
                                                </span>
                                                <span className="text-xs text-gray-600 font-medium">
                                                    {batch.processedCount} / {batch.totalCount} كشف
                                                </span>
                                            </div>
                                        </div>
                                        {batch.status === 'COMPLETED' && (
                                            <div className="mt-3 bg-gray-100 rounded-md p-2 flex justify-between text-xs font-medium text-gray-700">
                                                <span className="text-green-600">نجاح: {batch.successCount}</span>
                                                <span className="text-red-600">فشل: {batch.failedCount}</span>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
