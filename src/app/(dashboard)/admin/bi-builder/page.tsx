'use client';
import React, { useState } from 'react';
import { BarChart3, Settings, Table as TableIcon, Download, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MODELS = ['SalesInvoice', 'PurchaseInvoice', 'Customer', 'Product', 'JournalEntry', 'Employee'];
const MODEL_FIELDS: Record<string, string[]> = {
    'SalesInvoice': ['id', 'invoiceNo', 'date', 'total', 'status', 'remaining', 'taxValue'],
    'PurchaseInvoice': ['id', 'invoiceNo', 'date', 'total', 'status', 'remaining', 'supplierInvoiceNo'],
    'Customer': ['id', 'name', 'phone', 'customerType', 'isActive', 'balance'],
    'Product': ['id', 'name', 'barcode', 'category', 'price', 'type'],
    'JournalEntry': ['id', 'entryNumber', 'entryDate', 'totalDebit', 'totalCredit', 'status'],
    'Employee': ['id', 'name', 'position', 'salary', 'active', 'nationality']
};

export default function BIBuilderDashboard() {
    const [selectedModel, setSelectedModel] = useState<string>('SalesInvoice');
    const [selectedFields, setSelectedFields] = useState<string[]>(['id', 'invoiceNo', 'total']);
    const [limit, setLimit] = useState<number>(50);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleField = (field: string) => {
        setSelectedFields(prev => 
            prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
        );
    };

    const runQuery = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/bi/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: selectedModel, fields: selectedFields, limit })
            });
            const data = await res.json();
            if (data.success) {
                setResults(data.data);
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const downloadCSV = () => {
        if (results.length === 0) return;
        const headers = selectedFields.join(',');
        const rows = results.map(row => selectedFields.map(f => `"${row[f] ?? ''}"`).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_${selectedModel}.csv`;
        a.click();
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
            <h1 className="text-3xl font-bold flex items-center gap-2 text-indigo-900">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
                منشئ تقارير BI المخصصة
            </h1>
            <p className="text-gray-500">صمّم تقاريرك ديناميكياً وصدّرها إلى CSV.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border space-y-6">
                    <h2 className="font-semibold flex items-center gap-2"><Settings className="w-4 h-4"/> مصدر البيانات</h2>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-600">الجدول الأساسي</label>
                        <select
                            className="w-full border p-2 rounded"
                            value={selectedModel}
                            onChange={(e) => {
                                setSelectedModel(e.target.value);
                                setSelectedFields([]);
                            }}
                        >
                            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-600">اختر الأعمدة</label>
                        <div className="h-48 overflow-y-auto border rounded p-2 space-y-2 bg-gray-50">
                            {MODEL_FIELDS[selectedModel]?.map(f => (
                                <label key={f} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedFields.includes(f)}
                                        onChange={() => toggleField(f)}
                                    />
                                    {f}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-600">عدد الصفوف</label>
                        <input
                            type="number"
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="w-full border p-2 rounded"
                        />
                    </div>

                    <Button onClick={runQuery} disabled={loading || selectedFields.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex gap-2">
                        <Play className="w-4 h-4"/> تنفيذ التقرير
                    </Button>
                </div>

                <div className="col-span-3 bg-white p-6 rounded-xl shadow-sm border flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold flex items-center gap-2"><TableIcon className="w-5 h-5"/> معاينة التقرير</h2>
                        <Button onClick={downloadCSV} variant="outline" disabled={results.length === 0} className="flex gap-2">
                            <Download className="w-4 h-4"/> تصدير CSV
                        </Button>
                    </div>

                    <div className="flex-1 overflow-auto border rounded bg-gray-50 min-h-[400px]">
                        {results.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                {loading ? 'جاري التنفيذ...' : 'لا توجد بيانات. اختر الأعمدة ثم نفّذ.'}
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-gray-200 sticky top-0">
                                    <tr>
                                        {selectedFields.map(f => (
                                            <th key={f} className="p-3 border-b border-gray-300 font-semibold">{f}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((row, idx) => (
                                        <tr key={idx} className="border-b bg-white hover:bg-gray-50">
                                            {selectedFields.map(f => (
                                                <td key={f} className="p-3">
                                                    {row[f] instanceof Date 
                                                        ? new Date(row[f]).toLocaleDateString() 
                                                        : String(row[f] ?? '-')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 text-right">
                        Showing {results.length} records
                    </div>
                </div>
            </div>
        </div>
    );
}
