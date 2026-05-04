'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, CheckCircle, FileText } from 'lucide-react';

interface Template {
    id: number;
    name: string;
    isDefault: boolean;
    headerMessage: string | null;
    footerMessage: string | null;
    showAging: boolean;
    showPaidInvoices: boolean;
    primaryColor: string | null;
    createdAt: string;
}

export default function CustomerStatementTemplates() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        isDefault: false,
        headerMessage: '',
        footerMessage: '',
        showAging: true,
        showPaidInvoices: false,
        primaryColor: '#000000'
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/accounting/customer-statements/templates');
            const data = await res.json();
            if (Array.isArray(data)) {
                setTemplates(data);
            } else {
                console.error('API Error:', data);
                setTemplates([]);
            }
        } catch (err) {
            console.error('Error fetching templates:', err);
            setTemplates([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (template?: Template) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                name: template.name,
                isDefault: template.isDefault,
                headerMessage: template.headerMessage || '',
                footerMessage: template.footerMessage || '',
                showAging: template.showAging,
                showPaidInvoices: template.showPaidInvoices,
                primaryColor: template.primaryColor || '#000000'
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                name: '',
                isDefault: false,
                headerMessage: '',
                footerMessage: '',
                showAging: true,
                showPaidInvoices: false,
                primaryColor: '#000000'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) return alert('Name is required');
        
        const method = editingTemplate ? 'PUT' : 'POST';
        const url = editingTemplate 
            ? `/api/accounting/customer-statements/templates/${editingTemplate.id}`
            : `/api/accounting/customer-statements/templates`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchTemplates();
            } else {
                alert('Error saving template');
            }
        } catch (err) {
            console.error('Save error:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await fetch(`/api/accounting/customer-statements/templates/${id}`, { method: 'DELETE' });
            fetchTemplates();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        قوالب كشوف الحسابات (Customer Statement Templates)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        تخصيص وإدارة قوالب كشوف حسابات العملاء.
                    </p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    قالب جديد
                </button>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">اسم القالب</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">الحالة</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">أعمار الديون</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">تاريخ الإنشاء</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">جاري التحميل...</td></tr>
                        ) : templates.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">لا توجد قوالب. انقر على "قالب جديد" للبدء.</td></tr>
                        ) : templates.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.primaryColor || '#000' }} />
                                    {t.name}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {t.isDefault ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle className="w-3 h-3" />
                                            افتراضي
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">ثانوي</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {t.showAging ? 'مفعل' : 'معطل'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500" dir="ltr">
                                    {new Date(t.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-center">
                                    <div className="flex justify-center items-center gap-3">
                                        <button onClick={() => handleOpenModal(t)} className="text-blue-600 hover:text-blue-800">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden" dir="rtl">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingTemplate ? 'تعديل القالب' : 'قالب جديد'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* General */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم القالب *</label>
                                    <input 
                                        type="text" 
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder="مثال: قالب كبار العملاء"
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 h-5 w-5"
                                            checked={formData.isDefault}
                                            onChange={e => setFormData({...formData, isDefault: e.target.checked})}
                                        />
                                        <span className="text-sm font-medium text-gray-700">تعيين كقالب افتراضي</span>
                                    </label>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-4 border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-bold text-gray-900">محتوى الكشف</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">الترويسة (Header Message)</label>
                                    <textarea 
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        rows={2}
                                        value={formData.headerMessage}
                                        onChange={e => setFormData({...formData, headerMessage: e.target.value})}
                                        placeholder="رسالة ترحيبية تظهر في أعلى كشف الحساب..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">التذييل (Footer Message / Bank Details)</label>
                                    <textarea 
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                        value={formData.footerMessage}
                                        onChange={e => setFormData({...formData, footerMessage: e.target.value})}
                                        placeholder="مثال: يرجى تحويل المستحقات على حساب الآيبان SA1234..."
                                    />
                                </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-4 border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-bold text-gray-900">إعدادات العرض</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 h-5 w-5"
                                            checked={formData.showAging}
                                            onChange={e => setFormData({...formData, showAging: e.target.checked})}
                                        />
                                        <span className="text-sm font-medium text-gray-700">إظهار جدول أعمار الديون (Aging)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 h-5 w-5"
                                            checked={formData.showPaidInvoices}
                                            onChange={e => setFormData({...formData, showPaidInvoices: e.target.checked})}
                                        />
                                        <span className="text-sm font-medium text-gray-700">إظهار الفواتير المسددة بالكامل</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">لون العلامة التجارية</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="color" 
                                            className="w-10 h-10 rounded border-0 p-0 cursor-pointer"
                                            value={formData.primaryColor}
                                            onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                                        />
                                        <span className="text-sm text-gray-500">{formData.primaryColor}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                إلغاء
                            </button>
                            <button 
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                                حفظ القالب
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
