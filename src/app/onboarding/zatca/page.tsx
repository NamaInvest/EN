"use client";

import React, { useState } from "react";
import { ArrowLeft, CheckCircle, ShieldAlert, Building2, MapPin, FileDigit } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ZatcaOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orgName: "",
    crn: "",
    vatNumber: "",
    street: "",
    building: "",
    district: "",
    city: "",
    postal: "",
    additional: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    // Basic validation
    if (step === 1 && (!formData.orgName || !formData.crn)) return;
    if (step === 2 && (formData.vatNumber.length !== 15 || !formData.vatNumber.startsWith("3") || !formData.vatNumber.endsWith("3"))) return;
    setStep((prev) => prev + 1);
  };

  const submitToProvisioning = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fallbackEmail: "admin@namainvest.com", // Fallback for local testing if Google Auth lacks session
          orgName: formData.orgName,
          vatNumber: formData.vatNumber,
        }),
      });

      if (!res.ok) throw new Error("Failed to allocate node.");
      
      router.push("/onboarding/provisioning");
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-slate-900 rounded-b-[3rem] shadow-2xl z-0" />
      
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100">
        
        {/* Header Progress */}
        <div className="bg-slate-900 px-10 py-8 text-white">
          <div className="flex items-center gap-3 mb-6">
             <ShieldAlert className="w-8 h-8 text-blue-400" />
             <h1 className="text-2xl font-bold tracking-tight">إعدادات هيئة الزكاة (ZATCA Phase 2)</h1>
          </div>
          
          <div className="flex items-center justify-between text-sm font-medium text-slate-400 mb-2">
            <span>الخطوة {step} من 3</span>
            <span>{step === 1 ? "بيانات المنشأة" : step === 2 ? "الرقم الضريبي" : "العنوان الوطني"}</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Area */}
        <div className="p-10">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-800">البيانات الأساسية للمنشأة</h2>
                <p className="text-sm text-slate-500">يرجى إدخال اسم المنشأة كما هو مسجل في السجل التجاري تماماً.</p>
              </div>

              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم التجاري للمؤسسة <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                       name="orgName" 
                       value={formData.orgName} 
                       onChange={handleChange}
                       className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium" 
                       placeholder="مثال: شركة التقنية المتقدمة لتقنية المعلومات" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">رقم السجل التجاري (CRN) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <FileDigit className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                       name="crn" 
                       value={formData.crn} 
                       onChange={handleChange}
                       type="number"
                       className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-medium" 
                       placeholder="1010XXXXXX" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-800">التسجيل الضريبي (VAT)</h2>
                <p className="text-sm text-slate-500">هيئة الزكاة تشترط المكون العشري المكون من 15 رقماً.</p>
              </div>

              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الرقم الضريبي (VAT Number) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <ShieldAlert className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                    <input 
                       name="vatNumber" 
                       value={formData.vatNumber} 
                       onChange={handleChange}
                       type="number"
                       className="w-full pl-4 pr-11 py-3 bg-blue-50 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 font-bold tracking-widest text-lg" 
                       placeholder="3xxxxxxxxxxxxx3" 
                    />
                  </div>
                  {formData.vatNumber.length > 0 && formData.vatNumber.length !== 15 && (
                    <p className="text-xs text-red-500 mt-2 font-medium">الرقم الضريبي يجب أن يتكون من 15 رقماً بالضبط.</p>
                  )}
                  {formData.vatNumber.length === 15 && (!formData.vatNumber.startsWith("3") || !formData.vatNumber.endsWith("3")) && (
                    <p className="text-xs text-amber-500 mt-2 font-medium">وفقاً لهيئة الزكاة، الرقم الضريبي للمؤسسات المعتمدة يبدأ بـ 3 وينتهي بـ 3.</p>
                  )}
                  {formData.vatNumber.length === 15 && formData.vatNumber.startsWith("3") && formData.vatNumber.endsWith("3") && (
                    <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> صيغة الرقم الضريبي صحيحة.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-800">العنوان الوطني الدقيق</h2>
                <p className="text-sm text-slate-500">مطلوب لتوليد الـ XML الفاتورة الإلكترونية لربط السيرفر مع ZATCA.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">اسم الشارع</label>
                  <input name="street" value={formData.street} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="مثال: طريق الملك فهد" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">رقم المبنى (4 أرقام)</label>
                  <input name="building" value={formData.building} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="8211" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">الرقم الإضافي (4 أرقام)</label>
                  <input name="additional" value={formData.additional} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="2314" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">الحي</label>
                  <input name="district" value={formData.district} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="حي الملقا" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">المدينة</label>
                  <input name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="الرياض" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">الرمز البريدي</label>
                  <input name="postal" value={formData.postal} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="12345" />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-6">
            {step > 1 ? (
              <button 
                onClick={() => setStep((p) => p - 1)}
                className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                رجوع
              </button>
            ) : <div />}

            <button 
              onClick={step === 3 ? submitToProvisioning : nextStep}
              disabled={loading || (step === 1 && !formData.orgName) || (step === 2 && formData.vatNumber.length !== 15)}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : step === 3 ? "حفظ وتأسيس الخادم السحابي" : "التالي"}
              {!loading && step !== 3 && <ArrowLeft className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>
      
      {/* Informational Text */}
      <div className="absolute bottom-8 right-8 max-w-sm hidden lg:block">
        <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-gray-200 shadow-sm flex gap-3 items-start">
           <ShieldAlert className="w-6 h-6 text-blue-600 shrink-0" />
           <p className="text-xs text-slate-600 leading-relaxed font-medium">سيتم تشفير بياناتك الضريبية واستخدامها أوتوماتيكياً عبر نظام NamaSoft لإصدار المفاتيح الرقمية (CSID) والتواصل مباشرة مع منصة (فاتورة) فور تأسيس الخادم.</p>
        </div>
      </div>
    </div>
  );
}
