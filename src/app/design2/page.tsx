
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
              "primary": "#052e16", // Much deeper forest green
              "primary-mid": "#064e3b", // Deep Emerald
              "primary-light": "#10b981",
              "surface": "#ffffff",
              "surface-variant": "#f1f5f9",
              "on-surface": "#020617", // Deeper slate/black
              "on-surface-variant": "#334155", // Slate 700
              "accent-metallic": "#94a3b8", // Metallic silver/blue
              "gold-accent": "#d4af37", // Refined gold for subtle hierarchy
            },
            fontFamily: {
              sans: ["Noto Sans Arabic", "Manrope", "sans-serif"],
            },
            borderRadius: {
              "premium": "1rem",
              "super": "2rem",
            },
            animation: {
              'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              'fade-in': 'fadeIn 1.2s ease-out forwards',
              'float': 'float 5s ease-in-out infinite',
              'pulse-soft': 'pulse-soft 3s infinite',
            },
            keyframes: {
              fadeInUp: {
                '0%': { opacity: '0', transform: 'translateY(40px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
              },
              fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
              },
              float: {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-15px)' },
              },
              'pulse-soft': {
                '0%, 100%': { opacity: '1' },
                '50%': { opacity: '0.7' },
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
        body { font-family: 'Noto Sans Arabic', 'Manrope', sans-serif; scroll-behavior: smooth; }
        .premium-blur {
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            background: rgba(255, 255, 255, 0.9);
        }
        .reveal-hidden { opacity: 0; }
        .reveal-visible { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .card-hover { transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
        .card-hover:hover { transform: translateY(-12px); box-shadow: 0 30px 60px -12px rgba(2, 6, 23, 0.12); }
        .metallic-gradient {
            background: linear-gradient(135deg, #052e16 0%, #064e3b 100%);
        }
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
        .heading-bold { font-weight: 800; }
        .heading-extrabold { font-weight: 900; }
    ` }} />
      <div dir="rtl" className="bg-surface text-on-surface">
        <div dangerouslySetInnerHTML={{ __html: `
<!-- Header -->
<header class="fixed top-0 w-full z-[100] premium-blur border-b border-slate-200/40">
<div class="max-w-[100rem] mx-auto px-8 h-20 flex justify-between items-center">
<div class="flex items-center gap-14">
<a class="text-2xl heading-extrabold text-primary tracking-tight flex items-center gap-2" href="#"><span class="material-symbols-outlined text-3xl">layers</span><div class="flex flex-col"><span>نما إنفست</span><span class="text-current text-xs font-bold opacity-80">Nama Invest ERP</span></div></a>
<nav class="hidden lg:flex items-center gap-10">
<a class="text-[15px] font-bold text-primary border-b-2 border-primary pb-1" href="#">القطاعات</a>
<a class="text-[15px] font-bold text-on-surface-variant hover:text-primary transition-colors" href="#">المجموعات</a>
<a class="text-[15px] font-bold text-on-surface-variant hover:text-primary transition-colors" href="#">الـ 104 وحدة</a>
<a class="text-[15px] font-bold text-on-surface-variant hover:text-primary transition-colors" href="#">التسعير</a>
</nav>
</div>
<div class="flex items-center gap-6">
<button class="text-sm font-bold text-on-surface-variant px-5 py-2.5 rounded-lg hover:bg-slate-100/50 transition-all">تسجيل الدخول</button>
<button class="text-sm font-bold metallic-gradient text-white px-8 py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all">🚀 سجّل مجاناً</button>
</div>
</div>
</header>
<!-- Hero Section -->
<section class="relative pt-48 pb-36 overflow-hidden bg-[#fafafa]">
<div class="absolute top-0 right-0 w-[900px] h-[900px] bg-primary/10 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/3"></div>
<div class="absolute bottom-0 left-0 w-[700px] h-[700px] bg-primary-light/5 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4"></div>
<div class="max-w-[100rem] mx-auto px-8 relative z-10 flex flex-col lg:flex-row items-center gap-24">
<div class="lg:w-1/2 text-right animate-fade-in-up">
<div class="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-extrabold mb-10 tracking-wide uppercase">
<span class="relative flex h-2.5 w-2.5">
<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-light opacity-75"></span>
<span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
</span>
                نظام ERP الجيل القادم للمؤسسات السعودية
            </div>
<h1 class="text-6xl lg:text-[5.5rem] heading-extrabold text-on-surface mb-10 leading-[1.1] tracking-tight">
                منصة رقمية واحدة.. <br/>
<span class="text-transparent bg-clip-text bg-gradient-to-l from-primary to-primary-mid">لقيادة مستقبلك</span>
</h1>
<p class="text-xl text-on-surface-variant mb-14 max-w-xl ml-auto leading-relaxed font-medium">
                نماء للاستثمار يقدم منظومة ERP سحابية متكاملة بـ 104 وحدة متخصصة، مصممة بدقة لتلبية تطلعات الصيدليات، المصانع، والمؤسسات الخدمية الكبرى.
            </p>
<div class="flex flex-wrap gap-6 justify-end">
<button class="metallic-gradient text-white px-12 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1.5 transition-all flex items-center gap-4">
<span>ابدأ الفترة التجريبية</span>
<span class="material-symbols-outlined text-2xl">arrow_back</span>
</button>
<button class="bg-white border-2 border-slate-200 text-on-surface px-12 py-5 rounded-2xl font-bold text-lg hover:border-primary-light transition-all flex items-center gap-4">
<span>حجز عرض تجريبي</span>
<span class="material-symbols-outlined text-2xl">file_download</span>
</button>
</div>
</div>
<div class="lg:w-1/2 relative animate-fade-in">
<div class="relative z-20 group">
<div class="absolute -inset-6 bg-gradient-to-r from-primary/20 via-transparent to-primary-light/20 rounded-[3rem] blur-3xl group-hover:blur-[50px] transition-all opacity-80"></div>
<div class="relative bg-white p-3 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(2,6,23,0.15)] border border-slate-100 overflow-hidden">
<!-- Abstract Tech Visual replacement for UI screenshot -->
<img alt="Namaa Strategic Overview" class="rounded-[2rem] w-full transform group-hover:scale-[1.015] transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAUbpb2AonI1QzbJVlWVoBcf76hMTUlAJqu4XxyYqIn3GFxWu3xDEJ2vNt-_TT_fgz3PXp7_vfIqnoos9XozBx6SloX_xYK8SW-7Lwg3n4-Xs9H4gJ47wCy40qLYOF49Osfry8LtM45sJw4Fl0BtRNL5p11CbOmR9NQB0yvLQAUcztY4q8jc2yy5BHTOQAd7FAdIcPEA95bobxNW-TmP899BrugbWh9Xpwiv1AEWnWBP36K0xgmDbNBL_b7FL8K-HA-lznB3ePe3A"/>
</div>
<!-- Floating Element -->
<div class="absolute -bottom-12 -right-6 bg-white p-7 rounded-[2rem] shadow-2xl z-30 border border-slate-50 animate-float flex items-center gap-6">
<div class="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-primary-mid">
<span class="material-symbols-outlined text-4xl">query_stats</span>
</div>
<div>
<p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">كفاءة التشغيل</p>
<p class="text-3xl heading-extrabold text-primary">+38.2%</p>
</div>
</div>
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
<section class="py-36 bg-white">
<div class="max-w-[100rem] mx-auto px-8">
<div class="text-center mb-24 reveal-hidden">
<h2 class="text-4xl lg:text-5xl heading-extrabold text-on-surface mb-8">حلول متخصصة لكل قطاع</h2>
<p class="text-on-surface-variant max-w-2xl mx-auto text-xl font-medium leading-relaxed">بنينا نظام نماء ليكون مرناً بما يكفي ليناسب أدق تفاصيل العمل في مختلف الصناعات</p>
</div>
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
<!-- Item 1 -->
<div class="group p-12 rounded-[3rem] bg-slate-50/50 border border-slate-100/80 text-center card-hover">
<div class="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
<span class="material-symbols-outlined text-5xl text-slate-700">precision_manufacturing</span>
</div>
<h3 class="heading-bold text-xl text-on-surface">الصيانة والخدمات</h3>
</div>
<!-- Item 2 -->
<div class="group p-12 rounded-[3rem] bg-slate-50/50 border border-slate-100/80 text-center card-hover">
<div class="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
<span class="material-symbols-outlined text-5xl text-primary">domain</span>
</div>
<h3 class="heading-bold text-xl text-on-surface">التصنيع والإنتاج</h3>
</div>
<!-- Item 3 -->
<div class="group p-12 rounded-[3rem] bg-slate-50/50 border border-slate-100/80 text-center card-hover">
<div class="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
<span class="material-symbols-outlined text-5xl text-slate-700">restaurant</span>
</div>
<h3 class="heading-bold text-xl text-on-surface">المطاعم</h3>
</div>
<!-- Item 4 -->
<div class="group p-12 rounded-[3rem] bg-slate-50/50 border border-slate-100/80 text-center card-hover">
<div class="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
<span class="material-symbols-outlined text-5xl text-primary">store</span>
</div>
<h3 class="heading-bold text-xl text-on-surface">التجزئة</h3>
</div>
<!-- Item 5 -->
<div class="group p-12 rounded-[3rem] bg-slate-50/50 border border-slate-100/80 text-center card-hover">
<div class="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110">
<span class="material-symbols-outlined text-5xl text-slate-700">medication</span>
</div>
<h3 class="heading-bold text-xl text-on-surface">الصيدليات</h3>
</div>
</div>
</div>
</section>
<!-- Strategic Clusters -->
<section class="py-36 bg-slate-50/80">
<div class="max-w-[100rem] mx-auto px-8">
<div class="flex flex-col lg:flex-row justify-between items-end mb-28 gap-12">
<div class="text-right max-w-2xl">
<span class="text-primary-light font-extrabold text-sm tracking-[0.2em] uppercase mb-5 block">المنظومة المتكاملة</span>
<h2 class="text-5xl lg:text-6xl heading-extrabold text-on-surface mb-8 leading-tight">5 مجموعات استراتيجية <br/>تغطي كافة احتياجاتك</h2>
</div>
<p class="text-on-surface-variant text-xl max-w-md text-right leading-relaxed border-r-8 border-primary/20 pr-10 font-medium">
                أكثر من 104 وحدة برمجية تعمل في تناغم تام لتشكل العمود الفقري لعمليات منشأتك المالية والتشغيلية.
            </p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
<!-- Cluster 1 -->
<div class="group bg-white p-12 rounded-[3rem] border border-slate-100 card-hover relative overflow-hidden">
<div class="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-[6rem] -mr-12 -mt-12 transition-all group-hover:w-48 group-hover:h-48 group-hover:bg-primary/5"></div>
<div class="relative z-10">
<div class="w-20 h-20 metallic-gradient text-white rounded-[1.5rem] flex items-center justify-center mb-12 shadow-xl shadow-primary/10">
<span class="material-symbols-outlined text-4xl">account_balance</span>
</div>
<div class="flex justify-between items-center mb-6">
<h4 class="text-2xl heading-extrabold text-on-surface">الـ 104 وحدة</h4>
<span class="text-4xl heading-extrabold text-slate-100 group-hover:text-primary-light/20 transition-colors">13</span>
</div>
<p class="text-on-surface-variant mb-10 leading-relaxed font-medium">إدارة دقيقة للحسابات العامة، التدفقات النقدية، والميزانيات العمومية وفق المعايير العالمية.</p>
<a class="inline-flex items-center gap-3 text-primary heading-bold group-hover:gap-6 transition-all" href="#">
<span>اكتشف 13 وحدة مالية</span>
<span class="material-symbols-outlined">arrow_back</span>
</a>
</div>
</div>
<!-- Cluster 2 -->
<div class="group bg-white p-12 rounded-[3rem] border border-slate-100 card-hover relative overflow-hidden">
<div class="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-[6rem] -mr-12 -mt-12 transition-all group-hover:w-48 group-hover:h-48 group-hover:bg-primary/5"></div>
<div class="relative z-10">
<div class="w-20 h-20 metallic-gradient text-white rounded-[1.5rem] flex items-center justify-center mb-12 shadow-xl shadow-primary/10">
<span class="material-symbols-outlined text-4xl">inventory</span>
</div>
<div class="flex justify-between items-center mb-6">
<h4 class="text-2xl heading-extrabold text-on-surface">إدارة المستودعات</h4>
<span class="text-4xl heading-extrabold text-slate-100 group-hover:text-primary-light/20 transition-colors">14</span>
</div>
<p class="text-on-surface-variant mb-10 leading-relaxed font-medium">تحكم ذكي في المخزون، الجرد الآلي، وسلاسل التوريد لضمان استمرارية الأعمال.</p>
<a class="inline-flex items-center gap-3 text-primary heading-bold group-hover:gap-6 transition-all" href="#">
<span>اكتشف 14 وحدة مخزون</span>
<span class="material-symbols-outlined">arrow_back</span>
</a>
</div>
</div>
<!-- Cluster 3 -->
<div class="group bg-white p-12 rounded-[3rem] border border-slate-100 card-hover relative overflow-hidden">
<div class="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-[6rem] -mr-12 -mt-12 transition-all group-hover:w-48 group-hover:h-48 group-hover:bg-primary/5"></div>
<div class="relative z-10">
<div class="w-20 h-20 metallic-gradient text-white rounded-[1.5rem] flex items-center justify-center mb-12 shadow-xl shadow-primary/10">
<span class="material-symbols-outlined text-4xl">point_of_sale</span>
</div>
<div class="flex justify-between items-center mb-6">
<h4 class="text-2xl heading-extrabold text-on-surface">المبيعات والعملاء</h4>
<span class="text-4xl heading-extrabold text-slate-100 group-hover:text-primary-light/20 transition-colors">19</span>
</div>
<p class="text-on-surface-variant mb-10 leading-relaxed font-medium">أنظمة نقاط البيع، برامج الولاء، وإدارة علاقات العملاء لزيادة العوائد.</p>
<a class="inline-flex items-center gap-3 text-primary heading-bold group-hover:gap-6 transition-all" href="#">
<span>اكتشف 19 وحدة مبيعات</span>
<span class="material-symbols-outlined">arrow_back</span>
</a>
</div>
</div>
<!-- Cluster 4 -->
<div class="group bg-white p-12 rounded-[3rem] border border-slate-100 card-hover relative overflow-hidden">
<div class="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-[6rem] -mr-12 -mt-12 transition-all group-hover:w-48 group-hover:h-48 group-hover:bg-primary/5"></div>
<div class="relative z-10">
<div class="w-20 h-20 metallic-gradient text-white rounded-[1.5rem] flex items-center justify-center mb-12 shadow-xl shadow-primary/10">
<span class="material-symbols-outlined text-4xl">badge</span>
</div>
<div class="flex justify-between items-center mb-6">
<h4 class="text-2xl heading-extrabold text-on-surface">الموارد البشرية</h4>
<span class="text-4xl heading-extrabold text-slate-100 group-hover:text-primary-light/20 transition-colors">25</span>
</div>
<p class="text-on-surface-variant mb-10 leading-relaxed font-medium">إدارة شاملة لشؤون الموظفين، الرواتب، التقييم، والأصول الثابتة للمنشأة.</p>
<a class="inline-flex items-center gap-3 text-primary heading-bold group-hover:gap-6 transition-all" href="#">
<span>اكتشف 25 وحدة HR</span>
<span class="material-symbols-outlined">arrow_back</span>
</a>
</div>
</div>
<!-- Cluster 5 -->
<div class="group bg-white p-12 rounded-[3rem] border border-slate-100 card-hover relative overflow-hidden">
<div class="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-[6rem] -mr-12 -mt-12 transition-all group-hover:w-48 group-hover:h-48 group-hover:bg-primary/5"></div>
<div class="relative z-10">
<div class="w-20 h-20 metallic-gradient text-white rounded-[1.5rem] flex items-center justify-center mb-12 shadow-xl shadow-primary/10">
<span class="material-symbols-outlined text-4xl">hub</span>
</div>
<div class="flex justify-between items-center mb-6">
<h4 class="text-2xl heading-extrabold text-on-surface">الذكاء والبيانات</h4>
<span class="text-4xl heading-extrabold text-slate-100 group-hover:text-primary-light/20 transition-colors">06</span>
</div>
<p class="text-on-surface-variant mb-10 leading-relaxed font-medium">تحليلات متقدمة، تقارير ذكية، وتنبؤات مبنية على البيانات لاتخاذ قرارات حكيمة.</p>
<a class="inline-flex items-center gap-3 text-primary heading-bold group-hover:gap-6 transition-all" href="#">
<span>اكتشف وحدات الذكاء</span>
<span class="material-symbols-outlined">arrow_back</span>
</a>
</div>
</div>
<!-- Final Highlight Card -->
<div class="metallic-gradient p-12 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-center items-center text-center group">
<div class="absolute inset-0 shimmer opacity-10"></div>
<div class="relative z-10">
<h4 class="text-5xl heading-extrabold text-white mb-5 tracking-tight">104 وحدة</h4>
<p class="text-primary-light font-extrabold mb-12 opacity-90 text-lg uppercase tracking-widest">منظومة لا تعرف الحدود</p>
<button class="bg-white text-primary px-6 py-5 rounded-[1.25rem] font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl">عرض القائمة الكاملة</button>
</div>
</div>
</div>
</div>
</section>
<!-- Modules Micro-Grid -->
<section class="py-36 metallic-gradient text-white overflow-hidden relative">
<div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 40px 40px;"></div>
<div class="max-w-[100rem] mx-auto px-8 relative">
<div class="flex flex-col lg:flex-row justify-between items-center mb-28 gap-14">
<div class="text-right">
<h2 class="text-4xl lg:text-5xl heading-extrabold mb-6">استكشاف الوحدات التفصيلية</h2>
<p class="text-emerald-100/60 text-xl font-medium">تكامل مطلق يضمن كفاءة عالية لكافة مفاصل العمل</p>
</div>
<div class="relative w-full max-w-lg">
<input class="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-6 text-right focus:ring-2 focus:ring-primary-light focus:bg-white/10 transition-all placeholder:text-white/30 text-lg" placeholder="ابحث عن وحدة محددة (مثل: الأصول)" type="text"/>
<span class="material-symbols-outlined absolute left-8 top-1/2 -translate-y-1/2 text-white/40 text-3xl">search</span>
</div>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
<!-- Module Micro Items -->
<div class="group bg-white/5 p-10 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center">
<span class="material-symbols-outlined text-primary-light text-5xl mb-8 block">auto_stories</span>
<p class="heading-bold text-sm tracking-wide">الأستاذ العام</p>
</div>
<div class="group bg-white/5 p-10 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center">
<span class="material-symbols-outlined text-primary-light text-5xl mb-8 block">payments</span>
<p class="heading-bold text-sm tracking-wide">حسابات الموردين</p>
</div>
<div class="group bg-white/5 p-10 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center">
<span class="material-symbols-outlined text-primary-light text-5xl mb-8 block">engineering</span>
<p class="heading-bold text-sm tracking-wide">شؤون الموظفين</p>
</div>
<div class="group bg-white/5 p-10 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center">
<span class="material-symbols-outlined text-primary-light text-5xl mb-8 block">shopping_bag</span>
<p class="heading-bold text-sm tracking-wide">المشتريات</p>
</div>
<div class="group bg-white/5 p-10 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center">
<span class="material-symbols-outlined text-primary-light text-5xl mb-8 block">support_agent</span>
<p class="heading-bold text-sm tracking-wide">إدارة CRM</p>
</div>
<div class="group bg-white/5 p-10 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center">
<span class="material-symbols-outlined text-primary-light text-5xl mb-8 block">warehouse</span>
<p class="heading-bold text-sm tracking-wide">المخازن الذكية</p>
</div>
<div class="group bg-white/5 p-10 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center">
<span class="material-symbols-outlined text-primary-light text-5xl mb-8 block">receipt_long</span>
<p class="heading-bold text-sm tracking-wide">الفاتورة الضريبية</p>
</div>
<div class="group bg-white/5 p-10 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center">
<span class="material-symbols-outlined text-primary-light text-5xl mb-8 block">settings_suggest</span>
<p class="heading-bold text-sm tracking-wide">خطوط الإنتاج</p>
</div>
<div class="group bg-white/5 p-10 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center">
<span class="material-symbols-outlined text-primary-light text-5xl mb-8 block">analytics</span>
<p class="heading-bold text-sm tracking-wide">تحليلات الأداء</p>
</div>
<div class="group bg-white/5 p-10 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center">
<span class="material-symbols-outlined text-primary-light text-5xl mb-8 block">account_tree</span>
<p class="heading-bold text-sm tracking-wide">إدارة المشاريع</p>
</div>
<div class="group bg-white/5 p-10 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center">
<span class="material-symbols-outlined text-primary-light text-5xl mb-8 block">verified</span>
<p class="heading-bold text-sm tracking-wide">إدارة الجودة</p>
</div>
<div class="group bg-white/5 p-10 rounded-[2rem] border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center">
<span class="material-symbols-outlined text-primary-light text-5xl mb-8 block">devices</span>
<p class="heading-bold text-sm tracking-wide">تطبيقات النقال</p>
</div>
</div>
<div class="mt-24 text-center">
<p class="text-emerald-100/40 mb-10 text-lg">+92 وحدة إضافية بانتظارك لتخصيص تجربتك</p>
<button class="px-14 py-5 bg-primary-light text-primary heading-bold rounded-2xl hover:bg-white transition-colors shadow-2xl">تواصل مع المستشار التقني</button>
</div>
</div>
</section>
<!-- Connectivity / Downloads -->
<section class="py-36 bg-white">
<div class="max-w-[100rem] mx-auto px-8">
<div class="bg-[#020617] rounded-[4.5rem] p-20 lg:p-32 relative overflow-hidden flex flex-col lg:flex-row items-center gap-24">
<div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)] pointer-events-none"></div>
<div class="lg:w-1/2 text-right relative z-10">
<h2 class="text-5xl lg:text-6xl heading-extrabold text-white mb-10 leading-tight">نماء تحت تصرفك.. <br/><span class="text-primary-light">من أي مكان</span></h2>
<p class="text-slate-400 text-xl mb-16 leading-relaxed font-medium">احصل على القوة الكاملة لنسخة Namaa Desktop للمكاتب، أو تابع أعمالك عبر تطبيقات الجوال المزامنة لحظياً.</p>
<div class="flex flex-wrap gap-6 justify-end">
<button class="bg-white text-slate-900 px-6 py-6 rounded-2xl flex items-center gap-5 hover:bg-slate-100 transition-all group shadow-xl">
<span class="material-symbols-outlined text-4xl">terminal</span>
<div class="text-right">
<p class="text-[11px] uppercase heading-extrabold opacity-50 tracking-widest">تحميل نسخة</p>
<p class="heading-extrabold text-xl">Desktop Edition</p>
</div>
</button>
<button class="bg-white/5 text-white border border-white/10 px-6 py-6 rounded-2xl flex items-center gap-5 hover:bg-white/10 transition-all group">
<span class="material-symbols-outlined text-4xl">brand_family</span>
<div class="text-right">
<p class="text-[11px] uppercase heading-extrabold opacity-50 tracking-widest">متوفر في</p>
<p class="heading-extrabold text-xl">App Store</p>
</div>
</button>
<button class="bg-white/5 text-white border border-white/10 px-6 py-6 rounded-2xl flex items-center gap-5 hover:bg-white/10 transition-all group">
<span class="material-symbols-outlined text-4xl">ad_units</span>
<div class="text-right">
<p class="text-[11px] uppercase heading-extrabold opacity-50 tracking-widest">متوفر في</p>
<p class="heading-extrabold text-xl">Google Play</p>
</div>
</button>
</div>
</div>
<div class="lg:w-1/2 relative z-10">
<div class="relative">
<div class="absolute -inset-16 bg-primary-light/10 blur-[120px] rounded-full animate-pulse-soft"></div>
<!-- High tech abstract device visual -->
<img alt="Advanced Connectivity" class="relative z-10 transform rotate-1 hover:rotate-0 transition-transform duration-1000 w-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_Qg-T91d5bCNCm8wmsGSm7Gv_G-ZFOWwmct_3pGz11og-inUoHTG_GjWKsqcLgYsxnzq4AM1ieP6OWJKexCqttlmw5kH7mTgOvWDxyG4nk0otbO1wMB_AIRx5Wd9IwBTZEEcfJdNL87cy1XWUnzikGLjLPBTm3U2Kb374Deydrts8b7qHthQozGnv0rksuJl8dQsxGWDzMp7EYmUz5EhCVsCCVG3InMHoBWbISgPQKrSunDODpt-bheaOSRupsAi1qqMANI0Ym-s"/>
</div>
</div>
</div>
</div>
</section>
<!-- Final CTA -->
<section class="py-40 text-center relative overflow-hidden bg-[#fafafa]">
<div class="max-w-4xl mx-auto px-8 relative z-10">
<h2 class="text-6xl heading-extrabold text-on-surface mb-12 leading-tight">جاهز لقفزة نوعية في إدارة <span class="text-primary-mid">استثماراتك؟</span></h2>
<p class="text-2xl text-on-surface-variant mb-20 max-w-3xl mx-auto leading-relaxed font-medium">انضم لأكثر من 5,000 منشأة تعتمد على نماء يومياً لإدارة عملياتها المعقدة بكل سهولة واحترافية.</p>
<div class="flex flex-col sm:flex-row justify-center gap-8">
<button class="metallic-gradient text-white px-20 py-7 rounded-2xl heading-bold text-2xl shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all">ابدأ الفترة التجريبية</button>
<button class="bg-white border-2 border-slate-200 text-on-surface px-20 py-7 rounded-2xl heading-bold text-2xl hover:border-primary-mid transition-all shadow-sm">تحدث مع المبيعات</button>
</div>
<div class="mt-16 flex flex-wrap items-center justify-center gap-10 text-slate-500 font-bold">
<div class="flex items-center gap-3"><span class="material-symbols-outlined text-primary-light text-3xl">verified_user</span> إعداد في دقائق</div>
<div class="flex items-center gap-3"><span class="material-symbols-outlined text-primary-light text-3xl">credit_card_off</span> لا حاجة لبطاقة ائتمان</div>
<div class="flex items-center gap-3"><span class="material-symbols-outlined text-primary-light text-3xl">headset_mic</span> دعم فني محلي 24/7</div>
</div>
</div>
</section>
<!-- Footer -->
<footer class="bg-white border-t border-slate-100 pt-24 pb-12">
<div class="max-w-[100rem] mx-auto px-8">
<div class="flex flex-col lg:flex-row justify-between items-start gap-24 mb-24">
<div class="max-w-sm">
<a class="text-4xl heading-extrabold text-primary mb-10 block tracking-tighter" href="#">نما إنفست</a>
<p class="text-on-surface-variant leading-relaxed text-lg font-medium opacity-80">نظام ERP متكامل يهدف لتمكين المؤسسات من تحقيق نمو مستدام عبر تكنولوجيا ذكية وسهلة الاستخدام.</p>
</div>
<div class="grid grid-cols-2 md:grid-cols-3 gap-20">
<div>
<h5 class="heading-extrabold text-on-surface mb-8 uppercase tracking-widest text-sm">المنتجات</h5>
<ul class="space-y-5 text-base font-bold text-on-surface-variant">
<li><a class="hover:text-primary transition-colors" href="#">الحلول المالية</a></li>
<li><a class="hover:text-primary transition-colors" href="#">نقاط البيع</a></li>
<li><a class="hover:text-primary transition-colors" href="#">المخازن واللوجستيات</a></li>
</ul>
</div>
<div>
<h5 class="heading-extrabold text-on-surface mb-8 uppercase tracking-widest text-sm">الشركة</h5>
<ul class="space-y-5 text-base font-bold text-on-surface-variant">
<li><a class="hover:text-primary transition-colors" href="#">عن نماء</a></li>
<li><a class="hover:text-primary transition-colors" href="#">العملاء</a></li>
<li><a class="hover:text-primary transition-colors" href="#">تواصل معنا</a></li>
</ul>
</div>
<div>
<h5 class="heading-extrabold text-on-surface mb-8 uppercase tracking-widest text-sm">الدعم</h5>
<ul class="space-y-5 text-base font-bold text-on-surface-variant">
<li><a class="hover:text-primary transition-colors" href="#">مركز المساعدة</a></li>
<li><a class="hover:text-primary transition-colors" href="#">التوثيق التقني</a></li>
<li><a class="hover:text-primary transition-colors" href="#">الأسئلة الشائعة</a></li>
</ul>
</div>
</div>
</div>
<div class="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
<p class="text-base text-slate-400 font-bold">© 2024 نما إنفست. جميع الحقوق محفوظة.</p>
<div class="flex gap-10 text-base font-bold text-slate-400">
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
