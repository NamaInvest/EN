'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function PayrollConfigPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [config, setConfig] = useState<any>({
        basicSalary: '',
        housingAllowance: '',
        transportAllowance: '',
        otherAllowance: '',
        gosiDeduction: '',
        unpaidLeaveDeduction: '',
        netPayableLiability: ''
    });
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/hr/payroll/config');
            const data = await res.json();
            if (data.success) {
                // Merge loaded config with default empty strings
                setConfig({
                    basicSalary: data.data.config.basicSalary || '',
                    housingAllowance: data.data.config.housingAllowance || '',
                    transportAllowance: data.data.config.transportAllowance || '',
                    otherAllowance: data.data.config.otherAllowance || '',
                    gosiDeduction: data.data.config.gosiDeduction || '',
                    unpaidLeaveDeduction: data.data.config.unpaidLeaveDeduction || '',
                    netPayableLiability: data.data.config.netPayableLiability || ''
                });
                setAccounts(data.data.accounts);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/hr/payroll/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config })
            });
            const result = await res.json();
            if (res.ok) {
                alert(result.message);
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }));
    };

    const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE');
    const liabilityAccounts = accounts.filter(a => a.type === 'LIABILITY');

    if (loading) return <div className="p-8 text-indigo-600">جاري تحميل إعدادات مسير الرواتب المحاسبية...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-b-4 border-indigo-600">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إعدادات الرواتب المحاسبية (Payroll GL Mapping)</h1>
                <p className="text-gray-500 mt-1">ربط مكونات الراتب بشجرة الحسابات (COA) لتوليد قيود الرواتب آلياً.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 dark:border-gray-700">1. حسابات المصاريف (الطرف المدين Dr)</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الراتب الأساسي (Basic Salary)</label>
                            <select 
                                required value={config.basicSalary} onChange={e => handleChange('basicSalary', e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">اختر الحساب...</option>
                                {expenseAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">بدل السكن (Housing Allowance)</label>
                            <select 
                                required value={config.housingAllowance} onChange={e => handleChange('housingAllowance', e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">اختر الحساب...</option>
                                {expenseAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">بدل النقل (Transport Allowance)</label>
                            <select 
                                required value={config.transportAllowance} onChange={e => handleChange('transportAllowance', e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">اختر الحساب...</option>
                                {expenseAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">بدلات أخرى (Other Allowances)</label>
                            <select 
                                required value={config.otherAllowance} onChange={e => handleChange('otherAllowance', e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">اختر الحساب...</option>
                                {expenseAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 dark:border-gray-700">2. حسابات الخصوم والاستقطاعات (الطرف الدائن Cr)</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">صافي الرواتب المستحقة الدفع (Net Payable Liability)</label>
                            <select 
                                required value={config.netPayableLiability} onChange={e => handleChange('netPayableLiability', e.target.value)}
                                className="w-full border-indigo-300 rounded-md shadow-sm p-2 bg-indigo-50 dark:bg-indigo-900 dark:text-white"
                            >
                                <option value="">اختر الحساب (مطلوب)</option>
                                {liabilityAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">يُسجل فيه إجمالي المبلغ المستحق للموظفين بعد الخصومات.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">استقطاع التأمينات الاجتماعية (GOSI Payable)</label>
                            <select 
                                required value={config.gosiDeduction} onChange={e => handleChange('gosiDeduction', e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">اختر الحساب...</option>
                                {liabilityAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">حساب غياب بدون عذر / خصومات أخرى</label>
                            <select 
                                required value={config.unpaidLeaveDeduction} onChange={e => handleChange('unpaidLeaveDeduction', e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">اختر الحساب...</option>
                                {/* Usually an expense reduction or a liability if paid to a specific fund */}
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-md font-bold text-lg hover:bg-indigo-700 shadow-lg disabled:opacity-50"
                    >
                        {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات المحاسبية'}
                    </button>
                </div>
            </form>
        </div>
    );
}
