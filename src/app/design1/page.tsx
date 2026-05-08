"use client";
import React, { useEffect } from 'react';
import { Calculator, Package, ShoppingCart, Cog, Brain, Pill, ShoppingBag, UtensilsCrossed, Factory } from 'lucide-react';

// ─── Local data (design1 standalone — not imported from page) ───────────────
const modulesList: { cat: string; icon: React.ReactNode; title: string; desc: string }[] = [
  { cat: 'finance', icon: <Calculator size={18}/>, title: 'المحاسبة المالية', desc: 'قيود يومية وشجرة حسابات متعددة المستويات' },
  { cat: 'finance', icon: <Calculator size={18}/>, title: 'الحسابات البنكية', desc: 'تتبع الأرصدة والتسويات البنكية' },
  { cat: 'finance', icon: <Calculator size={18}/>, title: 'ميزان المراجعة', desc: 'Drill-Down حتى القيد الأصلي' },
  { cat: 'finance', icon: <Calculator size={18}/>, title: 'الموازنات التقديرية', desc: 'رقابة مالية ومقارنة الفعلي بالمتوقع' },
  { cat: 'finance', icon: <Calculator size={18}/>, title: 'العهد والنثريات', desc: 'صرف وتسوية مصاريف الفروع' },
  { cat: 'sales', icon: <ShoppingCart size={18}/>, title: 'المبيعات B2B', desc: 'فوترة ZATCA Phase 2 كاملة' },
  { cat: 'sales', icon: <ShoppingCart size={18}/>, title: 'نقطة البيع POS', desc: 'باركود سريع وأوفلاين مزامن' },
  { cat: 'sales', icon: <ShoppingCart size={18}/>, title: 'أهداف المبيعات', desc: 'قياس أداء المندوبين لحظياً' },
  { cat: 'sales', icon: <ShoppingCart size={18}/>, title: 'مرتجعات المبيعات', desc: 'إشعارات دائنة وإعادة للمخزون' },
  { cat: 'purchases', icon: <Package size={18}/>, title: 'طلبات الشراء (PR)', desc: 'دورة اعتماد احتياجات الأقسام' },
  { cat: 'purchases', icon: <Package size={18}/>, title: 'أوامر الشراء (PO)', desc: 'تأكيد الكميات والأسعار للمورد' },
  { cat: 'purchases', icon: <Package size={18}/>, title: 'فواتير المشتريات', desc: 'إدخال مباشر مع ربط محاسبي' },
  { cat: 'stock', icon: <Package size={18}/>, title: 'بطاقات المنتجات', desc: 'Matrix + وحدات تحويل متعددة' },
  { cat: 'stock', icon: <Package size={18}/>, title: 'الأرصدة الحية', desc: 'متاح، محجوز، مباع لحظياً' },
  { cat: 'stock', icon: <Package size={18}/>, title: 'الباركود والملصقات', desc: 'طباعة جماعية EAN/QR/Code128' },
  { cat: 'stock', icon: <Package size={18}/>, title: 'تواريخ الصلاحية', desc: 'FEFO تلقائي وتنبيهات الانتهاء' },
  { cat: 'stock', icon: <Package size={18}/>, title: 'WMS المتقدم', desc: 'أرفف ومواقع وتوجيه العمال' },
  { cat: 'hr', icon: <Cog size={18}/>, title: 'إدارة الموظفين', desc: 'ملف متكامل من التعيين للتقاعد' },
  { cat: 'hr', icon: <Cog size={18}/>, title: 'مسيرات الرواتب', desc: 'WPS متوافق وقيد محاسبي آلي' },
  { cat: 'hr', icon: <Cog size={18}/>, title: 'الحضور والانصراف', desc: 'ربط ZKTeco والبصمة الوجهية' },
  { cat: 'ai', icon: <Brain size={18}/>, title: 'المدير المالي الذكي', desc: 'تشخيص مالي وتوصيات استراتيجية' },
  { cat: 'ai', icon: <Brain size={18}/>, title: 'كشف الاحتيال AI', desc: 'رادار ذكي للتلاعب والشذوذ' },
  { cat: 'enterprise', icon: <Factory size={18}/>, title: 'أوامر التصنيع', desc: 'تتبع الإنتاج واحتساب التكلفة' },
  { cat: 'admin', icon: <Cog size={18}/>, title: 'مركز القيادة والإعدادات', desc: 'سياسات الشركة والمظهر والمستخدمين' },
];

const INDUSTRIES = [
  { id: 'pharmacy', icon: <Pill size={26}/>, title: 'الصيدليات' },
  { id: 'retail', icon: <ShoppingBag size={26}/>, title: 'التموينات والحلويات' },
  { id: 'restaurant', icon: <UtensilsCrossed size={26}/>, title: 'المطاعم والكافيهات' },
  { id: 'factory', icon: <Factory size={26}/>, title: 'المصانع والإنتاج' },
  { id: 'services', icon: <Cog size={26}/>, title: 'الخدمات والصيانة' },
];

const POWER_CLUSTERS = [
  { icon: <Calculator size={28}/>, title: 'السيطرة المالية', count: 13, desc: 'وداعاً للأخطاء الحسابية. نظام دقيق مع تقارير ضريبية فورية.' },
  { icon: <Package size={28}/>, title: 'قوة المخزون', count: 14, desc: 'تحكم كامل بالكميات وتواريخ الانتهاء ومواقع الأرفف.' },
  { icon: <ShoppingCart size={28}/>, title: 'تجربة البيع', count: 19, desc: 'POS سريع مع نظام ولاء يبني علاقة طويلة مع عملائك.' },
  { icon: <Cog size={28}/>, title: 'كفاءة التشغيل', count: 25, desc: 'أتمتة كاملة من المادة الخام للمنتج النهائي.' },
  { icon: <Brain size={28}/>, title: 'الذكاء الاصطناعي', count: 6, desc: 'قرر بناءً على البيانات. AI يكشف التلاعب ويتنبأ بالمبيعات.' },
];

export default function Design1() {
  useEffect(() => {
    // Inject Tailwind CDN
    if (!document.getElementById('tailwind-cdn-script')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn-script';
      script.src = "https://cdn.tailwindcss.com?plugins=forms,container-queries";
      document.head.appendChild(script);
    }
    
    // Inject Tailwind Config
    const existingConfig = document.getElementById('tailwind-config-script');
    if (existingConfig) existingConfig.remove();
    
    const config = document.createElement('script');
    config.id = 'tailwind-config-script';
    config.innerHTML = `
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "primary": "#053d2f",
              "primary-medium": "#064e3b",
              "primary-light": "#10b981",
              "surface": "#ffffff",
              "surface-variant": "#fcfdfe",
              "on-surface": "#0f172a",
              "on-surface-variant": "#64748b",
              "accent": "#f59e0b",
            },
            fontFamily: {
              sans: ["Noto Sans Arabic", "Manrope", "sans-serif"],
            },
            borderRadius: {
              "premium": "1rem",
              "super": "2rem",
            },
            animation: {
              'fade-in-up': 'fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              'fade-in': 'fadeIn 1.2s ease-out forwards',
              'float': 'float 8s ease-in-out infinite',
            },
            keyframes: {
              fadeInUp: {
                '0%': { opacity: '0', transform: 'translateY(20px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
              },
              fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
              },
              float: {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-15px)' },
              }
            }
          },
        },
      }
    `;
    document.head.appendChild(config);

    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
            }
        });
    }, observerOptions);

    setTimeout(() => {
      document.querySelectorAll('.reveal-hidden').forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Noto+Sans+Arabic:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        body { font-family: 'Noto Sans Arabic', 'Manrope', sans-serif; scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
        .glass-premium {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            background: rgba(255, 255, 255, 0.75);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .glass-dark {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .reveal-hidden { opacity: 0; transform: translateY(20px); transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-visible { opacity: 1; transform: translateY(0); }
        .card-hover { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .card-hover:hover { transform: translateY(-10px); box-shadow: 0 30px 60px -15px rgba(0,0,0,0.08); }
        .shimmer {
            position: relative;
            overflow: hidden;
        }
        .shimmer::after {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%);
            animation: shimmer-effect 4s infinite linear;
        }
        @keyframes shimmer-effect {
            0% { transform: translateX(-100%) translateY(-100%); }
            100% { transform: translateX(100%) translateY(100%); }
        }
        .text-balance { text-wrap: balance; }
      ` }} />
      <div dir="rtl" className="bg-[#ffffff] text-[#0f172a]">
        
        {/* Header */}
        <header className="fixed top-0 w-full z-[100] glass-premium border-b border-slate-200/40">
          <div className="max-w-[100rem] mx-auto px-6 h-20 flex justify-between items-center">
            <div className="flex items-center gap-16">
              <a className="text-2xl font-extrabold text-[#053d2f] tracking-tight flex items-center gap-2" href="/">
                <span className="material-symbols-outlined text-3xl">layers</span>
                <div className="flex flex-col">
                  <span>نما إنفست</span>
                  <span className="text-[#10b981] text-xs font-bold">Nama Invest ERP</span>
                </div>
              </a>
              <nav className="hidden lg:flex items-center gap-10">
                <a className="text-sm font-semibold text-[#053d2f] relative after:absolute after:bottom-[-4px] after:right-0 after:w-full after:h-[2px] after:bg-[#053d2f]" href="#">القطاعات</a>
                <a className="text-sm font-semibold text-[#64748b] hover:text-[#053d2f] transition-colors" href="#">المجموعات</a>
                <a className="text-sm font-semibold text-[#64748b] hover:text-[#053d2f] transition-colors" href="#">الـ 104 وحدة</a>
                <a className="text-sm font-semibold text-[#64748b] hover:text-[#053d2f] transition-colors" href="#">التسعير</a>
              </nav>
            </div>
            <div className="flex items-center gap-6">
              <button className="text-sm font-bold text-[#64748b] px-4 py-2 hover:text-[#053d2f] transition-all">تسجيل الدخول</button>
              <button className="text-sm font-bold bg-[#053d2f] text-white px-8 py-3 rounded-full shadow-lg shadow-[#053d2f]/10 hover:shadow-[#053d2f]/20 hover:-translate-y-0.5 active:scale-95 transition-all">🚀 سجّل مجاناً</button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-56 pb-40 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.03),transparent)]">
          <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-[#053d2f]/5 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="max-w-[100rem] mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-24">
            <div className="lg:w-1/2 text-right animate-fade-in-up">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#053d2f]/5 border border-[#053d2f]/10 text-[#053d2f] text-[13px] font-bold mb-10">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
                </span>
                نظام واحد · لكل الأعمال
              </div>
              <h1 className="text-6xl lg:text-[5.5rem] font-extrabold text-[#0f172a] mb-10 leading-[1.1] tracking-tight text-balance">
                نظام واحد.. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#053d2f] via-[#064e3b] to-[#10b981]">لكل الأعمال</span>
              </h1>
              <p className="text-xl text-[#64748b] mb-14 max-w-3xl ml-auto leading-relaxed font-normal">
                نظام نما إنفست هو نظام سحابي ERP متكامل بـ 104 وحدة برمجية، يدير أعمالك من نقاط البيع والمحاسبة إلى الموارد البشرية والذكاء الاصطناعي بكل احترافية.
              </p>
              <div className="flex flex-wrap gap-6 justify-end">
                <button className="bg-[#053d2f] text-white px-12 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-[#053d2f]/20 hover:shadow-[#053d2f]/40 hover:-translate-y-1 transition-all flex items-center gap-4">
                  <span>ابدأ الفترة التجريبية</span>
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <button className="border-2 border-slate-100 text-[#0f172a] px-12 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center gap-4">
                  <span>حجز عرض تجريبي</span>
                  <span className="material-symbols-outlined">download</span>
                </button>
              </div>
            </div>
            <div className="lg:w-1/2 relative animate-fade-in">
              <div className="relative z-20">
                <div className="absolute -inset-10 bg-gradient-to-tr from-[#053d2f]/5 to-transparent blur-3xl opacity-60"></div>
                <div className="relative bg-white p-3 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-100/60">
                  <img alt="Namaa ERP Interface" className="rounded-[2rem] w-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ9gwn_vHX32TapQZ9iKClb34-F6-7fSiWm3-x9iUMSRUbTqMcBMSIlzUr97XY02VgerYYBR7tsOvYmIX4-2jMbNRUQtuO8UoQzWi7V91MnMPKcmbHKhNBOkXgvsgHg6TroiZbuuEUxzuUCrVxsxUkkx7nrRfChthL7Y7sskP-toD4iZRcKjX0ye9eXLUS_vhB8gMHZQ9o-_I5jfYQ3oBCXQwe4G8FTnxPsxa39TvTQGpWZEeh5zhqbDj1ZK21dyFanDsXmde2dqs"/>
                </div>
                {/* Floating Analytics Card */}
                <div className="absolute -bottom-12 -right-8 glass-premium p-7 rounded-[2rem] shadow-xl z-30 border border-white animate-float flex items-center gap-5">
                  <div className="w-14 h-14 bg-emerald-100/50 rounded-2xl flex items-center justify-center text-[#064e3b]">
                    <span className="material-symbols-outlined text-3xl">insights</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">كفاءة التشغيل</p>
                    <p className="text-3xl font-extrabold text-[#053d2f]">+38.2%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        
        
        {/* Value Proposition Floating Bar */}
        <section className="relative z-30 -mt-16 lg:-mt-24 mb-20 px-6 max-w-[100rem] mx-auto reveal-hidden">
          <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-8 lg:p-12 border border-slate-100">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              
              <div className="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300 border-b md:border-b-0 md:border-l border-slate-100/80">
                <div className="w-20 h-20 mx-auto bg-emerald-50/80 text-[#10b981] rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-[#10b981] group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[40px]" style={{fontFamily: 'Material Symbols Outlined'}}>query_stats</span>
                </div>
                <h3 className="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">ركّز على نمو أعمالك..<br/>ودع المحاسبة علينا</h3>
              </div>

              <div className="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300 border-b md:border-b-0 md:border-l border-slate-100/80">
                <div className="w-20 h-20 mx-auto bg-blue-50/80 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[40px]" style={{fontFamily: 'Material Symbols Outlined'}}>dashboard_customize</span>
                </div>
                <h3 className="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">تحكّم كامل في ماليتك<br/>من شاشة واحدة</h3>
              </div>

              <div className="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300 border-b md:border-b-0 md:border-l border-slate-100/80">
                <div className="w-20 h-20 mx-auto bg-purple-50/80 text-purple-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[40px]" style={{fontFamily: 'Material Symbols Outlined'}}>trending_up</span>
                </div>
                <h3 className="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">اتخذ قراراتك بناءً على<br/>أرقام دقيقة وفورية</h3>
              </div>

              <div className="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300">
                <div className="w-20 h-20 mx-auto bg-orange-50/80 text-orange-500 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[40px]" style={{fontFamily: 'Material Symbols Outlined'}}>corporate_fare</span>
                </div>
                <h3 className="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">من شركة ناشئة إلى كبرى..<br/>نظام واحد يكبر معك</h3>
              </div>

            </div>
          </div>
        </section>
\n        {/* Industries */}
        <section className="py-40 bg-white">
          <div className="max-w-[100rem] mx-auto px-6">
            <div className="text-center mb-24 reveal-hidden">
              <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-8">القطاعات المدعومة</h2>
              <p className="text-[#64748b] max-w-4xl mx-auto text-lg leading-relaxed">بنينا نظام نماء ليكون مرناً بما يكفي ليناسب أدق تفاصيل العمل في مختلف الصناعات</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
              {INDUSTRIES.map((ind: any, i: number) => (
                <div key={i} className="group p-12 rounded-[3rem] bg-slate-50/50 border border-slate-100 text-center card-hover">
                  <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-sm group-hover:scale-110 transition-transform [&>svg]:w-12 [&>svg]:h-12 [&>svg]:text-[#10b981]">
                    {ind.icon}
                  </div>
                  <h3 className="font-bold text-xl text-[#0f172a]">{ind.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Strategic Clusters */}
        <section className="py-40 bg-slate-50/40">
          <div className="max-w-[100rem] mx-auto px-6">
            <div className="flex flex-col lg:flex-row justify-between items-end mb-28 gap-12">
              <div className="text-right max-w-4xl reveal-hidden">
                <span className="text-[#10b981] font-bold text-xs tracking-[0.2em] uppercase mb-5 block">المنظومة المتكاملة</span>
                <h2 className="text-5xl lg:text-6xl font-extrabold text-[#0f172a] mb-8 leading-[1.15]">5 مجموعات استراتيجية <br/>تغطي كافة احتياجاتك</h2>
              </div>
              <p className="text-[#64748b] text-xl max-w-md text-right leading-relaxed border-r-4 border-[#053d2f]/10 pr-10 reveal-hidden">
                أكثر من 104 وحدة برمجية تعمل في تناغم تام لتشكل العمود الفقري لعمليات منشأتك المالية والتشغيلية.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {POWER_CLUSTERS.map((cluster: any, i: number) => (
                <div key={i} className="group bg-white p-12 rounded-[3rem] border border-slate-100 card-hover relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-50/50 rounded-bl-[6rem] -mr-12 -mt-12 transition-all group-hover:scale-125"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-[#053d2f] text-white rounded-2xl flex items-center justify-center mb-12 shadow-xl shadow-[#053d2f]/10 [&>svg]:w-8 [&>svg]:h-8">
                      {cluster.icon}
                    </div>
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-2xl font-bold text-[#0f172a]">{cluster.title}</h4>
                      <span className="text-4xl font-black text-[#cbd5e1]">{cluster.count}</span>
                    </div>
                    <p className="text-[#64748b] mb-10 leading-relaxed text-lg">{cluster.desc}</p>
                    <a className="inline-flex items-center gap-3 text-[#053d2f] font-bold group-hover:gap-5 transition-all" href="#">
                      <span>اكتشف التفاصيل</span>
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                    </a>
                  </div>
                </div>
              ))}
              {/* Final Highlight Card */}
              <div className="bg-[#053d2f] p-12 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-center items-center text-center group">
                <div className="absolute inset-0 shimmer opacity-10"></div>
                <div className="relative z-10">
                  <h4 className="text-5xl font-black text-white mb-6">{modulesList.length} وحدة</h4>
                  <p className="text-emerald-300 font-bold mb-12 text-lg">منظومة لا تعرف الحدود لنماء استثماراتك</p>
                  <button className="bg-white text-[#053d2f] px-6 py-5 rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl">عرض القائمة الكاملة</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Micro-Grid */}
        <section className="py-40 bg-[#053d2f] text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-slate-50/10 to-transparent"></div>
          <div className="max-w-[100rem] mx-auto px-6 relative">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-28 gap-16">
              <div className="text-right reveal-hidden">
                <h2 className="text-5xl font-extrabold mb-6">استكشاف الوحدات التفصيلية</h2>
                <p className="text-emerald-100/60 text-xl font-light">تكامل مطلق يضمن كفاءة عالية لكافة مفاصل العمل</p>
              </div>
              <div className="relative w-full max-w-3xl reveal-hidden">
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-6 text-right focus:ring-2 focus:ring-primary-light focus:bg-white/10 transition-all placeholder:text-white/30 text-lg outline-none" placeholder="ابحث عن وحدة محددة (مثل: الأصول)" type="text"/>
                <span className="material-symbols-outlined absolute left-8 top-1/2 -translate-y-1/2 text-white/30 text-2xl">search</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {modulesList.map((m: { icon: React.ReactNode; title: string; desc: string; cat: string }, i: number) => (
                <div key={i} className="group bg-white/5 p-8 rounded-[2rem] border border-white/5 hover:bg-white/10 hover:border-[#10b981]/30 transition-all text-center flex flex-col items-center justify-center">
                  <div className="text-[#10b981]/80 mb-4 [&>svg]:w-8 [&>svg]:h-8">
                    {m.icon}
                  </div>
                  <p className="font-bold text-sm tracking-wide">{m.title}</p>
                </div>
              ))}
            </div>
            <div className="mt-24 text-center reveal-hidden">
              <button className="px-12 py-5 bg-[#10b981] text-[#053d2f] font-bold rounded-2xl hover:bg-white transition-all shadow-2xl shadow-[#10b981]/10">تواصل مع المستشار التقني</button>
            </div>
          </div>
        </section>

        {/* Connectivity / Downloads */}
        <section className="py-40 bg-white">
          <div className="max-w-[100rem] mx-auto px-6">
            <div className="bg-[#053d2f] rounded-[4rem] p-20 lg:p-28 relative overflow-hidden flex flex-col lg:flex-row items-center gap-24">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)] pointer-events-none"></div>
              <div className="lg:w-1/2 text-right relative z-10 reveal-hidden">
                <h2 className="text-5xl lg:text-6xl font-black text-white mb-10 leading-tight">نماء تحت تصرفك.. <br/><span className="text-[#10b981]">في أي وقت ومن أي مكان</span></h2>
                <p className="text-emerald-100/60 text-xl mb-16 leading-relaxed max-w-lg ml-auto">احصل على القوة الكاملة لنسخة Namaa Desktop للمكاتب، أو تابع أعمالك عبر تطبيقات الجوال المزامنة لحظياً.</p>
                <div className="flex flex-wrap gap-6 justify-end">
                  <button className="glass-dark text-white px-8 py-5 rounded-2xl flex items-center gap-5 hover:bg-white hover:text-[#053d2f] transition-all group border-white/10">
                    <span className="material-symbols-outlined text-4xl opacity-70 group-hover:opacity-100">laptop_mac</span>
                    <div className="text-right">
                      <p className="text-[11px] uppercase font-bold opacity-50">تحميل نسخة</p>
                      <p className="font-extrabold text-xl">Desktop Edition</p>
                    </div>
                  </button>
                  <button className="glass-dark text-white px-8 py-5 rounded-2xl flex items-center gap-5 hover:bg-white hover:text-[#053d2f] transition-all group border-white/10">
                    <span className="material-symbols-outlined text-4xl opacity-70 group-hover:opacity-100">apple</span>
                    <div className="text-right">
                      <p className="text-[11px] uppercase font-bold opacity-50">متوفر في</p>
                      <p className="font-extrabold text-xl">App Store</p>
                    </div>
                  </button>
                  <button className="glass-dark text-white px-8 py-5 rounded-2xl flex items-center gap-5 hover:bg-white hover:text-[#053d2f] transition-all group border-white/10">
                    <span className="material-symbols-outlined text-4xl opacity-70 group-hover:opacity-100">play_store</span>
                    <div className="text-right">
                      <p className="text-[11px] uppercase font-bold opacity-50">متوفر في</p>
                      <p className="font-extrabold text-xl">Google Play</p>
                    </div>
                  </button>
                </div>
              </div>
              <div className="lg:w-1/2 relative z-10 reveal-hidden">
                <div className="relative group">
                  <div className="absolute -inset-10 bg-[#10b981]/10 blur-[100px] rounded-full group-hover:bg-[#10b981]/20 transition-all"></div>
                  <img alt="Multi-device support" className="relative z-10 transform rotate-1 hover:rotate-0 transition-transform duration-1000 ease-out" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ5dnBMXhYQi3DTX9301cjprwTVpGAmyPklhZeCcWnhLujQjtb7cEzHbuNEl8twO-KyYFog-bMHFnZTOHOZ5rrIHYMBohgfuj9wNYf3pk_AKnvBsIhUzmSqiwIGCIsWGSBDu50shnXpQwkse2iITY9fI2bR9C9rD8xJIuikwYEzTQBzw05O-jbuFXA_Vs_FfgLKgbnE4ubgq4nTOVQyS2-ZJBU_y3EbD-nCk8KbRudlSWHW5LC6Usjofn9x-ihF_mdpYg1Vs7c8Cw"/>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-44 text-center relative overflow-hidden bg-white">
          <div className="max-w-4xl mx-auto px-6 relative z-10 reveal-hidden">
            <h2 className="text-5xl lg:text-7xl font-extrabold text-[#0f172a] mb-12 leading-tight tracking-tight">جاهز لقفزة نوعية في إدارة <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#053d2f] to-[#10b981]">استثماراتك؟</span></h2>
            <p className="text-2xl text-[#64748b] mb-20 max-w-4xl mx-auto leading-relaxed font-light">انضم لأكثر من 5,000 منشأة تعتمد على نماء يومياً لإدارة عملياتها المعقدة بكل سهولة واحترافية.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-8">
              <button className="bg-[#053d2f] text-white px-16 py-7 rounded-[1.5rem] font-bold text-xl shadow-2xl shadow-[#053d2f]/20 hover:scale-[1.03] active:scale-95 transition-all">ابدأ الفترة التجريبية</button>
              <button className="bg-white border-2 border-slate-100 text-[#0f172a] px-16 py-7 rounded-[1.5rem] font-bold text-xl hover:bg-slate-50 transition-all">تحدث مع المبيعات</button>
            </div>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-10 text-[#64748b] font-semibold">
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[#10b981] text-2xl">check_circle</span> إعداد في دقائق</div>
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[#10b981] text-2xl">check_circle</span> لا حاجة لبطاقة ائتمان</div>
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[#10b981] text-2xl">check_circle</span> دعم فني محلي 24/7</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-200/60 pt-28 pb-16">
          <div className="max-w-[100rem] mx-auto px-6">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-24 mb-24">
              <div className="max-w-xs">
                <a className="text-3xl font-black text-[#053d2f] mb-10 block tracking-tight" href="#">نما إنفست</a>
                <p className="text-[#64748b] leading-relaxed text-base font-normal">نظام ERP متكامل يهدف لتمكين المؤسسات من تحقيق نمو مستدام عبر تكنولوجيا ذكية وسهلة الاستخدام.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-24">
                <div>
                  <h5 className="font-bold text-[#0f172a] mb-8 text-lg">المنتجات</h5>
                  <ul className="space-y-5 text-sm font-medium text-[#64748b]">
                    <li><a className="hover:text-[#053d2f] transition-colors" href="#">الحلول المالية</a></li>
                    <li><a className="hover:text-[#053d2f] transition-colors" href="#">نقاط البيع</a></li>
                    <li><a className="hover:text-[#053d2f] transition-colors" href="#">المخازن واللوجستيات</a></li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-[#0f172a] mb-8 text-lg">الشركة</h5>
                  <ul className="space-y-5 text-sm font-medium text-[#64748b]">
                    <li><a className="hover:text-[#053d2f] transition-colors" href="#">عن نماء</a></li>
                    <li><a className="hover:text-[#053d2f] transition-colors" href="#">العملاء</a></li>
                    <li><a className="hover:text-[#053d2f] transition-colors" href="#">تواصل معنا</a></li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-[#0f172a] mb-8 text-lg">الدعم</h5>
                  <ul className="space-y-5 text-sm font-medium text-[#64748b]">
                    <li><a className="hover:text-[#053d2f] transition-colors" href="#">مركز المساعدة</a></li>
                    <li><a className="hover:text-[#053d2f] transition-colors" href="#">التوثيق التقني</a></li>
                    <li><a className="hover:text-[#053d2f] transition-colors" href="#">الأسئلة الشائعة</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="pt-16 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-10">
              <p className="text-sm text-slate-400 font-medium tracking-wide">© 2024 نما إنفست. جميع الحقوق محفوظة.</p>
              <div className="flex gap-10 text-sm font-semibold text-slate-400">
                <a className="hover:text-[#053d2f] transition-colors" href="#">سياسة الخصوصية</a>
                <a className="hover:text-[#053d2f] transition-colors" href="#">شروط الاستخدام</a>
                <a className="hover:text-[#053d2f] transition-colors" href="#">خارطة الموقع</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
