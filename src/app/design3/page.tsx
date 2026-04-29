
"use client";
import React, { useEffect } from 'react';

export default function Design() {
  useEffect(() => {
    
    // Inject Fonts dynamically to avoid Next.js stripping them
    if (!document.getElementById('fonts-css')) {
      const link1 = document.createElement('link');
      link1.id = 'fonts-css';
      link1.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap";
      link1.rel = "stylesheet";
      document.head.appendChild(link1);

      const link2 = document.createElement('link');
      link2.id = 'icons-css';
      link2.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
      link2.rel = "stylesheet";
      document.head.appendChild(link2);
    }

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
              "primary": "#2d5a4c", // Muted, sophisticated Emerald
              "primary-light": "#5b8e7d",
              "surface": "#ffffff",
              "surface-variant": "#fcfcfc",
              "on-surface": "#1e293b", // Slate 800
              "on-surface-variant": "#64748b", // Slate 500
              "accent": "#e2e8f0",
            },
            fontFamily: {
              sans: ["Noto Sans Arabic", "Inter", "sans-serif"],
            },
            borderRadius: {
              "premium": "0.75rem",
              "super": "1.5rem",
            },
            animation: {
              'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
              'fade-in': 'fadeIn 0.8s ease-out forwards',
            },
            keyframes: {
              fadeInUp: {
                '0%': { opacity: '0', transform: 'translateY(15px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
              },
              fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
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

    // Use a short timeout to ensure DOM is ready
    setTimeout(() => {
      document.querySelectorAll('.reveal-hidden').forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { font-family: 'Noto Sans Arabic', 'Inter', sans-serif; scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
        .minimal-border { border: 1px solid #f1f5f9; }
        .subtle-shadow { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
        .reveal-hidden { opacity: 0; }
        .reveal-visible { animation: fadeInUp 0.6s ease-out forwards; }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { border-color: #cbd5e1; background-color: #f8fafc; }
    ` }} />
      <div dir="rtl" className="bg-surface text-on-surface">
        <div dangerouslySetInnerHTML={{ __html: `
<!-- Header -->
<header class="fixed top-0 w-full z-[100] bg-white/90 backdrop-blur-md border-b border-slate-100">
<div class="max-w-[100rem] mx-auto px-6 h-20 flex justify-between items-center">
<div class="flex items-center gap-10">
<a class="text-xl font-bold text-primary tracking-tight" href="#"><span class="material-symbols-outlined text-3xl">layers</span><div class="flex flex-col"><span>نما إنفست</span><span class="text-current text-xs font-bold opacity-80">Nama Invest ERP</span></div></a>
<nav class="hidden lg:flex items-center gap-6">
<a class="text-xs font-semibold text-primary" href="#">القطاعات</a>
<a class="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors" href="#">المجموعات</a>
<a class="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors" href="#">الـ 104 وحدة</a>
<a class="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors" href="#">التسعير</a>
</nav>
</div>
<div class="flex items-center gap-3">
<button class="text-xs font-semibold text-on-surface-variant px-4 py-2 hover:bg-slate-50 rounded-lg transition-all">تسجيل الدخول</button>
<button class="text-xs font-bold bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-all">🚀 سجّل مجاناً</button>
</div>
</div>
</header>
<!-- Hero Section -->
<section class="relative pt-40 pb-24 bg-white">
<div class="max-w-[100rem] mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
<div class="lg:w-1/2 text-right animate-fade-in-up">
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-primary text-[10px] font-bold mb-6">
<span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                نظام ERP الجيل القادم للمؤسسات السعودية
            </div>
<h1 class="text-4xl lg:text-6xl font-bold text-on-surface mb-6 leading-tight">
                منصة رقمية واحدة <br/>
<span class="text-primary-light">لقيادة مستقبلك</span>
</h1>
<p class="text-lg text-on-surface-variant mb-10 max-w-xl ml-auto leading-relaxed font-light">
                نماء للاستثمار يقدم منظومة ERP سحابية متكاملة بـ 104 وحدة متخصصة، مصممة بدقة لتلبية تطلعات الصيدليات، المصانع، والمؤسسات الخدمية الكبرى.
            </p>
<div class="flex flex-wrap gap-4 justify-end">
<button class="bg-primary text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-3">
<span>ابدأ الفترة التجريبية</span>
<span class="material-symbols-outlined text-sm">arrow_back</span>
</button>
<button class="border border-slate-200 text-on-surface px-8 py-4 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-3">
<span>حجز عرض تجريبي</span>
<span class="material-symbols-outlined text-sm">download</span>
</button>
</div>
</div>
<div class="lg:w-1/2 animate-fade-in">
<div class="relative bg-slate-50 p-2 rounded-2xl border border-slate-100">
<img alt="Namaa ERP Interface" class="rounded-xl w-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ9gwn_vHX32TapQZ9iKClb34-F6-7fSiWm3-x9iUMSRUbTqMcBMSIlzUr97XY02VgerYYBR7tsOvYmIX4-2jMbNRUQtuO8UoQzWi7V91MnMPKcmbHKhNBOkXgvsgHg6TroiZbuuEUxzuUCrVxsxUkkx7nrRfChthL7Y7sskP-toD4iZRcKjX0ye9eXLUS_vhB8gMHZQ9o-_I5jfYQ3oBCXQwe4G8FTnxPsxa39TvTQGpWZEeh5zhqbDj1ZK21dyFanDsXmde2dqs"/>
</div>
</div>
</div>
</section>

<!-- Value Proposition Floating Bar -->
<section class="relative z-30 -mt-16 lg:-mt-24 mb-20 px-6 max-w-[100rem] mx-auto reveal-hidden">
  <div class="bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-8 lg:p-12 border border-slate-100">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
      
      <div class="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300 border-b md:border-b-0 md:border-l border-slate-100/80">
        <div class="w-20 h-20 mx-auto bg-emerald-50/80 text-[#10b981] rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-[#10b981] group-hover:text-white transition-all duration-300">
          <span class="material-symbols-outlined text-[40px]" style="font-family: 'Material Symbols Outlined';">query_stats</span>
        </div>
        <h3 class="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">ركّز على نمو أعمالك..<br/>ودع المحاسبة علينا</h3>
      </div>

      <div class="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300 border-b md:border-b-0 md:border-l border-slate-100/80">
        <div class="w-20 h-20 mx-auto bg-blue-50/80 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
          <span class="material-symbols-outlined text-[40px]" style="font-family: 'Material Symbols Outlined';">dashboard_customize</span>
        </div>
        <h3 class="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">تحكّم كامل في ماليتك<br/>من شاشة واحدة</h3>
      </div>

      <div class="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300 border-b md:border-b-0 md:border-l border-slate-100/80">
        <div class="w-20 h-20 mx-auto bg-purple-50/80 text-purple-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
          <span class="material-symbols-outlined text-[40px]" style="font-family: 'Material Symbols Outlined';">trending_up</span>
        </div>
        <h3 class="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">اتخذ قراراتك بناءً على<br/>أرقام دقيقة وفورية</h3>
      </div>

      <div class="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300">
        <div class="w-20 h-20 mx-auto bg-orange-50/80 text-orange-500 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
          <span class="material-symbols-outlined text-[40px]" style="font-family: 'Material Symbols Outlined';">corporate_fare</span>
        </div>
        <h3 class="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">من شركة ناشئة إلى كبرى..<br/>نظام واحد يكبر معك</h3>
      </div>

    </div>
  </div>
</section>
\n<!-- Industries -->
<section class="py-24 bg-surface-variant border-y border-slate-50">
<div class="max-w-[100rem] mx-auto px-6">
<div class="text-center mb-16 reveal-hidden">
<h2 class="text-3xl font-bold text-on-surface mb-4">حلول متخصصة لكل قطاع</h2>
<p class="text-on-surface-variant max-w-2xl mx-auto text-base font-light">بنينا نظام نماء ليكون مرناً بما يكفي ليناسب أدق تفاصيل العمل في مختلف الصناعات</p>
</div>
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
<div class="group p-8 rounded-2xl bg-white border border-slate-100 text-center card-hover subtle-shadow">
<div class="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6 text-primary">
<span class="material-symbols-outlined text-2xl">engineering</span>
</div>
<h3 class="font-bold text-sm text-on-surface">الصيانة والخدمات</h3>
</div>
<div class="group p-8 rounded-2xl bg-white border border-slate-100 text-center card-hover subtle-shadow">
<div class="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6 text-primary">
<span class="material-symbols-outlined text-2xl">factory</span>
</div>
<h3 class="font-bold text-sm text-on-surface">التصنيع والإنتاج</h3>
</div>
<div class="group p-8 rounded-2xl bg-white border border-slate-100 text-center card-hover subtle-shadow">
<div class="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6 text-primary">
<span class="material-symbols-outlined text-2xl">local_dining</span>
</div>
<h3 class="font-bold text-sm text-on-surface">المطاعم</h3>
</div>
<div class="group p-8 rounded-2xl bg-white border border-slate-100 text-center card-hover subtle-shadow">
<div class="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6 text-primary">
<span class="material-symbols-outlined text-2xl">storefront</span>
</div>
<h3 class="font-bold text-sm text-on-surface">التجزئة</h3>
</div>
<div class="group p-8 rounded-2xl bg-white border border-slate-100 text-center card-hover subtle-shadow">
<div class="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-6 text-primary">
<span class="material-symbols-outlined text-2xl">health_and_safety</span>
</div>
<h3 class="font-bold text-sm text-on-surface">الصيدليات</h3>
</div>
</div>
</div>
</section>
<!-- Strategic Clusters -->
<section class="py-24 bg-white">
<div class="max-w-[100rem] mx-auto px-6">
<div class="flex flex-col lg:flex-row justify-between items-start mb-16 gap-8">
<div class="text-right max-w-2xl">
<span class="text-primary-light font-bold text-[10px] uppercase tracking-widest mb-2 block">المنظومة المتكاملة</span>
<h2 class="text-3xl font-bold text-on-surface mb-4">5 مجموعات استراتيجية</h2>
<p class="text-on-surface-variant text-base font-light leading-relaxed">
                    أكثر من 104 وحدة برمجية تعمل في تناغم تام لتشكل العمود الفقري لعمليات منشأتك المالية والتشغيلية.
                </p>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<!-- Cluster Cards -->
<div class="p-8 rounded-2xl border border-slate-100 bg-white subtle-shadow card-hover">
<div class="flex justify-between items-start mb-8">
<div class="w-10 h-10 bg-primary/5 text-primary rounded-lg flex items-center justify-center">
<span class="material-symbols-outlined text-xl">payments</span>
</div>
<span class="text-xl font-bold text-slate-200">13</span>
</div>
<h4 class="text-lg font-bold text-on-surface mb-3">الـ 104 وحدة</h4>
<p class="text-sm text-on-surface-variant mb-6 font-light">إدارة دقيقة للحسابات العامة، التدفقات النقدية، والميزانيات العمومية وفق المعايير العالمية.</p>
<a class="inline-flex items-center gap-2 text-primary font-bold text-xs" href="#">
<span>اكتشف 13 وحدة مالية</span>
<span class="material-symbols-outlined text-xs">arrow_back</span>
</a>
</div>
<div class="p-8 rounded-2xl border border-slate-100 bg-white subtle-shadow card-hover">
<div class="flex justify-between items-start mb-8">
<div class="w-10 h-10 bg-primary/5 text-primary rounded-lg flex items-center justify-center">
<span class="material-symbols-outlined text-xl">inventory_2</span>
</div>
<span class="text-xl font-bold text-slate-200">14</span>
</div>
<h4 class="text-lg font-bold text-on-surface mb-3">إدارة المستودعات</h4>
<p class="text-sm text-on-surface-variant mb-6 font-light">تحكم ذكي في المخزون، الجرد الآلي، وسلاسل التوريد لضمان استمرارية الأعمال.</p>
<a class="inline-flex items-center gap-2 text-primary font-bold text-xs" href="#">
<span>اكتشف 14 وحدة مخزون</span>
<span class="material-symbols-outlined text-xs">arrow_back</span>
</a>
</div>
<div class="p-8 rounded-2xl border border-slate-100 bg-white subtle-shadow card-hover">
<div class="flex justify-between items-start mb-8">
<div class="w-10 h-10 bg-primary/5 text-primary rounded-lg flex items-center justify-center">
<span class="material-symbols-outlined text-xl">shopping_cart</span>
</div>
<span class="text-xl font-bold text-slate-200">19</span>
</div>
<h4 class="text-lg font-bold text-on-surface mb-3">المبيعات والعملاء</h4>
<p class="text-sm text-on-surface-variant mb-6 font-light">أنظمة نقاط البيع، برامج الولاء، وإدارة علاقات العملاء لزيادة العوائد.</p>
<a class="inline-flex items-center gap-2 text-primary font-bold text-xs" href="#">
<span>اكتشف 19 وحدة مبيعات</span>
<span class="material-symbols-outlined text-xs">arrow_back</span>
</a>
</div>
<div class="p-8 rounded-2xl border border-slate-100 bg-white subtle-shadow card-hover">
<div class="flex justify-between items-start mb-8">
<div class="w-10 h-10 bg-primary/5 text-primary rounded-lg flex items-center justify-center">
<span class="material-symbols-outlined text-xl">groups</span>
</div>
<span class="text-xl font-bold text-slate-200">25</span>
</div>
<h4 class="text-lg font-bold text-on-surface mb-3">الموارد البشرية</h4>
<p class="text-sm text-on-surface-variant mb-6 font-light">إدارة شاملة لشؤون الموظفين، الرواتب، التقييم، والأصول الثابتة للمنشأة.</p>
<a class="inline-flex items-center gap-2 text-primary font-bold text-xs" href="#">
<span>اكتشف 25 وحدة HR</span>
<span class="material-symbols-outlined text-xs">arrow_back</span>
</a>
</div>
<div class="p-8 rounded-2xl border border-slate-100 bg-white subtle-shadow card-hover">
<div class="flex justify-between items-start mb-8">
<div class="w-10 h-10 bg-primary/5 text-primary rounded-lg flex items-center justify-center">
<span class="material-symbols-outlined text-xl">analytics</span>
</div>
<span class="text-xl font-bold text-slate-200">06</span>
</div>
<h4 class="text-lg font-bold text-on-surface mb-3">الذكاء والبيانات</h4>
<p class="text-sm text-on-surface-variant mb-6 font-light">تحليلات متقدمة، تقارير ذكية، وتنبؤات مبنية على البيانات لاتخاذ قرارات حكيمة.</p>
<a class="inline-flex items-center gap-2 text-primary font-bold text-xs" href="#">
<span>اكتشف وحدات الذكاء</span>
<span class="material-symbols-outlined text-xs">arrow_back</span>
</a>
</div>
<div class="bg-primary p-8 rounded-2xl flex flex-col justify-center items-center text-center">
<h4 class="text-3xl font-bold text-white mb-2">104 وحدة</h4>
<p class="text-primary-light font-medium text-xs mb-8 opacity-80">منظومة لا تعرف الحدود لنماء استثماراتك</p>
<button class="w-full bg-white text-primary px-6 py-3 rounded-lg font-bold text-xs hover:bg-slate-50 transition-all">عرض القائمة الكاملة</button>
</div>
</div>
</div>
</section>
<!-- Modules Micro-Grid -->
<section class="py-24 bg-surface-variant">
<div class="max-w-[100rem] mx-auto px-6">
<div class="flex flex-col lg:flex-row justify-between items-center mb-16 gap-8">
<div class="text-right">
<h2 class="text-2xl font-bold mb-2">استكشاف الوحدات التفصيلية</h2>
<p class="text-on-surface-variant text-sm font-light">تكامل مطلق يضمن كفاءة عالية لكافة مفاصل العمل</p>
</div>
<div class="relative w-full max-w-sm">
<input class="w-full bg-white border border-slate-200 rounded-xl py-3 px-6 text-right text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-400" placeholder="ابحث عن وحدة محددة..." type="text"/>
<span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
</div>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
<!-- Simplified Module Items -->
<div class="p-5 bg-white rounded-xl border border-slate-100 text-center card-hover subtle-shadow">
<span class="material-symbols-outlined text-primary-light text-xl mb-3 block">auto_stories</span>
<p class="font-bold text-[11px] text-on-surface">الأستاذ العام</p>
</div>
<div class="p-5 bg-white rounded-xl border border-slate-100 text-center card-hover subtle-shadow">
<span class="material-symbols-outlined text-primary-light text-xl mb-3 block">account_balance_wallet</span>
<p class="font-bold text-[11px] text-on-surface">حسابات الموردين</p>
</div>
<div class="p-5 bg-white rounded-xl border border-slate-100 text-center card-hover subtle-shadow">
<span class="material-symbols-outlined text-primary-light text-xl mb-3 block">badge</span>
<p class="font-bold text-[11px] text-on-surface">شؤون الموظفين</p>
</div>
<div class="p-5 bg-white rounded-xl border border-slate-100 text-center card-hover subtle-shadow">
<span class="material-symbols-outlined text-primary-light text-xl mb-3 block">local_mall</span>
<p class="font-bold text-[11px] text-on-surface">المشتريات</p>
</div>
<div class="p-5 bg-white rounded-xl border border-slate-100 text-center card-hover subtle-shadow">
<span class="material-symbols-outlined text-primary-light text-xl mb-3 block">support_agent</span>
<p class="font-bold text-[11px] text-on-surface">إدارة CRM</p>
</div>
<div class="p-5 bg-white rounded-xl border border-slate-100 text-center card-hover subtle-shadow">
<span class="material-symbols-outlined text-primary-light text-xl mb-3 block">inventory</span>
<p class="font-bold text-[11px] text-on-surface">المخازن الذكية</p>
</div>
<div class="p-5 bg-white rounded-xl border border-slate-100 text-center card-hover subtle-shadow">
<span class="material-symbols-outlined text-primary-light text-xl mb-3 block">receipt</span>
<p class="font-bold text-[11px] text-on-surface">الفاتورة الضريبية</p>
</div>
<div class="p-5 bg-white rounded-xl border border-slate-100 text-center card-hover subtle-shadow">
<span class="material-symbols-outlined text-primary-light text-xl mb-3 block">precision_manufacturing</span>
<p class="font-bold text-[11px] text-on-surface">خطوط الإنتاج</p>
</div>
<div class="p-5 bg-white rounded-xl border border-slate-100 text-center card-hover subtle-shadow">
<span class="material-symbols-outlined text-primary-light text-xl mb-3 block">bar_chart</span>
<p class="font-bold text-[11px] text-on-surface">تحليلات الأداء</p>
</div>
<div class="p-5 bg-white rounded-xl border border-slate-100 text-center card-hover subtle-shadow">
<span class="material-symbols-outlined text-primary-light text-xl mb-3 block">schema</span>
<p class="font-bold text-[11px] text-on-surface">إدارة المشاريع</p>
</div>
<div class="p-5 bg-white rounded-xl border border-slate-100 text-center card-hover subtle-shadow">
<span class="material-symbols-outlined text-primary-light text-xl mb-3 block">military_tech</span>
<p class="font-bold text-[11px] text-on-surface">إدارة الجودة</p>
</div>
<div class="p-5 bg-white rounded-xl border border-slate-100 text-center card-hover subtle-shadow">
<span class="material-symbols-outlined text-primary-light text-xl mb-3 block">smartphone</span>
<p class="font-bold text-[11px] text-on-surface">تطبيقات النقال</p>
</div>
</div>
<div class="mt-16 text-center">
<button class="px-8 py-3 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors">تواصل مع المستشار التقني</button>
</div>
</div>
</section>
<!-- Connectivity / Downloads -->
<section class="py-24 bg-white">
<div class="max-w-[100rem] mx-auto px-6">
<div class="bg-slate-900 rounded-3xl p-12 lg:p-20 flex flex-col lg:flex-row items-center gap-16">
<div class="lg:w-1/2 text-right">
<h2 class="text-3xl font-bold text-white mb-6 leading-tight">نماء تحت تصرفك <br/><span class="text-primary-light">في أي مكان</span></h2>
<p class="text-slate-400 text-base mb-10 leading-relaxed font-light">احصل على القوة الكاملة لنسخة Namaa Desktop للمكاتب، أو تابع أعمالك عبر تطبيقات الجوال المزامنة لحظياً.</p>
<div class="flex flex-wrap gap-4 justify-end">
<button class="bg-white/5 text-white border border-white/10 px-5 py-3 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all">
<span class="material-symbols-outlined text-xl">laptop_mac</span>
<span class="text-xs font-bold">Desktop Edition</span>
</button>
<button class="bg-white/5 text-white border border-white/10 px-5 py-3 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all">
<span class="material-symbols-outlined text-xl">apple</span>
<span class="text-xs font-bold">App Store</span>
</button>
<button class="bg-white/5 text-white border border-white/10 px-5 py-3 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all">
<span class="material-symbols-outlined text-xl">play_store</span>
<span class="text-xs font-bold">Google Play</span>
</button>
</div>
</div>
<div class="lg:w-1/2">
<img alt="Multi-device support" class="w-full opacity-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ5dnBMXhYQi3DTX9301cjprwTVpGAmyPklhZeCcWnhLujQjtb7cEzHbuNEl8twO-KyYFog-bMHFnZTOHOZ5rrIHYMBohgfuj9wNYf3pk_AKnvBsIhUzmSqiwIGCIsWGSBDu50shnXpQwkse2iITY9fI2bR9C9rD8xJIuikwYEzTQBzw05O-jbuFXA_Vs_FfgLKgbnE4ubgq4nTOVQyS2-ZJBU_y3EbD-nCk8KbRudlSWHW5LC6Usjofn9x-ihF_mdpYg1Vs7c8Cw"/>
</div>
</div>
</div>
</section>
<!-- Final CTA -->
<section class="py-24 text-center bg-white border-t border-slate-50">
<div class="max-w-4xl mx-auto px-6">
<h2 class="text-3xl font-bold text-on-surface mb-6">جاهز لقفزة نوعية في إدارة <span class="text-primary">استثماراتك؟</span></h2>
<p class="text-lg text-on-surface-variant mb-12 max-w-2xl mx-auto leading-relaxed font-light">انضم لأكثر من 5,000 منشأة تعتمد على نماء يومياً لإدارة عملياتها المعقدة بكل سهولة واحترافية.</p>
<div class="flex flex-col sm:flex-row justify-center gap-4">
<button class="bg-primary text-white px-6 py-4 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all">ابدأ الفترة التجريبية</button>
<button class="border border-slate-200 text-on-surface px-6 py-4 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">تحدث مع المبيعات</button>
</div>
<div class="mt-10 flex items-center justify-center gap-6 text-[11px] text-slate-400 font-medium">
<div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-primary text-sm">check_circle</span> إعداد في دقائق</div>
<div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-primary text-sm">check_circle</span> لا حاجة لبطاقة ائتمان</div>
<div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-primary text-sm">check_circle</span> دعم فني محلي 24/7</div>
</div>
</div>
</section>
<!-- Footer -->
<footer class="bg-slate-50 pt-16 pb-10 border-t border-slate-100">
<div class="max-w-[100rem] mx-auto px-6">
<div class="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
<div class="max-w-xs">
<a class="text-xl font-bold text-primary mb-6 block" href="#">نما إنفست</a>
<p class="text-on-surface-variant leading-relaxed text-xs font-light">نظام ERP متكامل يهدف لتمكين المؤسسات من تحقيق نمو مستدام عبر تكنولوجيا ذكية وسهلة الاستخدام.</p>
</div>
<div class="grid grid-cols-2 md:grid-cols-3 gap-12">
<div>
<h5 class="font-bold text-xs text-on-surface mb-5 uppercase tracking-wider">المنتجات</h5>
<ul class="space-y-3 text-xs text-on-surface-variant font-light">
<li><a class="hover:text-primary transition-colors" href="#">الحلول المالية</a></li>
<li><a class="hover:text-primary transition-colors" href="#">نقاط البيع</a></li>
<li><a class="hover:text-primary transition-colors" href="#">المخازن واللوجستيات</a></li>
</ul>
</div>
<div>
<h5 class="font-bold text-xs text-on-surface mb-5 uppercase tracking-wider">الشركة</h5>
<ul class="space-y-3 text-xs text-on-surface-variant font-light">
<li><a class="hover:text-primary transition-colors" href="#">عن نماء</a></li>
<li><a class="hover:text-primary transition-colors" href="#">العملاء</a></li>
<li><a class="hover:text-primary transition-colors" href="#">تواصل معنا</a></li>
</ul>
</div>
<div>
<h5 class="font-bold text-xs text-on-surface mb-5 uppercase tracking-wider">الدعم</h5>
<ul class="space-y-3 text-xs text-on-surface-variant font-light">
<li><a class="hover:text-primary transition-colors" href="#">مركز المساعدة</a></li>
<li><a class="hover:text-primary transition-colors" href="#">التوثيق التقني</a></li>
<li><a class="hover:text-primary transition-colors" href="#">الأسئلة الشائعة</a></li>
</ul>
</div>
</div>
</div>
<div class="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
<p class="text-[10px] text-slate-400">© 2024 نما إنفست. جميع الحقوق محفوظة.</p>
<div class="flex gap-6 text-[10px] text-slate-400">
<a class="hover:text-primary transition-colors" href="#">سياسة الخصوصية</a>
<a class="hover:text-primary transition-colors" href="#">شروط الاستخدام</a>
<a class="hover:text-primary transition-colors" href="#">خارطة الموقع</a>
</div>
</div>
</div>
</footer>

` }} />
      </div>
    </>
  );
}
