"use client";

import React from "react";
import { 
  Building2, Calculator, Users, CheckCircle,
  ArrowLeft, Phone, Activity, Shield,
  CreditCard, TrendingUp, Layers
} from "lucide-react";

export default function SaaSProfessionalLanding() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200 overflow-x-hidden" dir="rtl">
      {/* FORCE CAIRO */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Cairo', sans-serif !important; }
      `}} />

      {/* Navbar: Keep it absolutely simple and relative or sticky, not fixed with complex paddings */}
      <nav className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
           {/* Logo */}
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/20">
                 <Layers className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">نما إنفست</span>
           </div>
           
           {/* Center Links */}
           <div className="hidden md:flex gap-8 font-bold text-slate-600 text-sm">
              <a href="#" className="hover:text-blue-600">الرئيسية</a>
              <a href="#features" className="hover:text-blue-600">المزايا</a>
              <a href="#" className="hover:text-blue-600">الأسعار</a>
           </div>

           {/* CTA */}
           <div className="flex gap-4">
              <button onClick={() => window.location.href = '/login?callbackUrl=/dashboard'} className="text-slate-600 font-bold text-sm hidden sm:block hover:text-blue-600">تسجيل الدخول</button>
              <button onClick={() => window.location.href = '/login?callbackUrl=/onboarding/zatca'} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all">ابدأ مجاناً</button>
           </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="w-full relative overflow-hidden bg-white">
        {/* Background Decorative Blur */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-6xl mx-auto px-4 pt-16 pb-24 lg:pt-32 lg:pb-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* TEXT CONTENT (Right Side because of RTL) */}
          <div className="w-full lg:w-1/2 flex flex-col items-center text-center lg:items-start lg:text-right">
             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-bold text-sm mb-6 border border-blue-100">
               <Shield className="w-4 h-4" /> معتمد رسمياً من هيئة الزكاة ZATCA
             </div>
             
             <h1 className="text-4xl lg:text-[44px] font-black text-slate-900 leading-[1.4] mb-6">
               نظام ERP & POS متكامل لإدارة أعمالك بذكاء
             </h1>
             
             <p className="text-slate-500 text-lg font-semibold leading-relaxed mb-10 max-w-lg">
               حل سحابي موحد يشمل نقاط البيع، محاسبة الشركات، وإدارة الموارد البشرية. مصمم للسرعة والأمان وبدون تكاليف سيرفرات معقدة.
             </p>
             
             <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button onClick={() => window.location.href = '/login?callbackUrl=/onboarding/zatca'} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-lg">
                  تجربة النظام مجاناً
                </button>
                <button onClick={() => window.open('https://wa.me/966531206628', '_blank')} className="px-8 py-4 bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-lg">
                  <Phone className="w-5 h-5" /> تواصل مع المبيعات
                </button>
             </div>
          </div>

          {/* VISUAL MOCKUP (Left Side) */}
          <div className="w-full lg:w-1/2 relative">
             <div className="w-full aspect-[4/3] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-100 p-6 flex flex-col relative overflow-hidden">
                {/* Fake Browser/App Header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                   <div>
                     <div className="text-xs font-bold text-slate-400">صافي التدفقات</div>
                     <div className="text-2xl font-black text-slate-900">SAR 384,290</div>
                   </div>
                   <div className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold flex items-center gap-1">
                     <TrendingUp className="w-3 h-3" /> +24% هذا الشهر
                   </div>
                </div>

                {/* Highly simplified beautiful chart */}
                <div className="flex-1 flex items-end gap-3 px-4 pb-2">
                   {[40, 60, 45, 80, 55, 95, 70].map((val, idx) => (
                     <div key={idx} className="flex-1 bg-slate-50 rounded-t-xl relative group">
                        <div className={`absolute bottom-0 w-full rounded-t-xl transition-all duration-1000 \${idx === 5 ? 'bg-blue-600 shadow-lg shadow-blue-600/40' : 'bg-blue-200'}`} style={{ height: val + '%' }}></div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Floating Badge (Kept pristine and safe) */}
             <div className="hidden sm:flex absolute -left-6 bottom-12 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 items-center gap-4 animate-bounce" style={{animationDuration: '4s'}}>
               <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                 <CreditCard className="w-6 h-6 text-indigo-600" />
               </div>
               <div>
                 <div className="text-xs font-bold text-slate-400">المدفوعات</div>
                 <div className="text-sm font-black text-slate-900">جاهزة فوراً</div>
               </div>
             </div>
          </div>

        </div>
      </main>

      {/* Feature Cards */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
           <div className="text-center mb-16">
             <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">كافة أدواتك مبنية في منبع واحد</h2>
             <p className="text-lg font-semibold text-slate-500 max-w-2xl mx-auto">تخلص من فوضى التطبيقات المتفرقة وابدأ في أتمتة كل قطاعات مؤسستك من شاشة تحكم قيادية متكاملة.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                 <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                    <Calculator className="w-7 h-7" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-3">نظام POS سحابي</h3>
                 <p className="text-slate-500 font-semibold leading-relaxed">
                   كاشير سريع يعمل بدون انقطاع وسهل الاستخدام، متوافق كلياً مع أحدث قارئات الباركود والموازين وتقسيط تابي وتمارا.
                 </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                 <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                    <Building2 className="w-7 h-7" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-3">محاسبة مالية عميقة</h3>
                 <p className="text-slate-500 font-semibold leading-relaxed">
                   شجرة حسابات ذكية تصدر قيود المبيعات آلياً. وتوفر ميزانية دقيقة، ودفتر أستاذ، وقوائم ربحية في أي لحظة.
                 </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                 <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                    <Users className="w-7 h-7" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-3">الموارد البشرية والرواتب</h3>
                 <p className="text-slate-500 font-semibold leading-relaxed">
                   إدارة متكاملة للحضور والانصراف، احتساب التأمينات والخصومات آلياً وتصدير مسيرات الرواتب بضغطة زر.
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-slate-500 font-bold text-sm">© {new Date().getFullYear()} نما إنفست. برمجيات احترافية لإدارة الأعمال الجادة.</div>
           <div className="flex gap-6 text-sm font-bold text-slate-400">
             <span className="hover:text-blue-600 cursor-pointer transition-colors">سياسة البيانات</span>
             <span className="hover:text-blue-600 cursor-pointer transition-colors">شروط الاستخدام</span>
           </div>
        </div>
      </footer>
    </div>
  );
}
