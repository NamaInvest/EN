"use client";

import React, { useState } from "react";
import { ArrowLeft, CheckCircle, ShieldAlert, Building2, FileDigit, Server, Key } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ZatcaOnboardingWizard() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  
  const [formData, setFormData] = useState({
    orgName: "",
    orgNameEn: "",
    crn: "",
    vatNumber: "",
    street: "",
    building: "",
    additional: "",
    district: "",
    city: "",
    cityEn: "",
    postal: "",
    otp: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitZatcaOnboarding = async () => {
    setLoading(true);
    try {
      // 1. Save Settings to DB (Geographic & English Names)
      setStatusMsg("جاري حفظ بيانات العنوان الوطني...");
      const resSettings = await fetch("/api/settings/zatca-onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if(!resSettings.ok) throw new Error("فشل حفظ البيانات الجغرافية");

      // 2. Generate ZATCA CSR & secp256k1 Keys
      setStatusMsg("جاري توليد مفاتيح التشفير بصيغة secp256k1...");
      const resKeys = await fetch("/api/settings/generate-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if(!resKeys.ok) throw new Error("مفاتيح التشفير رُفضت بسبب البيانات المدخلة");

      // 3. Request Compliance CSID using OTP
      setStatusMsg("جاري استخراج شهادة المطابقة CSID من بوابة الفاتورة...");
      const resCsid = await fetch("/api/zatca", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ action: "compliance-csid", otp: formData.otp })
      });
      const csidData = await resCsid.json();
      if(!resCsid.ok) throw new Error(csidData.error || "كود OTP غير صالح أو انتهت صلاحيته");

      // 4. Run Compliance Invoices Validation
      setStatusMsg("جاري فحص 3 فواتير تجريبية مشفرة...");
      const resInv = await fetch("/api/zatca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "compliance-invoice" })
      });
      if(!resInv.ok) throw new Error("فشل فحص الفواتير التجريبية لدى الزكاة");

      // 5. Fetch Production CSID
      setStatusMsg("نجاح! جاري إصدار الشهادة الإنتاجية النهائية...");
      const resProd = await fetch("/api/zatca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "production-csid" })
      });
      if(!resProd.ok) throw new Error("فشل إصدار الشهادة الإنتاجية");

      // 6. Record System Tenant Instance
      setStatusMsg("تم الربط بالزكاة بنجاح 100%! جاري تأسيس الخادم...");
      await fetch("/api/tenant/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fallbackEmail: "admin@namainvest.com",
          orgName: formData.orgName,
          vatNumber: formData.vatNumber,
        }),
      });

      router.push("/dashboard");

    } catch (err: any) {
      console.error(err);
      setStatusMsg("");
      alert(err.message || "حدث خطأ غير معروف أثناء الاتصال بهيئة الزكاة.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="absolute top-0 left-0 w-full h-64 bg-slate-900 rounded-b-[3rem] shadow-2xl z-0" />
      
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100">
        
        {/* Header Progress */}
        <div className="bg-slate-900 px-10 py-8 text-white">
           <div className="flex items-center gap-3 mb-6">
             <ShieldAlert className="w-8 h-8 text-blue-400" />
             <div>
               <h1 className="text-2xl font-bold tracking-tight">الربط المباشر مع ZATCA (المرحلة 2)</h1>
               <p className="text-blue-300 text-sm mt-1">تشفير تلقائي لشهادات CSID</p>
             </div>
          </div>
          
          <div className="flex items-center justify-between text-sm font-medium text-slate-400 mb-2">
            <span>الخطوة {step} من 4</span>
            <span>
              {step === 1 ? "بيانات المنشأة (مطلوب للـ CSR)" : 
               step === 2 ? "الرقم الضريبي" : 
               step === 3 ? "العنوان الوطني (بالإنجليزي)" : "بوابة فاتورة (OTP)"}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Area */}
        <div className="p-10 min-h-[400px]">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-800">بيانات التشفير الأساسية</h2>
                <p className="text-sm text-slate-500">هيئة الزكاة تشترط وجود الاسم باللغة الإنجليزية في مفتاح התشفير CSR.</p>
              </div>

              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم التجاري بالعربية <span className="text-red-500">*</span></label>
                  <input name="orgName" value={formData.orgName} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="شركة التقنية المتقدمة" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم التجاري بالإنجليزية <span className="text-red-500">*</span></label>
                  <input name="orgNameEn" value={formData.orgNameEn} onChange={handleChange} dir="ltr" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="Advanced Tech Company" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">السجل التجاري (CRN)</label>
                  <input name="crn" value={formData.crn} type="number" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium" placeholder="1010XXXXXX" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
               <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-800">الرقم الضريبي (VAT)</h2>
              </div>
              <div className="pt-4">
                  <div className="relative">
                    <ShieldAlert className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-500" />
                    <input 
                       name="vatNumber" 
                       value={formData.vatNumber} 
                       onChange={handleChange}
                       type="number"
                       className="w-full pl-4 pr-12 py-4 bg-blue-50 border-2 border-blue-200 rounded-xl focus:ring-blue-500 text-slate-900 font-bold tracking-widest text-xl" 
                       placeholder="3xxxxxxxxxxxxx3" 
                    />
                  </div>
                  {formData.vatNumber.length === 15 && formData.vatNumber.startsWith("3") && formData.vatNumber.endsWith("3") && (
                    <p className="text-sm text-green-600 mt-3 font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5" /> صيغة الرقم مقبولة تشفيرياً.</p>
                  )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
               <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-800">العنوان الوطني الدقيق</h2>
                <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-xs font-bold mt-2 border border-amber-200">
                   عناوين الزكاة الجغرافية يجب أن تضم اسم المدينة بالإنجليزي
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold mb-1 col-span-2">اسم الشارع</label>
                  <input name="street" value={formData.street} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="طريق العليا" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">المبنى (4 أرقام)</label>
                  <input name="building" value={formData.building} onChange={handleChange} type="number" className="w-full px-4 py-2 border rounded-lg" placeholder="8211" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">الإضافي (4 أرقام)</label>
                  <input name="additional" value={formData.additional} onChange={handleChange} type="number" className="w-full px-4 py-2 border rounded-lg" placeholder="2314" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">المدينة (عربي)</label>
                  <input name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="الرياض" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-blue-600">المدينة (English) *</label>
                  <input name="cityEn" value={formData.cityEn} onChange={handleChange} dir="ltr" className="w-full px-4 py-2 border rounded-lg bg-blue-50" placeholder="Riyadh" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">الحي</label>
                  <input name="district" value={formData.district} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" placeholder="العليا" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">الرمز البريدي</label>
                  <input name="postal" value={formData.postal} onChange={handleChange} type="number" className="w-full px-4 py-2 border rounded-lg" placeholder="12345" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 text-center pt-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Key className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">تفعيل بوابة فاتورة (فاتورتي)</h2>
              <p className="text-slate-500 font-medium">سجل دخولك في بوابة ZATCA، قم بإضافة جهاز جديد (Onboard Device)، وانسخ رمز الـ OTP هنا لربط السيرفر.</p>
              
              <div className="max-w-xs mx-auto mt-6">
                 <input 
                    name="otp" 
                    value={formData.otp} 
                    onChange={handleChange}
                    dir="ltr"
                    type="number"
                    className="w-full px-6 py-4 text-center bg-slate-100 border-2 border-slate-300 rounded-2xl focus:border-green-500 text-3xl tracking-[1em] font-black text-slate-800 outline-none" 
                    placeholder="123456" 
                 />
              </div>

              {loading && (
                <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200 flex flex-col items-center">
                   <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                   <p className="text-blue-800 font-bold text-sm animate-pulse">{statusMsg}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-6">
            {step > 1 && !loading ? (
              <button onClick={() => setStep(p => p - 1)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100">رجوع</button>
            ) : <div />}

            <button 
              onClick={step === 4 ? submitZatcaOnboarding : () => setStep(p => p + 1)}
              disabled={loading || (step===1 && !formData.orgNameEn) || (step===2 && formData.vatNumber.length!==15) || (step===3 && !formData.cityEn) || (step===4 && formData.otp.length < 5)}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl"
            >
              {step === 4 ? "تأكيد الربط وإصدار CSID" : "التالي"}
              {step !== 4 && <ArrowLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
