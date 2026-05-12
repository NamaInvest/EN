import React, { useState } from 'react';
import { X, Save, User, Phone, Hash } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useTranslation } from '@/lib/i18n'; // [SEC-01] استيراد خطاف الترجمة لدعم اللغات المتعددة

/**
 * خصائص نافذة إضافة عميل
 * @interface AddCustomerModalProps
 * @property {() => void} onClose - دالة إغلاق النافذة
 * @property {(customer: any) => void} onSuccess - دالة تنفذ عند نجاح إضافة العميل
 */
interface AddCustomerModalProps {
    onClose: () => void;
    onSuccess: (customer: any) => void;
}

export default function AddCustomerModal({ onClose, onSuccess }: AddCustomerModalProps) {
    const { error: toastError, success: toastSuccess } = useToast();
    
    // [SEC-02] تهيئة الترجمة وجلب الاتجاه الديناميكي
    const { t, dir } = useTranslation(); 
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        taxNumber: ''
    });

    /**
     * معالجة إرسال النموذج (Submit Handler)
     * @param e - حدث الإرسال
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // التحقق الأساسي من صحة الإدخال (Validation)
        if (!formData.name.trim()) {
            toastError(t('customer_modal_req_name') || 'يرجى إدخال اسم العميل');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone || null,
                    taxNumber: formData.taxNumber ? parseFloat(formData.taxNumber) : null,
                    type: 0 // 0 للعميل، 1 للمورد
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || t('customer_modal_fail_add') || 'فشل في إضافة العميل');
            }

            const newCustomer = await res.json();
            toastSuccess(t('customer_modal_success_add') || 'تمت إضافة العميل بنجاح');
            onSuccess(newCustomer);
        } catch (err: any) {
            toastError(err.message || t('customer_modal_error_unknown') || 'حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    return (
        // [SEC-03] استخدام {dir} بدلاً من "rtl" لضمان انعكاس الواجهة تلقائياً للغة الإنجليزية
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-200 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose} dir={dir}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <User className="text-orange-500" />
                        {t('customer_modal_title') || 'إضافة عميل جديد'}
                    </h2>
                    <button onClick={onClose} className="w-10 h-10 bg-white hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors border border-slate-200 shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className={`text-sm font-bold text-slate-700 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`}>
                            {t('customer_modal_label_name') || 'اسم العميل'} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`}>
                                <User size={18} />
                            </div>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t('customer_modal_placeholder_name') || 'أدخل اسم العميل بالكامل'}
                                className={`w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-medium text-slate-800`}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={`text-sm font-bold text-slate-700 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`}>
                            {t('customer_modal_label_phone') || 'رقم الهاتف'}
                        </label>
                        <div className="relative">
                            <div className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`}>
                                <Phone size={18} />
                            </div>
                            <input 
                                type="tel" 
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="05XXXXXXXX"
                                // [SEC-04] أرقام الهواتف يجب أن تكون من اليسار لليمين دائماً
                                className={`w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-medium text-slate-800 text-left dir-ltr`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={`text-sm font-bold text-slate-700 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`}>
                            {t('customer_modal_label_tax') || 'الرقم الضريبي (إن وجد)'}
                        </label>
                        <div className="relative">
                            <div className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`}>
                                <Hash size={18} />
                            </div>
                            <input 
                                type="text" 
                                value={formData.taxNumber}
                                onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                                placeholder={t('customer_modal_placeholder_tax') || 'الرقم الضريبي المكون من 15 خانة'}
                                className={`w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-medium text-slate-800 text-left dir-ltr`}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors"
                        >
                            {t('sys.str_91') || 'إلغاء'}
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-12 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="animate-pulse">{t('customer_modal_btn_saving') || 'جاري الحفظ...'}</span>
                            ) : (
                                <>
                                    <Save size={18} />
                                    {t('customer_modal_btn_save') || 'حفظ وتحديد'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
