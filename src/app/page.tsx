"use client";

import React, { useEffect, useState } from "react";
import { 
  ArrowLeft, Shield, Zap, Globe, Cpu, Monitor, Phone, 
  CheckCircle, Database, Server, Smartphone, ShoppingBag, 
  Users, Briefcase, FileText, Bot, Webhook, CloudLightning,
  ChevronLeft, BarChart3, Lock, Rocket
} from "lucide-react";

export default function UltimateLandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-white font-sans overflow-x-hidden selection:bg-purple-500/30" dir="rtl">
      
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-cyan-900/10 blur-[150px]" />
        
        {/* Animated Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)`,
            backgroundSize: `4rem 4rem`,
            maskImage: `radial-gradient(ellipse 80% 80% at 50% 50%, #000 0%, transparent 100%)`,
            WebkitMaskImage: `radial-gradient(ellipse 80% 80% at 50% 50%, #000 0%, transparent 100%)`
          }}
        />
      </div>

      {/* Premium Glassmorphism Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#02040a]/80 backdrop-blur-xl border-b border-white/10 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-12 h-12 bg-[#0a0f1c] border border-white/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-l from-white to-gray-400">
              نما إنفست
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">المميزات</a>
            <a href="#zatca" className="hover:text-cyan-400 transition-colors">زاتكا (المرحلة 2)</a>
            <a href="#modules" className="hover:text-cyan-400 transition-colors">المنظومة</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = '/login'} className="text-sm font-bold text-gray-300 hover:text-white transition-colors hidden sm:block">
              تسجيل الدخول
            </button>
            <button onClick={() => window.open('https://wa.me/966531206628', '_blank')} className="group relative px-6 py-2.5 bg-white text-black font-bold rounded-lg overflow-hidden transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <span className="relative z-10 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                المبيعات
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 sm:pt-48 pb-20 px-6">
        {/* Supreme Hero Section */}
        <div className="max-w-6xl mx-auto text-center flex flex-col items-center">
          
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs sm:text-sm font-bold mb-8 backdrop-blur-md animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            برمجيات سعودية بمعايير عالمية
          </div>
          
          {/* Giant Headline */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[1.1] mb-8 text-white tracking-tight" style={{textShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
            أدر إمبراطوريتك من <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-cyan-400 via-blue-500 to-purple-600 relative inline-block pb-2">
              شاشة واحدة فقط.
              {/* Magic line under text */}
              <div className="absolute bottom-0 left-0 w-full h-[6px] bg-gradient-to-l from-cyan-400 via-blue-500 to-purple-600 rounded-full opacity-50 blur-[2px]"></div>
            </span>
          </h1>
          
          <p className="text-lg sm:text-2xl text-gray-400 max-w-3xl mb-12 leading-relaxed font-medium">
            نظام تخطيط موارد المؤسسات <strong className="text-white bg-white/10 px-2 py-1 rounded">ERP</strong> الوحيد في الشرق الأوسط الذي يدمج المحاسبة، الموارد البشرية، زاتكا، ونقاط البيع السحابية بدون أي تعقيدات أو سيرفرات إضافية.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
            <button 
              onClick={() => window.location.href = '/onboarding/zatca'}
              className="group relative px-8 py-4 sm:px-10 sm:py-5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-lg transition-all hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] flex items-center justify-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center gap-3">
                تأسيس النظام السحابي
                <Rocket className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" />
              </span>
            </button>
            <button 
              onClick={() => window.open('https://wa.me/966531206628', '_blank')}
              className="px-8 py-4 sm:px-10 sm:py-5 rounded-xl bg-[#0a0f1c] border border-white/10 hover:border-white/30 text-white font-bold text-lg backdrop-blur-xl transition-all flex items-center justify-center gap-3"
            >
              تواصل مع الاستشاريين
            </button>
          </div>
        </div>

        {/* Dashboard Floating Preview Element */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="absolute -inset-1 bg-gradient-to-b from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50"></div>
          <div className="relative rounded-2xl border border-white/10 bg-[#050811]/90 backdrop-blur-2xl overflow-hidden shadow-2xl p-2">
            <div className="border border-white/5 rounded-xl bg-[#02040a] p-1 flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500 ml-1"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="mx-auto text-[10px] text-gray-500 flex items-center gap-1 font-mono tracking-widest"><Lock className="w-3 h-3"/> nX.namainvist.com</div>
            </div>
            
            {/* Mock Dashboard UI inside the floating window */}
            <div className="grid grid-cols-12 gap-4 rtl pt-2 px-2 pb-2">
              <div className="col-span-3 border border-white/5 bg-white/[0.02] rounded-lg p-4 h-[300px] hidden md:block">
                <div className="h-4 w-1/2 bg-gray-800 rounded mb-6"></div>
                <div className="space-y-3">
                  <div className="h-6 w-full bg-gradient-to-l from-blue-600/20 to-transparent rounded border-l-2 border-blue-500"></div>
                  <div className="h-6 w-5/6 bg-gray-800 rounded"></div>
                  <div className="h-6 w-4/6 bg-gray-800 rounded"></div>
                </div>
              </div>
              <div className="col-span-12 md:col-span-9 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-24 bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-lg p-4">
                    <div className="text-cyan-400 text-xs mb-2">المبيعات اليومية</div>
                    <div className="text-2xl font-bold text-white">﷼ 45,290</div>
                  </div>
                  <div className="h-24 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-lg p-4">
                    <div className="text-purple-400 text-xs mb-2">الفواتير الإلكترونية</div>
                    <div className="text-2xl font-bold text-white flex items-center gap-2">1,204 <CheckCircle className="w-4 h-4 text-green-500"/></div>
                  </div>
                  <div className="h-24 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-lg p-4">
                    <div className="text-green-400 text-xs mb-2">حالة الاتصال بزاتكا</div>
                    <div className="text-xl font-bold text-white mt-1"><span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">متصل - المرحلة الثانية</span></div>
                  </div>
                </div>
                <div className="h-[188px] w-full bg-white/[0.02] border border-white/5 rounded-lg flex items-end p-4 gap-2">
                  <div className="w-1/6 bg-blue-500/50 hover:bg-blue-400 transition-colors rounded-t-sm h-[40%]"></div>
                  <div className="w-1/6 bg-blue-500/50 hover:bg-blue-400 transition-colors rounded-t-sm h-[60%]"></div>
                  <div className="w-1/6 bg-purple-500/50 hover:bg-purple-400 transition-colors rounded-t-sm h-[30%]"></div>
                  <div className="w-1/6 bg-blue-500/50 hover:bg-blue-400 transition-colors rounded-t-sm h-[80%]"></div>
                  <div className="w-1/6 bg-cyan-500/50 hover:bg-cyan-400 transition-colors rounded-t-sm h-[100%]"></div>
                  <div className="w-1/6 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-sm h-[90%] relative shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Extreme Feature Architecture */}
      <section id="features" className="relative py-24 border-t border-white/10 bg-[#02040a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black mb-4 text-white">قوة سيليكون فالي،<br/>بأيدي خبراء المملكة.</h2>
            <p className="text-xl text-gray-400 font-medium">كل ما تحتاجه شركتك للسيطرة على السوق، في مكان واحد.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Native Card 1 */}
            <div className="group p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/20 blur-[50px] group-hover:bg-cyan-400/30 transition-colors"></div>
               <Monitor className="w-10 h-10 text-cyan-400 mb-6" />
               <h3 className="text-2xl font-bold text-white mb-3">كاشير سحابي POS</h3>
               <p className="text-gray-400 leading-relaxed font-medium">سريع كالبرق. يدعم العمل بدون إنترنت (Offline Sync)، يدعمل الدفع بتابي وتمارا والباركود والوزن. مناسب للمقاهي والمحلات.</p>
            </div>

            {/* Native Card 2 */}
            <div className="group p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 hover:border-purple-500/40 hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 blur-[50px] group-hover:bg-purple-400/30 transition-colors"></div>
               <FileText className="w-10 h-10 text-purple-400 mb-6" />
               <h3 className="text-2xl font-bold text-white mb-3">زاتكا (المرحلة الثانية)</h3>
               <p className="text-gray-400 leading-relaxed font-medium">دمج مباشر ومجاني مع هيئة الزكاة B2B و B2C. اصدار الفواتير الاشعارات الدائنة والمدينة مشفرة برمجياً.</p>
            </div>

            {/* Native Card 3 */}
            <div className="group p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 hover:border-green-500/40 hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/20 blur-[50px] group-hover:bg-green-400/30 transition-colors"></div>
               <Database className="w-10 h-10 text-green-400 mb-6" />
               <h3 className="text-2xl font-bold text-white mb-3">المحاسبات العميقة</h3>
               <p className="text-gray-400 leading-relaxed font-medium">قيود مزدوجة آلية، ميزان مراجعة، أرباح وخسائر، وتسويات بنكية. كل حركة بيع تسمع في شجرة الحسابات فوراً.</p>
            </div>

            {/* Native Card 4 */}
            <div className="group p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 blur-[50px] group-hover:bg-blue-400/30 transition-colors"></div>
               <Users className="w-10 h-10 text-blue-400 mb-6" />
               <h3 className="text-2xl font-bold text-white mb-3">رواتب وموارد بشرية</h3>
               <p className="text-gray-400 leading-relaxed font-medium">مراقبة سلف، إجازات، غياب، وخصم التأمينات الاجتماعية بشكل آلي وتوليد مسيرات الرواتب بضغطة واحدة.</p>
            </div>

            {/* Native Card 5 */}
            <div className="group p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 hover:border-orange-500/40 hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/20 blur-[50px] group-hover:bg-orange-400/30 transition-colors"></div>
               <ShoppingBag className="w-10 h-10 text-orange-400 mb-6" />
               <h3 className="text-2xl font-bold text-white mb-3">مستودعات وفروع</h3>
               <p className="text-gray-400 leading-relaxed font-medium">إدارة استلام البضائع من الموردين، طلبات الشراء، الجرد الذكي، ونقل المخزون الفوري بين فروعك المنتشرة.</p>
            </div>

            {/* Native Card 6 */}
            <div className="group p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 hover:border-ping-500/40 hover:bg-white/[0.06] transition-all duration-300 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/20 blur-[50px] group-hover:bg-pink-400/30 transition-colors"></div>
               <BrainCircuit className="w-10 h-10 text-pink-400 mb-6" />
               <h3 className="text-2xl font-bold text-white mb-3">تسويق وذكاء اصطناعي</h3>
               <p className="text-gray-400 leading-relaxed font-medium">قراءة فواتير الموردين عبر الكاميرا والذكاء الاصطناعي، وارسال الفواتير وعروض البيع عبر روبوتات الواتساب.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud Advantage Direct Compare */}
      <section className="py-24 bg-[#050811] border-y border-white/5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-blue-900/10 to-transparent"></div>
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.3)] mb-8">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl sm:text-6xl font-black mb-10 text-white leading-tight">سحابة لا تُقهر.</h2>
          
          <div className="bg-[#02040a] rounded-3xl border border-white/10 p-8 sm:p-12 text-right">
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white mb-2">استغناء تام عن تشغيل أجهزة السيرفرات بالفرع</h4>
                  <p className="text-gray-400 text-lg leading-relaxed font-medium">لن تتعطل أعمالك بسبب انقطاع كهرباء او تلف الهاردسك المحلي. بياناتك محمية في سحابة هيتزنر الأوروبية بتشفير 256-bit.</p>
                </div>
              </div>
              <div className="w-full h-[1px] bg-white/5"></div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white mb-2">منظومة موحدة بدون تكاليف إضافية (لا للموديولات)</h4>
                  <p className="text-gray-400 text-lg leading-relaxed font-medium">عكس الأنظمة الأجنبية العقيمة، نظامنا يقدم كل القطاعات (تصنيع، صيانة، عقارات، مقاولات) داخل باقة واحدة للجميع.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Massive CTA Footer */}
      <footer className="relative py-32 px-6 border-t border-white/10 bg-[#02040a] overflow-hidden">
        {/* Glow behind CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-600/20 to-cyan-500/20 blur-[100px] rounded-[100%] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-5xl sm:text-7xl font-black mb-8 leading-tight text-white tracking-tight">
            استعد للسيطرة.
          </h2>
          <p className="text-xl sm:text-2xl text-gray-400 mb-12 font-medium max-w-2xl">
            اتخذ القرار الإداري الأذكى في مسيرتك المهنية، وانضم لثورة الإدارة السحابية اليوم والمصممة خصيصاً للسوق السعودي.
          </p>
          
          <button 
            onClick={() => window.open('https://wa.me/966531206628', '_blank')}
            className="group px-10 py-5 rounded-2xl bg-white text-black font-black text-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-4 shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:scale-105"
          >
            طلب النسخة التجريبية اليوم
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
          </button>
          
          <div className="mt-24 pt-8 border-t border-white/10 text-gray-600 font-bold text-sm w-full flex flex-col md:flex-row justify-between items-center gap-4">
            <div>© {new Date().getFullYear()} نما إنفست (Nama Invest). منصة سيادة السحابية.</div>
            <div className="flex gap-4">
              <span className="hover:text-white transition-colors cursor-pointer">سياسة الخصوصية</span>
              <span className="hover:text-white transition-colors cursor-pointer">شروط الاستخدام</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Temporary inline component replacement for BrainCircuit if lucide-react doesn't have it loaded
const BrainCircuit = ({className}: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-5.224 5.224A4 4 0 0 0 4.3 16.3a4 4 0 0 0 5.224 5.224 4 4 0 0 0 5.464-1.921 4 4 0 0 0 5.464-1.921 4 4 0 0 0 1.921-5.464 4 4 0 0 0-1.921-5.464 4 4 0 0 0-1.921-5.464A4 4 0 0 0 12 5Z"/>
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4 4.5 4.5 0 0 1-3-4"/>
  </svg>
)
