'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormSelect } from '@/components/forms/FormSelect';
import { z } from 'zod';

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED'];

const formSchema = z.object({
    companyName: z.string().min(1, 'اسم الشركة مطلوب'),
    contactPerson: z.string().min(1, 'الشخص المسؤول مطلوب'),
    email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
    phone: z.string().optional(),
    source: z.string().optional(),
    industry: z.string().optional(),
    expectedRevenue: z.number().min(0, 'يجب أن يكون مبلغ الإيراد 0 أو أكثر').optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function CRMLeadsPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/crm/leads');
            const data = await res.json();
            if (data.success) {
                setLeads(data.data);
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
            const res = await fetch('/api/crm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE', payload: data })
            });
            if (res.ok) {
                setShowModal(false);
                fetchLeads();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateStatus = async (leadId: number, status: string) => {
        try {
            await fetch('/api/crm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'UPDATE_STATUS', payload: { leadId, status } })
            });
            fetchLeads();
        } catch (error) {
            console.error(error);
        }
    };

    const handleConvertToOpp = async (leadId: number) => {
        if (!confirm('هل تريد تحويل هذا العميل المحتمل إلى فرصة بيعية حقيقية (Opportunity)؟')) return;
        try {
            await fetch('/api/crm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CONVERT_TO_OPPORTUNITY', payload: { leadId } })
            });
            fetchLeads();
        } catch (error) {
            console.error(error);
        }
    };

    // Calculate total pipeline value
    const pipelineValue = leads.filter(l => l.status !== 'DISQUALIFIED' && l.status !== 'CONVERTED')
                               .reduce((sum, l) => sum + (Number(l.expectedRevenue) || 0), 0);

    if (loading && leads.length === 0) return <div className="p-8 text-indigo-600">جاري تحميل العملاء المحتملين...</div>;

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex justify-between items-center border-b-4 border-indigo-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة العملاء المحتملين (Leads Pipeline & Scoring)</h1>
                    <p className="text-gray-500 mt-1">تتبع العملاء المحتملين مع نظام تقييم تلقائي (Scoring) بناءً على الإيرادات والاكتمال.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-left rtl:text-right hidden sm:block">
                        <div className="text-xs text-gray-500 uppercase">قيمة خط الأنابيب (Pipeline)</div>
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{pipelineValue.toLocaleString()} SAR</div>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md font-bold shadow hover:bg-indigo-700"
                    >
                        + إضافة Lead
                    </button>
                </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 items-start">
                {STAGES.map(stage => {
                    const stageLeads = leads.filter(l => l.status === stage);
                    
                    return (
                        <div key={stage} className="min-w-[320px] max-w-[320px] bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[700px]">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-t-lg flex justify-between items-center sticky top-0">
                                <h2 className="font-bold text-gray-700 dark:text-gray-300">{stage}</h2>
                                <span className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full shadow-sm">{stageLeads.length}</span>
                            </div>
                            
                            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                                {stageLeads.map(lead => (
                                    <div key={lead.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate" title={lead.companyName}>{lead.companyName}</h3>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold" title="Lead Score">
                                                    ⭐ {lead.score}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">👤 {lead.contactPerson}</div>
                                        {lead.phone && <div className="text-xs text-gray-500">📞 {lead.phone}</div>}
                                        
                                        <div className="mt-3 flex justify-between items-end border-t border-gray-100 dark:border-gray-700 pt-2">
                                            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                {Number(lead.expectedRevenue).toLocaleString()} SAR
                                            </div>
                                            <div className="text-[10px] text-gray-400">{lead.source}</div>
                                        </div>

                                        {/* Actions (Visible on hover) */}
                                        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <select 
                                                value="" 
                                                onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                                                className="w-full text-xs border-gray-300 rounded p-1 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="" disabled>نقل إلى...</option>
                                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            
                                            {stage === 'QUALIFIED' && (
                                                <button 
                                                    onClick={() => handleConvertToOpp(lead.id)}
                                                    className="bg-green-100 text-green-700 p-1 rounded text-xs font-bold hover:bg-green-200"
                                                    title="Convert to Opportunity"
                                                >
                                                    تحويل
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {stageLeads.length === 0 && (
                                    <div className="text-center text-sm text-gray-400 mt-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        لا يوجد
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                
                {/* Converted Column (Read-Only) */}
                <div className="min-w-[320px] max-w-[320px] bg-green-50 dark:bg-green-900/10 rounded-lg shadow-sm border border-green-200 dark:border-green-800 flex flex-col h-[700px] opacity-75">
                    <div className="p-4 border-b border-green-200 dark:border-green-800 bg-green-100 dark:bg-green-900/30 rounded-t-lg flex justify-between items-center">
                        <h2 className="font-bold text-green-700 dark:text-green-400">{_t('المحولة (الفرص)', 'CONVERTED (Opportunities)')}</h2>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto flex-1">
                        {leads.filter(l => l.status === 'CONVERTED').map(lead => (
                            <div key={lead.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-green-200 dark:border-green-700">
                                <div className="font-bold text-gray-900 dark:text-white line-through">{lead.companyName}</div>
                                <div className="text-xs text-green-600 mt-1">✓ تم التحويل لفرصة بيعية</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white border-b pb-2">إضافة عميل محتمل (Lead)</h2>
                        <Form<typeof formSchema> 
                            schema={formSchema}
                            defaultValues={{
                                companyName: '',
                                contactPerson: '',
                                email: '',
                                phone: '',
                                source: 'Website',
                                industry: '',
                                expectedRevenue: undefined
                            }}
                            onSubmit={onSubmit}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <FormField name="companyName" label="اسم الشركة" />
                                <FormField name="contactPerson" label="الشخص المسؤول (Contact)" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField name="email" type="email" label="البريد الإلكتروني" />
                                <FormField name="phone" label="رقم الهاتف" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <FormSelect
                                    name="source"
                                    label="المصدر (Source)"
                                    defaultValue="Website"
                                    options={[
                                        { value: 'Website', label: 'موقع إلكتروني' },
                                        { value: 'Referral', label: 'إحالة' },
                                        { value: 'Cold Call', label: 'اتصال مباشر' },
                                        { value: 'Social Media', label: 'شبكات تواصل' },
                                        { value: 'Exhibition', label: 'معرض/مؤتمر' },
                                    ]}
                                />
                                <FormField name="industry" label="الصناعة / المجال" />
                                <FormField name="expectedRevenue" type="number" label="الإيراد المتوقع (SAR)" />
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">إلغاء</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-bold disabled:opacity-50">
                                    {saving ? 'جاري الحفظ...' : 'حفظ العميل'}
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            )}
        </div>
    );
}
