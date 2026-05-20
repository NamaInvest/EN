import { useState } from 'react';
import { Building2, Globe, ArrowRight, CheckCircle2, XCircle, Loader2, Search } from 'lucide-react';
import { api } from '../lib/api';

const i18n = {
  title: 'إنشاء بيئة العمل',
  subtitle: 'الرجاء اختيار نطاق فرعي لشركتك الجديدة',
  labels: {
    companyName: 'اسم المنشأة',
    adminName: 'اسم المسؤول',
    email: 'البريد الإلكتروني',
    phone: 'رقم الجوال',
    password: 'كلمة المرور',
    subdomain: 'النطاق الفرعي المطلوب',
  },
  errors: {
    invalidFormat: 'يجب أن يكون باللغة الإنجليزية بدون مسافات أو رموز خاصة (عدا -) (3-30 حرف)',
    alreadyTaken: 'عذراً، هذا النطاق محجوز مسبقاً',
  },
  status: {
    available: 'النطاق متاح!',
    loading: 'جاري العمل...',
    success: 'تم إنشاء بيئة العمل بنجاح!',
    error: 'حدث خطأ غير متوقع',
  },
  btnCheck: 'التحقق من التوفر',
  btnCreate: 'إنشاء بيئة العمل',
  btnBack: 'رجوع للترخيص',
};

import { LicenseVerifyResponse, LicensePayload } from '../../electron/types';

interface NewCompanyProvisionScreenProps {
  onBack: () => void;
  data: LicenseVerifyResponse | null;
  formData: LicensePayload | null;
}

export function NewCompanyProvisionScreen({ onBack, data, formData }: NewCompanyProvisionScreenProps) {
  const [subdomain, setSubdomain] = useState(data?.suggestedSubdomain || '');
  const [companyName, setCompanyName] = useState(formData?.companyName || '');
  const [adminName, setAdminName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(formData?.email || '');
  const [phone, setPhone] = useState(formData?.phone || '');
  
  const [error, setError] = useState('');
  
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState<any>(null);

  const subdomainRegex = /^[a-z0-9-]{3,30}$/;

  const handleCheckAvailability = async () => {
    if (!subdomainRegex.test(subdomain)) {
      setError(i18n.errors.invalidFormat);
      setIsAvailable(false);
      return;
    }
    
    setError('');
    setIsChecking(true);
    setIsAvailable(null);

    try {
      const res = await api.checkSubdomain(subdomain);
      if (res.available) {
        setIsAvailable(true);
      } else {
        setIsAvailable(false);
        setError(i18n.errors.alreadyTaken);
      }
    } catch (err: any) {
      setError(err.message || i18n.status.error);
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleProvision = async () => {
    if (!isAvailable) return;
    
    if (!companyName.trim() || !adminName.trim() || !password.trim() || !email.trim() || !phone.trim()) {
      setProvisionResult({ type: 'error', message: 'يرجى تعبئة جميع الحقول المطلوبة' });
      return;
    }

    setIsProvisioning(true);
    setProvisionResult(null);

    try {
      const payload = {
        licenseKey: formData?.licenseKey || '',
        companyName,
        adminName,
        password,
        crNumber: formData?.crNumber,
        vatNumber: formData?.vatNumber,
        email,
        phone,
        deviceFingerprint: formData?.deviceFingerprint || '',
        subdomain,
        version: '2.4.10',
        
        // Map to backend expected fields
        companyNameAr: companyName,
        mobile: phone,
        city: 'الرياض',
        clerkEmail: email,
        trialSource: 'DESKTOP_APP'
      };
      const res = await api.provisionTenant(payload);
      if (res.success) {
        // Fallback to local computation if backend doesn't return it
        const finalWorkspaceUrl = res.workspaceUrl || `https://${subdomain}.namainvist.com`;
        res.workspaceUrl = finalWorkspaceUrl;
        
        // Save to local cache
        await api.saveProvision(res);
        setProvisionResult({ type: 'success', message: res.message || i18n.status.success, data: res });
        
        // Automatically open the workspace
        setTimeout(() => {
          api.openWorkspace(finalWorkspaceUrl);
        }, 1500);
      } else {
        setProvisionResult({ type: 'error', message: res.message || i18n.status.error });
      }
    } catch (err) {
      setProvisionResult({ type: 'error', message: i18n.status.error });
    } finally {
      setIsProvisioning(false);
    }
  };

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

        {/* Content */}
        <div className="p-8">
          
          <div className="mb-6">
            <label className="text-sm font-semibold text-slate-700">{i18n.labels.companyName}</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Building2 className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-blue-200 rounded-lg py-2.5 pr-10 pl-4 text-slate-800 transition-all outline-none focus:ring-4"
                placeholder="شركة النماذج الحديثة"
              />
            </div>
          </div>

          <div className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">{i18n.labels.adminName}</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
                  placeholder="أحمد محمد"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{i18n.labels.password}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
                  placeholder="كلمة مرور الدخول"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{i18n.labels.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 text-left"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">{i18n.labels.phone}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 text-left"
                />
              </div>
            </div>

            <label className="text-sm font-semibold text-slate-700 mt-4 block">{i18n.labels.subdomain}</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Globe className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  dir="ltr"
                  value={subdomain}
                  onChange={(e) => {
                    setSubdomain(e.target.value.toLowerCase());
                    setIsAvailable(null);
                    setError('');
                  }}
                  className={`w-full bg-slate-50 border ${error ? 'border-rose-500 focus:ring-rose-200' : isAvailable ? 'border-emerald-500 focus:ring-emerald-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200'} rounded-lg py-2.5 pr-10 pl-4 text-slate-800 transition-all outline-none focus:ring-4`}
                  placeholder="mycompany"
                />
              </div>
              <button 
                onClick={handleCheckAvailability}
                disabled={isChecking || !subdomain.trim()}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-lg shadow hover:bg-slate-700 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none transition-all font-semibold"
              >
                {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {i18n.btnCheck}
              </button>
            </div>
            
            {error && <p className="text-sm text-rose-500 font-medium">{error}</p>}
            {isAvailable && <p className="text-sm text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {i18n.status.available}</p>}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button 
              onClick={handleProvision}
              disabled={!isAvailable || isProvisioning || provisionResult?.type === 'success'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none transition-all font-semibold text-lg"
            >
              {isProvisioning ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              {isProvisioning ? i18n.status.loading : i18n.btnCreate}
            </button>
          </div>

          {/* Result Card */}
          {provisionResult && (
            <div className={`mt-6 p-4 rounded-xl border ${
              provisionResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-start gap-3">
                {provisionResult.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <XCircle className="w-6 h-6 shrink-0" />}
                <div>
                  <h3 className="font-bold mb-1">
                    {provisionResult.type === 'success' ? i18n.status.success : i18n.status.error}
                  </h3>
                  {provisionResult.message && <p className="text-sm opacity-90 mb-2">{provisionResult.message}</p>}
                </div>
              </div>
              
              {provisionResult.type === 'success' && (
                <div className="mt-4 p-3 bg-white/60 rounded-lg border border-emerald-100 flex flex-col gap-2">
                  <p className="text-sm font-semibold">رابط الشركة: <span className="font-mono text-emerald-700">{provisionResult.data?.workspaceUrl || `https://${subdomain}.namainvist.com`}</span></p>
                  <p className="text-sm">مدة التجربة: 7 أيام</p>
                  <button 
                    onClick={() => {
                      const url = provisionResult.data?.workspaceUrl || `https://${subdomain}.namainvist.com`;
                      api.openWorkspace(url);
                    }}
                    className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors w-max font-medium flex items-center gap-2"
                  >
                    جاري التوجيه تلقائياً...
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
