'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

import { useToast } from '@/components/Toast';

export default function BankReconRulesPage() {
  const { lang } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [rules, setRules] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [priority, setPriority] = useState('100');
    const [bankAccountId, setBankAccountId] = useState('');
    const [descriptionContains, setDescriptionContains] = useState('');
    const [action, setAction] = useState('CREATE_JE');

    // Simulator State
    const [simDesc, setSimDesc] = useState('POS PURCHASE TERMINAL 1234');
    const [simAmount, setSimAmount] = useState('100');
    const [simResult, setSimResult] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/finance/bank-recon/rules');
            const data = await res.json();
            if (res.ok) {
                setRules(data.data.rules);
                setBankAccounts(data.data.bankAccounts);
                setStats(data.data.stats);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const conditions = [];
        if (descriptionContains) {
            conditions.push({ field: 'description', operator: 'contains', value: descriptionContains });
        }

        try {
            const res = await fetch('/api/finance/bank-recon/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    priority,
                    bankAccountId: bankAccountId === 'ALL' ? null : bankAccountId,
                    conditions,
                    action,
                    actionParams: {} // simplified
                })
            });
            if (res.ok) {
                toastSuccess('تم إنشاء القاعدة بنجاح');
                setIsModalOpen(false);
                setName(''); setDescriptionContains('');
                fetchData();
            } else {
                const err = await res.json();
                toastError(err.error);
            }
        } catch (error) {
            console.error(error);
            toastError('حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    const toggleRule = async (id: number, currentStatus: boolean) => {
        try {
            await fetch('/api/finance/bank-recon/rules', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, enabled: !currentStatus })
            });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const deleteRule = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذه القاعدة؟')) return;
        try {
            await fetch(`/api/finance/bank-recon/rules?id=${id}`, { method: 'DELETE' });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSimulate = async () => {
        try {
            const res = await fetch('/api/finance/bank-recon/rules/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: simDesc, amount: simAmount })
            });
            const data = await res.json();
            if (res.ok) {
                setSimResult(data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading && rules.length === 0) return <div className="p-8 text-blue-600">جاري تحميل قواعد المطابقة البنكية...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-b-4 border-indigo-500">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">بناء قواعد المطابقة البنكية الذكية</h1>
                    <p className="text-gray-500 mt-1">إنشاء قواعد تلقائية لمعالجة كشوفات الحساب البنكية وإنشاء القيود (Bank Recon Rule Builder)</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-bold"
                >
                    + إنشاء قاعدة جديدة
                </button>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center border-l-4 border-blue-500">
                        <p className="text-gray-500 text-sm">إجمالي القواعد المضافة</p>
                        <p className="text-2xl font-black text-gray-800 dark:text-white">{stats.totalRules}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center border-l-4 border-green-500">
                        <p className="text-gray-500 text-sm">القواعد النشطة حالياً</p>
                        <p className="text-2xl font-black text-green-600">{stats.activeRules}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center border-l-4 border-purple-500">
                        <p className="text-gray-500 text-sm">عدد الحركات المطابقة آلياً</p>
                        <p className="text-2xl font-black text-purple-600">{stats.successfulMatches}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rules List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold dark:text-white mb-2">القواعد الحالية (حسب الأولوية)</h2>
                    
                    {rules.length === 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center border border-dashed border-gray-300">
                            لا توجد قواعد مضافة حتى الآن.
                        </div>
                    )}

                    {rules.map(rule => (
                        <div key={rule.id} className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center gap-4 border-l-4 ${rule.enabled ? 'border-green-500' : 'border-gray-400 opacity-70'}`}>
                            <div className="text-center w-12 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                <span className="block text-xs text-gray-500">أولوية</span>
                                <span className="font-bold text-gray-800 dark:text-white">{rule.priority}</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg dark:text-white">{rule.name}</h3>
                                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                                        الحساب: {rule.bankAccount ? rule.bankAccount.bankName : 'جميع الحسابات'}
                                    </span>
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
                                        الإجراء: {rule.action}
                                    </span>
                                </div>
                                <div className="text-sm font-mono text-gray-500 mt-2 bg-gray-50 dark:bg-gray-900 p-2 rounded border dark:border-gray-700">
                                    {typeof rule.conditions === 'string' ? rule.conditions : JSON.stringify(rule.conditions)}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => toggleRule(rule.id, rule.enabled)}
                                    className={`px-3 py-1 rounded text-sm font-bold w-20 text-center ${rule.enabled ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}
                                >
                                    {rule.enabled ? 'تعطيل' : 'تفعيل'}
                                </button>
                                <button 
                                    onClick={() => deleteRule(rule.id)}
                                    className="px-3 py-1 rounded text-sm font-bold bg-red-100 text-red-700 hover:bg-red-200"
                                >
                                    حذف
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Simulator Panel */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-fit border border-indigo-100 dark:border-indigo-900">
                    <h2 className="text-xl font-bold dark:text-white mb-4">محاكي اختبار القواعد (Simulator)</h2>
                    <p className="text-sm text-gray-500 mb-4">أدخل تفاصيل حركة بنكية لتجربة محرك القواعد.</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وصف الحركة البنكية</label>
                            <input 
                                type="text" 
                                value={simDesc} onChange={e => setSimDesc(e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ</label>
                            <input 
                                type="number" 
                                value={simAmount} onChange={e => setSimAmount(e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <button 
                            onClick={handleSimulate}
                            className="w-full bg-indigo-100 text-indigo-700 border border-indigo-300 p-2 rounded-md font-bold hover:bg-indigo-200"
                        >
                            تشغيل المحاكي
                        </button>
                    </div>

                    {simResult && (
                        <div className="mt-6 border-t pt-4">
                            <h3 className="font-bold mb-2 dark:text-white">نتيجة المطابقة:</h3>
                            {simResult.matchFound ? (
                                <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded text-sm">
                                    <p className="font-bold">✅ تم العثور على قاعدة مطابقة!</p>
                                    <p>القاعدة: {simResult.ruleName}</p>
                                    <p>الإجراء: {simResult.action}</p>
                                    <p>نسبة الموثوقية: {simResult.confidenceScore}%</p>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-200 text-gray-600 p-3 rounded text-sm">
                                    ❌ لم يتم العثور على قاعدة مطابقة لهذه الحركة. سيتطلب تدخل يدوي.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">إضافة قاعدة مطابقة جديدة</h2>
                        <form onSubmit={handleCreateRule} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم القاعدة</label>
                                <input 
                                    type="text" required 
                                    value={name} onChange={e => setName(e.target.value)}
                                    placeholder="مثال: رسوم نقاط البيع"
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تطبق على حساب</label>
                                    <select 
                                        value={bankAccountId} onChange={e => setBankAccountId(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="ALL">جميع الحسابات</option>
                                        {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.currency}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الأولوية (الأقل أولاً)</label>
                                    <input 
                                        type="number" required min="1"
                                        value={priority} onChange={e => setPriority(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-indigo-600 mb-2">شروط المطابقة (Conditions)</h4>
                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">وصف الحركة يحتوي على (Contains Regex):</label>
                                    <input 
                                        type="text" required 
                                        value={descriptionContains} onChange={e => setDescriptionContains(e.target.value)}
                                        placeholder="مثال: POS PURCHASE"
                                        className="w-full border-gray-300 rounded shadow-sm p-1.5 text-sm dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الإجراء الآلي (Action)</label>
                                <select 
                                    value={action} onChange={e => setAction(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white font-bold"
                                >
                                    <option value="CREATE_JE">إنشاء قيد يومية (Create JE)</option>
                                    <option value="MATCH_TO_CUSTOMER">تسوية مع عميل (Match AR)</option>
                                    <option value="MATCH_TO_VENDOR">تسوية مع مورد (Match AP)</option>
                                    <option value="IGNORE">تجاهل / استبعاد (Ignore)</option>
                                </select>
                            </div>
                            
                            <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">إلغاء</button>
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold hover:bg-indigo-700" disabled={loading}>
                                    حفظ وتفعيل
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
