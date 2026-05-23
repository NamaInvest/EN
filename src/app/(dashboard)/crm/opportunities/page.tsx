'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
    name: z.string().min(1, 'اسم الفرصة مطلوب'),
    amount: z.number().min(1, 'المبلغ المتوقع يجب أن يكون أكبر من 0'),
    accountId: z.string().min(1, 'العميل مطلوب'),
    expectedCloseDate: z.string().min(1, 'تاريخ الإغلاق المتوقع مطلوب')
});

type FormValues = z.infer<typeof formSchema>;

export default function CRMOpportunitiesPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [stages, setStages] = useState<any[]>([]);
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // For reason modal (Win/Loss)
    const [reasonModal, setReasonModal] = useState({ show: false, oppId: 0, stageId: 0, title: '', reason: '' });

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            amount: undefined,
            accountId: '',
            expectedCloseDate: ''
        }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/crm/opportunities');
            const data = await res.json();
            if (data.success) {
                setStages(data.data.stages);
                setOpportunities(data.data.opportunities);
                setAccounts(data.data.accounts);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: FormValues) => {
        setSaving(true);
        try {
            const stageId = stages.length > 0 ? stages[0].id.toString() : '';
            const res = await fetch('/api/crm/opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE', payload: { ...data, stageId } })
            });
            if (res.ok) {
                setShowModal(false);
                reset();
                fetchData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const updateStage = async (opportunityId: number, stageId: number, reason: string = '') => {
        try {
            await fetch('/api/crm/opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'UPDATE_STAGE', payload: { opportunityId, stageId, reason } })
            });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDragStart = (e: React.DragEvent, oppId: number) => {
        e.dataTransfer.setData('oppId', oppId.toString());
    };

    const handleDrop = (e: React.DragEvent, stageId: number) => {
        e.preventDefault();
        const oppId = parseInt(e.dataTransfer.getData('oppId'));
        if (!oppId) return;

        const stage = stages.find(s => s.id === stageId);
        
        // If it's a Won or Lost stage, prompt for reason
        if (stage?.isWon || stage?.isLost) {
            setReasonModal({
                show: true, 
                oppId, 
                stageId, 
                title: stage.isWon ? 'سبب الفوز (Won Reason)' : 'سبب الخسارة (Loss Reason)',
                reason: ''
            });
        } else {
            updateStage(oppId, stageId);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleReasonSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateStage(reasonModal.oppId, reasonModal.stageId, reasonModal.reason);
        setReasonModal({ show: false, oppId: 0, stageId: 0, title: '', reason: '' });
    };

    // Calculate forecast (amount * probability)
    const forecast = opportunities.reduce((sum, opp) => sum + (opp.amount * (opp.probability / 100)), 0);

    if (loading && stages.length === 0) return <div className="p-8 text-indigo-600">جاري تحميل الفرص البيعية...</div>;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex justify-between items-center border-b-4 border-indigo-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الفرص البيعية (Opportunity Pipeline)</h1>
                    <p className="text-gray-500 mt-1">تتبع خط سير المبيعات، احتمالات الإغلاق، وتحليل الفوز/الخسارة.</p>
                </div>
                <div className="flex gap-6 items-center">
                    <div className="text-left rtl:text-right hidden sm:block">
                        <div className="text-xs text-gray-500 uppercase">{_t('قيمة التوقع (التوقع قيمة)', 'قيمة التوقع (Forecast Value)')}</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{forecast.toLocaleString()} SAR</div>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold shadow hover:bg-indigo-700"
                    >
                        + فرصة جديدة
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-6 items-start h-[750px]">
                {stages.map(stage => {
                    const stageOpps = opportunities.filter(o => o.stageId === stage.id);
                    const stageTotal = stageOpps.reduce((sum, o) => sum + o.amount, 0);

                    return (
                        <div 
                            key={stage.id} 
                            className={`min-w-[300px] max-w-[300px] rounded-lg shadow-sm border flex flex-col h-full transition-colors ${stage.isWon ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : stage.isLost ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'}`}
                            onDrop={(e) => handleDrop(e, stage.id)}
                            onDragOver={handleDragOver}
                        >
                            <div className={`p-3 border-b rounded-t-lg sticky top-0 ${stage.isWon ? 'bg-green-100 border-green-200 dark:bg-green-900/40 dark:border-green-800' : stage.isLost ? 'bg-red-100 border-red-200 dark:bg-red-900/40 dark:border-red-800' : 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase">{stage.name}</h2>
                                    <span className="text-xs px-2 py-0.5 bg-white dark:bg-gray-700 rounded-full shadow-sm">{stageOpps.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                    <span>{stageTotal.toLocaleString()} SAR</span>
                                    <span>{stage.defaultProbability}%</span>
                                </div>
                            </div>
                            
                            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                                {stageOpps.map(opp => (
                                    <div 
                                        key={opp.id} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, opp.id)}
                                        className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition relative group"
                                    >
                                        <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">{opp.name}</div>
                                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-2">{opp.account?.name || 'No Account'}</div>
                                        
                                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                {opp.amount.toLocaleString()} SAR
                                            </div>
                                            <div className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 rounded text-gray-500">
                                                {opp.probability}%
                                            </div>
                                        </div>

                                        {(opp.wonReason || opp.lostReason) && (
                                            <div className={`mt-2 text-[10px] p-1.5 rounded ${opp.wonReason ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                                <strong>السبب:</strong> {opp.wonReason || opp.lostReason}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {stageOpps.length === 0 && (
                                    <div className="h-full min-h-[100px] flex items-center justify-center text-gray-400 text-xs border-2 border-dashed border-transparent">
                                        اسحب وأفلت هنا
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white border-b pb-2">فرصة بيعية جديدة</h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم الفرصة (Opportunity Name)</label>
                                <input 
                                    type="text" 
                                    className={`mt-1 w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 dark:bg-gray-700 dark:text-white`}
                                    {...register('name')}
                                />
                                {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{_t('العميل (الحساب)', 'العميل (Account)')}</label>
                                <select 
                                    className={`mt-1 w-full border ${errors.accountId ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 dark:bg-gray-700 dark:text-white`}
                                    {...register('accountId')}
                                >
                                    <option value="">-- اختر عميل --</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                                {errors.accountId && <span className="text-red-500 text-xs mt-1 block">{errors.accountId.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المبلغ المتوقع (SAR)</label>
                                <input 
                                    type="number" 
                                    className={`mt-1 w-full border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 dark:bg-gray-700 dark:text-white`}
                                    {...register('amount', { valueAsNumber: true })}
                                />
                                {errors.amount && <span className="text-red-500 text-xs mt-1 block">{errors.amount.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ الإغلاق المتوقع</label>
                                <input 
                                    type="date" 
                                    className={`mt-1 w-full border ${errors.expectedCloseDate ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 dark:bg-gray-700 dark:text-white`}
                                    {...register('expectedCloseDate')}
                                />
                                {errors.expectedCloseDate && <span className="text-red-500 text-xs mt-1 block">{errors.expectedCloseDate.message}</span>}
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                <button type="button" onClick={() => { setShowModal(false); reset(); }} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">إلغاء</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-bold disabled:opacity-50">
                                    {saving ? 'جاري الحفظ...' : 'حفظ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reason Modal */}
            {reasonModal.show && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 border-t-4 border-indigo-600">
                        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{reasonModal.title}</h2>
                        <form onSubmit={handleReasonSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الرجاء كتابة السبب لتحليل البيانات:</label>
                                <textarea 
                                    required rows={3} 
                                    value={reasonModal.reason} 
                                    onChange={e => setReasonModal({...reasonModal, reason: e.target.value})} 
                                    className="mt-1 w-full border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:text-white" 
                                    placeholder="مثال: السعر، المنافس، الجودة..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setReasonModal({show: false, oppId: 0, stageId: 0, title: '', reason: ''})} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">إلغاء</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-bold">تأكيد النقل</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
