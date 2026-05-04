"use client";

import React, { useState } from 'react';
import { FileText, Play } from 'lucide-react';

export default function BulkRunPage() {
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        setTimeout(() => {
            alert('Bulk batch submitted successfully');
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    التشغيل المجمع (Bulk Statement Run)
                </h1>
                <p className="text-gray-500 mt-2">إنشاء وإرسال كشوف حسابات لعدة عملاء دفعة واحدة.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">إعدادات الدُفعة (Batch Parameters)</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">شريحة العملاء (Customer Segment)</label>
                        <select className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            <option value="all">كل العملاء النشطين (All Active)</option>
                            <option value="vip">كبار العملاء (VIP)</option>
                            <option value="overdue">متأخرين في السداد (Overdue Balance)</option>
                        </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">من تاريخ</label>
                            <input type="date" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">إلى تاريخ</label>
                            <input type="date" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">القالب (Template Override)</label>
                        <select className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            <option value="default">استخدام القالب الافتراضي</option>
                            <option value="1">قالب كبار العملاء</option>
                        </select>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        معاينة العدد
                    </button>
                    <button 
                        onClick={handleRun} 
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Play className="w-4 h-4" />
                        {loading ? 'جاري التنفيذ...' : 'بدء التشغيل المجمع'}
                    </button>
                </div>
            </div>
        </div>
    );
}
