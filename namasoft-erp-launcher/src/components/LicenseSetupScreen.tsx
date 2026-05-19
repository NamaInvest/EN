import { useState } from 'react';
import { Building2, KeyRound, Mail, Phone, Hash, FileDigit, ArrowRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

const i18n = {
  title: 'إعداد ترخيص المنشأة',
  subtitle: 'يرجى إدخال بيانات الترخيص والمنشأة للمتابعة',
  labels: {
    licenseKey: 'مفتاح الترخيص',
    companyName: 'اسم المنشأة',
    crNumber: 'السجل التجاري',
    vatNumber: 'الرقم الضريبي',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
  },
  placeholders: {
    licenseKey: 'XXXX-XXXX-XXXX-XXXX',
    companyName: 'شركة نما سوفت المحدودة',
    crNumber: '1010123456',
    vatNumber: '300123456700003',
    email: 'info@example.com',
    phone: '0500000000',
  },
  errors: {
    required: 'هذا الحقل مطلوب',
    invalidEmail: 'صيغة البريد الإلكتروني غير صحيحة',
  },
  btnVerify: 'تحقق من الترخيص',
  btnBack: 'رجوع للرئيسية',
  status: {
    loading: 'جاري التحقق من الترخيص...',
    success: 'تم التحقق بنجاح!',
    error: 'حدث خطأ أثناء التحقق',
    invalid: 'ترخيص غير صالح أو منتهي الصلاحية',
  },
};

import { LicenseVerifyResponse, LicensePayload } from '../../electron/types';

interface LicenseSetupScreenProps {
  onBack: () => void;
  onSuccess: (res: LicenseVerifyResponse, formData: LicensePayload) => void;
  fingerprint: string;
}

export function LicenseSetupScreen({ onBack, onSuccess, fingerprint }: LicenseSetupScreenProps) {
  const [formData, setFormData] = useState({
    licenseKey: '',
    companyName: '',
    crNumber: '',
    vatNumber: '',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'invalid', message?: string } | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.licenseKey.trim()) newErrors.licenseKey = i18n.errors.required;
    if (!formData.companyName.trim()) newErrors.companyName = i18n.errors.required;
    if (!formData.crNumber.trim()) newErrors.crNumber = i18n.errors.required;
    if (!formData.vatNumber.trim()) newErrors.vatNumber = i18n.errors.required;
    if (!formData.phone.trim()) newErrors.phone = i18n.errors.required;
    
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = i18n.errors.invalidEmail;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerify = async () => {
    if (!validate()) return;
    
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        licenseKey: formData.licenseKey,
        companyName: formData.companyName,
        crNumber: formData.crNumber,
        vatNumber: formData.vatNumber,
        email: formData.email,
        phone: formData.phone,
        deviceFingerprint: fingerprint,
      };

      const res = await api.checkLicense(payload);

      if (res.valid) {
        setResult({ type: 'success', message: res.message || i18n.status.success });
        setTimeout(() => {
          onSuccess(res, payload);
        }, 1500);
      } else {
        setResult({ type: 'invalid', message: res.message || i18n.status.invalid });
      }
    } catch (err) {
      setResult({ type: 'error', message: i18n.status.error });
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    name: keyof typeof formData, 
    label: string, 
    placeholder: string, 
    Icon: any,
    type: string = 'text'
  ) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Icon className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type={type}
          value={formData[name]}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, [name]: e.target.value }));
            if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
          }}
          className={`w-full bg-slate-50 border ${errors[name] ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200'} rounded-lg py-2.5 pr-10 pl-4 text-slate-800 transition-all outline-none focus:ring-4`}
          placeholder={placeholder}
          dir={name === 'licenseKey' || name === 'email' ? 'ltr' : 'rtl'}
        />
      </div>
      {errors[name] && <span className="text-xs text-rose-500 font-medium">{errors[name]}</span>}
    </div>
  );

  return (
    <div dir="rtl" className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 font-sans p-4">
      
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm text-slate-300 hover:text-white"
          >
            <ArrowRight className="w-5 h-5" />
            {i18n.btnBack}
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{i18n.title}</h1>
            <p className="text-slate-400 text-sm mt-1">{i18n.subtitle}</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* License Key - Full width */}
            <div className="md:col-span-2">
              {renderInput('licenseKey', i18n.labels.licenseKey, i18n.placeholders.licenseKey, KeyRound, 'password')}
            </div>

            {renderInput('companyName', i18n.labels.companyName, i18n.placeholders.companyName, Building2)}
            {renderInput('crNumber', i18n.labels.crNumber, i18n.placeholders.crNumber, FileDigit)}
            {renderInput('vatNumber', i18n.labels.vatNumber, i18n.placeholders.vatNumber, Hash)}
            {renderInput('phone', i18n.labels.phone, i18n.placeholders.phone, Phone, 'tel')}
            
            <div className="md:col-span-2">
              {renderInput('email', i18n.labels.email, i18n.placeholders.email, Mail, 'email')}
            </div>

          </div>

          <div className="mt-8">
            <button 
              onClick={handleVerify}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none transition-all font-semibold text-lg"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              {loading ? i18n.status.loading : i18n.btnVerify}
            </button>
          </div>

          {/* Result Card */}
          {result && (
            <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 border ${
              result.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              result.type === 'invalid' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {result.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <XCircle className="w-6 h-6 shrink-0" />}
              <div>
                <h3 className="font-bold mb-1">
                  {result.type === 'success' ? i18n.status.success : 
                   result.type === 'invalid' ? i18n.status.invalid : i18n.status.error}
                </h3>
                {result.message && <p className="text-sm opacity-90">{result.message}</p>}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
