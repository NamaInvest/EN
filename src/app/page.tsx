"use client";

import React from "react";
import { 
  ArrowLeft, Shield, Zap, Globe, Cpu, Monitor, Phone, 
  CheckCircle, Database, Server, Smartphone, ShoppingBag, 
  Users, Briefcase, FileText, Bot, Webhook, CloudLightning
} from "lucide-react";

export default function UltimateLandingPage() {
  return (
    <div className="min-h-screen bg-[#03050a] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden relative" dir="rtl">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-cyan-900/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-blue-900/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      </div>

      {/* Glassmorphism Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#03050a]/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">نما إنفست</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button onClick={() => window.location.href = '/login'} className="hidden sm:block text-gray-300 hover:text-white font-medium transition-colors">دخول النظام</button>
            <button onClick={() => window.open('https://wa.me/966531206628', '_blank')} className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-black hover:bg-gray-200 font-bold transition-all flex items-center gap-2 text-sm sm:text-base">
              <Phone className="w-4 h-4 hidden sm:block" />
              المبيعات
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 sm:pt-48 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs sm:text-sm font-bold mb-6 sm:mb-8 backdrop-blur-md">
            <Zap className="w-4 h-4 me-2" />
            تحديث 2026: النظام السحابي الأقوى محلياً
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] sm:leading-tight mb-6 sm:mb-8 text-white">
            أدر إمبراطوريتك من <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-l from-cyan-400 via-blue-500 to-fuchsia-500">
              شاشة واحدة فقط.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl mb-10 sm:mb-12 leading-relaxed">
            منظومة سحابية متكاملة تجمع الـ ERP، الكاشير (POS)، الموارد البشرية، والفوترة الإلكترونية (ZATCA) في مكان واحد. تقنية لا تعرف التعليق.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={() => window.open('https://wa.me/966531206628', '_blank')}
              className="px-8 py-4 sm:px-10 sm:py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-base sm:text-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center"
            >
              اطلب النظام الآن
              <ArrowLeft className="w-5 h-5 ms-3" />
            </button>
            <button 
              onClick={() => window.location.href = '/onboarding/zatca'}
              className="px-8 py-4 sm:px-10 sm:py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-base sm:text-lg hover:bg-white/10 backdrop-blur-xl transition-all flex items-center justify-center"
            >
              استكشف المزايا
            </button>
          </div>
        </div>
      </main>

      {/* Core Features Grid */}
      <section className="relative z-10 py-16 sm:py-24 bg-black/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 text-white">منظومة لا تعرف الحدود.</h2>
            <p className="text-lg sm:text-xl text-gray-400">أكثر من 37 موديول إداري في بيئة سحابية واحدة.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0f1a] border border-white/5 hover:border-cyan-500/30 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">تحكم تام بالفروع</h3>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">إدارة مركزية لجميع فروعك ومستودعاتك بنظام صلاحيات صارم يمنع أي تلاعب مالي أو إداري.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0f1a] border border-white/5 hover:border-cyan-500/30 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6">
                <Monitor className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">كاشير سحابي (POS)</h3>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">نقطة بيع سريعة مثل البرق تعمل على الآيباد والكمبيوتر، مع دعم كامل للعمل دون اتصال بالإنترنت.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0f1a] border border-white/5 hover:border-cyan-500/30 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-fuchsia-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">زاتكا (المرحلة الثانية)</h3>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">ربط آلي ومجاني بالكامل مع هيئة الزكاة والضريبة والجمارك لإصدار الفواتير الإلكترونية بضغطة زر.</p>
            </div>
            
            {/* Feature 4 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0f1a] border border-white/5 hover:border-cyan-500/30 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Database className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">تقارير محاسبية عميقة</h3>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">ميزانية عمومية، أرباح وخسائر، قيود آلية ذكية تراقب كل هللة تدخل أو تخرج من منشأتك لحظياً.</p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0f1a] border border-white/5 hover:border-cyan-500/30 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#25d366]/10 flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-[#25d366]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">تسويق واتساب الذكي</h3>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">أبقِ عملاءك على اطلاع مباشر، أرسل العروض الترويجية وفواتير الدفع مباشرة إلى الواتساب الخاص بهم.</p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0f1a] border border-white/5 hover:border-cyan-500/30 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white">شؤون الموظفين والرواتب</h3>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">إدارة حضور وانصراف، مستحقات، سلف، وتوليد مسيرات الرواتب تلقائياً نهاية كل شهر.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Cloud Advantage */}
      <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <CloudLightning className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 mx-auto mb-6 sm:mb-8" />
          <h2 className="text-3xl sm:text-5xl font-black mb-8 text-white leading-tight">الأنظمة القديمة تكلفك الكثير.<br className="hidden sm:block" />نحن قمنا بحل المعادلة الصعبة.</h2>
          
          <div className="bg-[#0a0f1a] p-6 sm:p-10 rounded-3xl border border-white/10 text-right space-y-6">
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-white mb-1">بدون سيرفرات مكلفة</h4>
                <p className="text-gray-400 text-sm sm:text-base">قل وداعاً لتكاليف البنية التحتية، نما إنفست يعمل على أحدث الخوادم السحابية الموزعة لضمان استقرار 99.9%.</p>
              </div>
            </div>
            <div className="w-full h-[1px] bg-white/5"></div>
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-white mb-1">منظومة موحدة (Monolith)</h4>
                <p className="text-gray-400 text-sm sm:text-base">عكس أودو والأنظمة المعقدة التي تفرض عليك الدفع لكل موديول منفصل، في نما أنت تحصل على الكيان بأكمله لا يتجزأ.</p>
              </div>
            </div>
            <div className="w-full h-[1px] bg-white/5"></div>
            <div className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-white mb-1">دعم فني استثنائي</h4>
                <p className="text-gray-400 text-sm sm:text-base">فريق دعم يتصل معك لحظياً، ولا داعي لانتظار التذاكر ومقدمي الخدمات لأسابيع من أجل إصلاح بسيط.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5 bg-[#03050a]">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight text-white">جاهز للسيطرة المجردة؟</h2>
          <p className="text-lg sm:text-xl text-gray-400 mb-10">اتخذ القرار الإداري الأذكى في مسيرتك المهنية، وانضم لثورة الإدارة السحابية اليوم بقوة التقنية السعودية.</p>
          
          <button 
            onClick={() => window.open('https://wa.me/966531206628', '_blank')}
            className="px-8 sm:px-12 py-4 sm:py-5 rounded-full bg-white text-black font-black text-lg sm:text-xl hover:bg-gray-200 hover:scale-105 transition-all flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] w-full sm:w-auto"
          >
            <Phone className="w-5 h-5 sm:w-6 sm:h-6 ms-3 hidden sm:block" />
            تواصل مستشار المبيعات الآن
          </button>
          
          <div className="mt-16 text-gray-600 text-xs sm:text-sm">
            © {new Date().getFullYear()} نما إنفست (Nama Invest). المنصة السحابية الأولى لإدارة الأعمال في الشرق الأوسط.
          </div>
        </div>
      </footer>
    </div>
  );
}
