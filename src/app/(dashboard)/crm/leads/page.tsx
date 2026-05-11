'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormSelect } from '@/components/forms/FormSelect';
import { z } from 'zod';
import { Users, Phone, DollarSign, Star, Plus, X, Search, ChevronRight, Activity, ArrowRightLeft, Building2 } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <style dangerouslySetInnerHTML={{ __html: fontImport }} />
            
            <div className="max-w-screen-2xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 gap-4">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl relative overflow-hidden group">
                      <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">إدارة العملاء المحتملين (Leads)</h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">تتبع العملاء المحتملين مع نظام تقييم تلقائي (Scoring) بناءً على الإيرادات والاكتمال.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                      <div className="hidden sm:block text-left rtl:text-right border-r rtl:border-l rtl:border-r-0 border-slate-200 dark:border-slate-700 rtl:pl-6 pr-6">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">قيمة خط الأنابيب (Pipeline)</p>
                          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-[Fira_Code]">{pipelineValue.toLocaleString()} SAR</p>
                      </div>
                      <button 
                          onClick={() => setShowModal(true)}
                          className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold shadow-sm shadow-indigo-500/20"
                      >
                          <Plus className="w-5 h-5 ml-2" /> إضافة Lead
                      </button>
                  </div>
                </div>

                {loading && leads.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 font-bold bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800">
                    جاري تحميل العملاء المحتملين...
                  </div>
                ) : (
                  <div className="flex gap-6 overflow-x-auto pb-6 items-start hide-scrollbar snap-x">
                      {STAGES.map(stage => {
                          const stageLeads = leads.filter(l => l.status === stage);
                          
                          return (
                              <div key={stage} className="snap-center min-w-[340px] max-w-[340px] bg-slate-100/50 dark:bg-[#0F172A]/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[75vh]">
                                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                                      <h2 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-indigo-500" /> {stage}
                                      </h2>
                                      <span className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2.5 py-1 rounded-full shadow-sm font-bold border border-slate-200 dark:border-slate-700">
                                        {stageLeads.length}
                                      </span>
                                  </div>
                                  
                                  <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                                      {stageLeads.map(lead => (
                                          <div key={lead.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing">
                                              
                                              <div className="flex justify-between items-start mb-3">
                                                  <h3 className="font-bold text-slate-900 dark:text-white truncate pr-2" title={lead.companyName}>
                                                    {lead.companyName}
                                                  </h3>
                                                  <div className="shrink-0 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md text-xs font-bold border border-amber-200/50 dark:border-amber-800/30">
                                                      <Star className="w-3 h-3 fill-current" /> {lead.score || 0}
                                                  </div>
                                              </div>
                                              
                                              <div className="space-y-2 mb-4">
                                                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                                  <Users className="w-4 h-4 ml-2 text-slate-400 dark:text-slate-500" />
                                                  <span className="truncate">{lead.contactPerson}</span>
                                                </div>
                                                {lead.phone && (
                                                  <div className="flex items-center text-sm text-slate-500 dark:text-slate-500">
                                                    <Phone className="w-4 h-4 ml-2 text-slate-400 dark:text-slate-500" />
                                                    <span className="font-[Fira_Code]">{lead.phone}</span>
                                                  </div>
                                                )}
                                              </div>
                                              
                                              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-end">
                                                  <div>
                                                    <p className="text-[10px] text-slate-400 mb-1">الإيراد المتوقع</p>
                                                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-[Fira_Code]">
                                                        {Number(lead.expectedRevenue).toLocaleString()} SAR
                                                    </div>
                                                  </div>
                                                  <div className="text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded">
                                                    {lead.source || 'غير محدد'}
                                                  </div>
                                              </div>

                                              {/* Actions Hover Menu */}
                                              <div className="absolute inset-x-0 bottom-0 top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-3 border border-indigo-200 dark:border-indigo-800 z-10 pointer-events-none group-hover:pointer-events-auto">
                                                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تحديث الحالة</p>
                                                  <select 
                                                      value="" 
                                                      onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                                                      className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                  >
                                                      <option value="" disabled>نقل إلى مرحلة...</option>
                                                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                                  </select>
                                                  
                                                  {stage === 'QUALIFIED' && (
                                                      <button 
                                                          onClick={() => handleConvertToOpp(lead.id)}
                                                          className="w-full mt-2 flex justify-center items-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 p-2 rounded-lg text-sm font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800/30"
                                                      >
                                                          <ArrowRightLeft className="w-4 h-4 ml-2" /> تحويل لفرصة
                                                      </button>
                                                  )}
                                              </div>
                                          </div>
                                      ))}
                                      {stageLeads.length === 0 && (
                                          <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                                              <Search className="w-6 h-6 mb-2 opacity-50" />
                                              <span className="text-sm font-bold">لا يوجد Leads</span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                      
                      {/* Converted Column (Read-Only) */}
                      <div className="snap-center min-w-[340px] max-w-[340px] bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 flex flex-col h-[75vh] opacity-80 hover:opacity-100 transition-opacity">
                          <div className="p-4 border-b border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-100/50 dark:bg-emerald-900/20 backdrop-blur-md rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                              <h2 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> {_t('المحولة (الفرص)', 'CONVERTED')}
                              </h2>
                          </div>
                          <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                              {leads.filter(l => l.status === 'CONVERTED').map(lead => (
                                  <div key={lead.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800/50 relative overflow-hidden">
                                      <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
                                      <div className="font-bold text-slate-900 dark:text-white line-through opacity-70 mb-2">{lead.companyName}</div>
                                      <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                                        ✓ تم التحويل لفرصة بيعية
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
                            
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                                <Building2 className="w-6 h-6 ml-2 text-indigo-600 dark:text-indigo-400" />
                                إضافة عميل محتمل (Lead)
                              </h2>
                              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
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
                                  className="space-y-6"
                              >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <FormField name="companyName" label="اسم الشركة" />
                                      <FormField name="contactPerson" label="الشخص المسؤول (Contact)" />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <FormField name="email" type="email" label="البريد الإلكتروني" />
                                      <FormField name="phone" label="رقم الهاتف" />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-100 dark:border-slate-800 pt-6">
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
                                  
                                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
                                      <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors">
                                        إلغاء
                                      </button>
                                      <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-500/20 transition-colors disabled:opacity-50">
                                          {saving ? 'جاري الحفظ...' : 'حفظ العميل'}
                                      </button>
                                  </div>
                              </Form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
