
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
              "primary": "#059669", // Vibrant Emerald 600
              "primary-dark": "#064e3b",
              "primary-light": "#34d399", // Emerald 400
              "surface": "#ffffff",
              "surface-variant": "#f0fdf4", // Very light emerald tint
              "on-surface": "#064e3b", // Deepest emerald for text
              "on-surface-variant": "#475569", 
              "accent": "#fbbf24", // Vibrant Amber
            },
            fontFamily: {
              sans: ["Noto Sans Arabic", "Plus Jakarta Sans", "sans-serif"],
            },
            borderRadius: {
              "premium": "1.5rem",
              "super": "3rem",
            },
            animation: {
              'pulse-vibrant': 'pulseVibrant 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              'float-snappy': 'floatSnappy 4s ease-in-out infinite',
              'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
              'reveal-snappy': 'revealSnappy 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            },
            keyframes: {
              pulseVibrant: {
                '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                '50%': { opacity: '0.8', transform: 'scale(1.05)' },
              },
              floatSnappy: {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-15px)' },
              },
              bounceSubtle: {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-5px)' },
              },
              revealSnappy: {
                '0%': { opacity: '0', transform: 'translateY(20px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
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
        body { font-family: 'Noto Sans Arabic', 'Plus Jakarta Sans', sans-serif; scroll-behavior: smooth; }
        .glass-header {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            background: rgba(255, 255, 255, 0.8);
        }
        .vibrant-gradient {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
        }
        .hero-mesh {
            background-color: #ffffff;
            background-image: 
                radial-gradient(at 0% 0%, hsla(161,71%,90%,1) 0, transparent 50%), 
                radial-gradient(at 50% 0%, hsla(161,71%,95%,1) 0, transparent 50%), 
                radial-gradient(at 100% 0%, hsla(161,71%,90%,1) 0, transparent 50%);
        }
        .reveal-hidden { opacity: 0; }
        .reveal-visible { animation: revealSnappy 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .card-vibrant { 
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid rgba(16, 185, 129, 0.05);
        }
        .card-vibrant:hover { 
            transform: translateY(-10px) scale(1.02);
            box-shadow: 0 25px 50px -12px rgba(5, 150, 105, 0.15);
            border-color: rgba(16, 185, 129, 0.2);
        }
    ` }} />
      <div dir="rtl" className="bg-surface text-on-surface">
        <div dangerouslySetInnerHTML={{ __html: `
<!-- Header -->
<header class="fixed top-0 w-full z-[100] glass-header border-b border-emerald-50">
<div class="max-w-[100rem] mx-auto px-6 h-20 flex justify-between items-center">
<div class="flex items-center gap-10">
<a class="text-2xl font-extrabold text-primary flex items-center gap-2" href="#">
<span class="w-8 h-8 vibrant-gradient rounded-lg flex items-center justify-center text-white text-lg">N</span>
                <span class="material-symbols-outlined text-3xl">layers</span><div class="flex flex-col"><span>نما إنفست</span><span class="text-current text-xs font-bold opacity-80">Nama Invest ERP</span></div>
</a>
<nav class="hidden lg:flex items-center gap-7">
<a class="text-sm font-bold text-primary relative after:content-[''] after:absolute after:-bottom-1 after:right-0 after:w-full after:h-0.5 after:bg-primary" href="#">القطاعات</a>
<a class="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors" href="#">المجموعات</a>
<a class="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors" href="#">الـ 104 وحدة</a>
<a class="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors" href="#">التسعير</a>
</nav>
</div>
<div class="flex items-center gap-3">
<button class="text-sm font-bold text-primary px-5 py-2.5 rounded-xl hover:bg-primary/5 transition-all">تسجيل الدخول</button>
<button class="text-sm font-bold vibrant-gradient text-white px-7 py-3 rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.05] active:scale-95 transition-all">🚀 سجّل مجاناً</button>
</div>
</div>
</header>
<!-- Hero Section -->
<section class="relative pt-40 pb-24 overflow-hidden hero-mesh">
<div class="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse-vibrant"></div>
<div class="absolute bottom-10 left-[-5%] w-[400px] h-[400px] bg-primary-light/10 rounded-full blur-[80px]"></div>
<div class="max-w-[100rem] mx-auto px-6 relative z-10">
<div class="flex flex-col lg:flex-row items-center gap-16">
<div class="lg:w-1/2 text-right">
<div class="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-primary text-[13px] font-extrabold mb-8 shadow-sm">
<span class="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
                    نظام ERP الجيل القادم للمؤسسات السعودية
                </div>
<h1 class="text-5xl lg:text-7xl font-extrabold text-on-surface mb-8 leading-[1.2]">
                    منصة رقمية واحدة.. <br/>
<span class="text-transparent bg-clip-text vibrant-gradient">لقيادة مستقبلك</span>
</h1>
<p class="text-lg text-on-surface-variant mb-12 max-w-xl ml-auto leading-relaxed">
                    نماء للاستثمار يقدم منظومة ERP سحابية متكاملة بـ 104 وحدة متخصصة، مصممة بدقة لتلبية تطلعات الصيدليات، المصانع، والمؤسسات الخدمية الكبرى.
                </p>
<div class="flex flex-wrap gap-4 justify-end">
<button class="vibrant-gradient text-white px-9 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1.5 transition-all flex items-center gap-3">
<span>ابدأ الفترة التجريبية</span>
<span class="material-symbols-outlined text-xl">arrow_back</span>
</button>
<button class="bg-white border-2 border-emerald-100 text-primary px-9 py-5 rounded-2xl font-bold text-lg hover:bg-emerald-50 hover:border-primary-light transition-all flex items-center gap-3 group">
<span>حجز عرض تجريبي</span>
<span class="material-symbols-outlined group-hover:animate-bounce-subtle">download</span>
</button>
</div>
</div>
<div class="lg:w-1/2 relative">
<div class="relative z-20 group">
<div class="absolute -inset-6 vibrant-gradient rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
<div class="relative bg-white p-2.5 rounded-[2.5rem] shadow-2xl border border-emerald-50 overflow-hidden transform group-hover:rotate-1 transition-transform duration-500">
<img alt="Namaa ERP Interface" class="rounded-[2rem] w-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ9gwn_vHX32TapQZ9iKClb34-F6-7fSiWm3-x9iUMSRUbTqMcBMSIlzUr97XY02VgerYYBR7tsOvYmIX4-2jMbNRUQtuO8UoQzWi7V91MnMPKcmbHKhNBOkXgvsgHg6TroiZbuuEUxzuUCrVxsxUkkx7nrRfChthL7Y7sskP-toD4iZRcKjX0ye9eXLUS_vhB8gMHZQ9o-_I5jfYQ3oBCXQwe4G8FTnxPsxa39TvTQGpWZEeh5zhqbDj1ZK21dyFanDsXmde2dqs"/>
</div>
<!-- Stats Floating Card -->
<div class="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-xl z-30 border border-emerald-50 animate-float-snappy flex items-center gap-4">
<div class="w-12 h-12 vibrant-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
<span class="material-symbols-outlined text-2xl">rocket_launch</span>
</div>
<div>
<p class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">كفاءة التشغيل</p>
<p class="text-2xl font-extrabold text-on-surface">+38.2%</p>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
<!-- Industries: Asymmetric Grid -->
<section class="py-24 bg-white relative">
<div class="max-w-[100rem] mx-auto px-6">
<div class="text-center mb-16 reveal-hidden">
<h2 class="text-4xl font-extrabold text-on-surface mb-4">حلول متخصصة لكل قطاع</h2>
<p class="text-on-surface-variant max-w-xl mx-auto text-lg leading-relaxed">بنينا نظام نماء ليكون مرناً بما يكفي ليناسب أدق تفاصيل العمل في مختلف الصناعات</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[450px]">
<!-- Big Item -->
<div class="md:col-span-5 group bg-emerald-50/50 p-10 rounded-[2.5rem] border border-emerald-100 card-vibrant flex flex-col justify-between overflow-hidden relative">
<div class="relative z-10">
<div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:vibrant-gradient group-hover:text-white transition-all">
<span class="material-symbols-outlined text-4xl">factory</span>
</div>
<h3 class="font-extrabold text-2xl text-on-surface mb-3">التصنيع والإنتاج</h3>
<p class="text-on-surface-variant text-sm max-w-[200px]">تحكم متكامل في خطوط الإنتاج والمواد الأولية.</p>
</div>
<div class="absolute -bottom-10 -left-10 w-40 h-40 vibrant-gradient opacity-5 rounded-full"></div>
</div>
<div class="md:col-span-7 grid grid-cols-2 gap-6">
<!-- Sub Item 1 -->
<div class="group bg-slate-50 p-8 rounded-[2rem] border border-slate-100 card-vibrant text-center flex flex-col items-center justify-center">
<div class="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-all">
<span class="material-symbols-outlined text-3xl">engineering</span>
</div>
<h3 class="font-bold text-lg text-on-surface">الصيانة والخدمات</h3>
</div>
<!-- Sub Item 2 -->
<div class="group bg-slate-50 p-8 rounded-[2rem] border border-slate-100 card-vibrant text-center flex flex-col items-center justify-center">
<div class="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-all">
<span class="material-symbols-outlined text-3xl">local_dining</span>
</div>
<h3 class="font-bold text-lg text-on-surface">المطاعم</h3>
</div>
<!-- Sub Item 3 -->
<div class="group bg-slate-50 p-8 rounded-[2rem] border border-slate-100 card-vibrant text-center flex flex-col items-center justify-center">
<div class="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-purple-500 group-hover:text-white transition-all">
<span class="material-symbols-outlined text-3xl">storefront</span>
</div>
<h3 class="font-bold text-lg text-on-surface">التجزئة</h3>
</div>
<!-- Sub Item 4 -->
<div class="group bg-slate-50 p-8 rounded-[2rem] border border-slate-100 card-vibrant text-center flex flex-col items-center justify-center">
<div class="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-rose-500 group-hover:text-white transition-all">
<span class="material-symbols-outlined text-3xl">health_and_safety</span>
</div>
<h3 class="font-bold text-lg text-on-surface">الصيدليات</h3>
</div>
</div>
</div>
</div>
</section>
<!-- Strategic Clusters -->
<section class="py-28 bg-surface-variant relative overflow-hidden">
<div class="max-w-[100rem] mx-auto px-6">
<div class="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
<div class="text-right">
<span class="text-primary font-extrabold text-xs tracking-widest uppercase mb-4 block">المنظومة المتكاملة</span>
<h2 class="text-4xl lg:text-5xl font-black text-on-surface leading-tight">5 مجموعات استراتيجية <br/>تغطي كافة احتياجاتك</h2>
</div>
<p class="text-on-surface-variant text-lg max-w-md text-right leading-relaxed border-r-4 border-primary-light pr-6">
                أكثر من 104 وحدة برمجية تعمل في تناغم تام لتشكل العمود الفقري لعمليات منشأتك المالية والتشغيلية.
            </p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
<!-- Cluster 1 -->
<div class="group bg-white p-10 rounded-[2.5rem] border border-emerald-50 card-vibrant relative overflow-hidden">
<div class="relative z-10">
<div class="w-14 h-14 vibrant-gradient text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-200">
<span class="material-symbols-outlined text-2xl">payments</span>
</div>
<div class="flex justify-between items-center mb-4">
<h4 class="text-xl font-extrabold text-on-surface">الـ 104 وحدة</h4>
<span class="text-3xl font-black text-emerald-50/80 group-hover:text-emerald-500/10 transition-colors">13</span>
</div>
<p class="text-on-surface-variant text-sm mb-8 leading-relaxed">إدارة دقيقة للحسابات العامة، التدفقات النقدية، والميزانيات العمومية وفق المعايير العالمية.</p>
<a class="inline-flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-4 transition-all" href="#">
<span>اكتشف 13 وحدة مالية</span>
<span class="material-symbols-outlined text-sm">arrow_back</span>
</a>
</div>
</div>
<!-- Cluster 2 -->
<div class="group bg-white p-10 rounded-[2.5rem] border border-emerald-50 card-vibrant relative overflow-hidden">
<div class="relative z-10">
<div class="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-100">
<span class="material-symbols-outlined text-2xl">inventory_2</span>
</div>
<div class="flex justify-between items-center mb-4">
<h4 class="text-xl font-extrabold text-on-surface">إدارة المستودعات</h4>
<span class="text-3xl font-black text-blue-50/80">14</span>
</div>
<p class="text-on-surface-variant text-sm mb-8 leading-relaxed">تحكم ذكي في المخزون، الجرد الآلي، وسلاسل التوريد لضمان استمرارية الأعمال.</p>
<a class="inline-flex items-center gap-2 text-blue-600 font-bold text-sm group-hover:gap-4 transition-all" href="#">
<span>اكتشف 14 وحدة مخزون</span>
<span class="material-symbols-outlined text-sm">arrow_back</span>
</a>
</div>
</div>
<!-- Cluster 3 -->
<div class="group bg-white p-10 rounded-[2.5rem] border border-emerald-50 card-vibrant relative overflow-hidden">
<div class="relative z-10">
<div class="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-amber-100">
<span class="material-symbols-outlined text-2xl">shopping_cart</span>
</div>
<div class="flex justify-between items-center mb-4">
<h4 class="text-xl font-extrabold text-on-surface">المبيعات والعملاء</h4>
<span class="text-3xl font-black text-amber-50/80">19</span>
</div>
<p class="text-on-surface-variant text-sm mb-8 leading-relaxed">أنظمة نقاط البيع، برامج الولاء، وإدارة علاقات العملاء لزيادة العوائد.</p>
<a class="inline-flex items-center gap-2 text-amber-600 font-bold text-sm group-hover:gap-4 transition-all" href="#">
<span>اكتشف 19 وحدة مبيعات</span>
<span class="material-symbols-outlined text-sm">arrow_back</span>
</a>
</div>
</div>
<!-- Cluster 4 -->
<div class="group bg-white p-10 rounded-[2.5rem] border border-emerald-50 card-vibrant relative overflow-hidden">
<div class="relative z-10">
<div class="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-purple-100">
<span class="material-symbols-outlined text-2xl">groups</span>
</div>
<div class="flex justify-between items-center mb-4">
<h4 class="text-xl font-extrabold text-on-surface">الموارد البشرية</h4>
<span class="text-3xl font-black text-purple-50/80">25</span>
</div>
<p class="text-on-surface-variant text-sm mb-8 leading-relaxed">إدارة شاملة لشؤون الموظفين، الرواتب، التقييم، والأصول الثابتة للمنشأة.</p>
<a class="inline-flex items-center gap-2 text-purple-600 font-bold text-sm group-hover:gap-4 transition-all" href="#">
<span>اكتشف 25 وحدة HR</span>
<span class="material-symbols-outlined text-sm">arrow_back</span>
</a>
</div>
</div>
<!-- Cluster 5 -->
<div class="group bg-white p-10 rounded-[2.5rem] border border-emerald-50 card-vibrant relative overflow-hidden">
<div class="relative z-10">
<div class="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-rose-100">
<span class="material-symbols-outlined text-2xl">analytics</span>
</div>
<div class="flex justify-between items-center mb-4">
<h4 class="text-xl font-extrabold text-on-surface">الذكاء والبيانات</h4>
<span class="text-3xl font-black text-rose-50/80">06</span>
</div>
<p class="text-on-surface-variant text-sm mb-8 leading-relaxed">تحليلات متقدمة، تقارير ذكية، وتنبؤات مبنية على البيانات لاتخاذ قرارات حكيمة.</p>
<a class="inline-flex items-center gap-2 text-rose-600 font-bold text-sm group-hover:gap-4 transition-all" href="#">
<span>اكتشف وحدات الذكاء</span>
<span class="material-symbols-outlined text-sm">arrow_back</span>
</a>
</div>
</div>
<!-- CTA Highlight Card -->
<div class="vibrant-gradient p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center items-center text-center group">
<div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
<div class="relative z-10">
<h4 class="text-5xl font-black text-white mb-2">104</h4>
<p class="text-emerald-100 font-bold mb-8 uppercase tracking-widest text-xs">وحدة متكاملة تماماً</p>
<button class="bg-white text-primary px-8 py-4 rounded-2xl font-extrabold hover:scale-105 active:scale-95 transition-all shadow-xl">عرض القائمة الكاملة</button>
</div>
</div>
</div>
</div>
</section>
<!-- Modules Micro-Grid -->
<section class="py-24 bg-primary-dark text-white overflow-hidden">
<div class="max-w-[100rem] mx-auto px-6 relative">
<div class="flex flex-col lg:flex-row justify-between items-center mb-20 gap-10">
<div class="text-right">
<h2 class="text-4xl font-extrabold mb-3">استكشاف الوحدات التفصيلية</h2>
<p class="text-primary-light text-lg opacity-80">تكامل مطلق يضمن كفاءة عالية لكافة مفاصل العمل</p>
</div>
<div class="relative w-full max-w-md">
<input class="w-full bg-white/10 border border-white/10 rounded-2xl py-5 px-12 text-right focus:ring-2 focus:ring-primary-light focus:bg-white/20 transition-all placeholder:text-white/30 text-sm" placeholder="ابحث عن وحدة محددة (مثل: الأصول)" type="text"/>
<span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/40">search</span>
</div>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
<!-- Simplified for speed/snap feel -->
<div class="group bg-white/5 p-7 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center cursor-pointer">
<span class="material-symbols-outlined text-primary-light text-3xl mb-4 block">auto_stories</span>
<p class="font-bold text-[13px]">الأستاذ العام</p>
</div>
<div class="group bg-white/5 p-7 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center cursor-pointer">
<span class="material-symbols-outlined text-primary-light text-3xl mb-4 block">account_balance_wallet</span>
<p class="font-bold text-[13px]">حسابات الموردين</p>
</div>
<div class="group bg-white/5 p-7 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center cursor-pointer">
<span class="material-symbols-outlined text-primary-light text-3xl mb-4 block">badge</span>
<p class="font-bold text-[13px]">شؤون الموظفين</p>
</div>
<div class="group bg-white/5 p-7 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center cursor-pointer">
<span class="material-symbols-outlined text-primary-light text-3xl mb-4 block">local_mall</span>
<p class="font-bold text-[13px]">المشتريات</p>
</div>
<div class="group bg-white/5 p-7 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center cursor-pointer">
<span class="material-symbols-outlined text-primary-light text-3xl mb-4 block">support_agent</span>
<p class="font-bold text-[13px]">إدارة CRM</p>
</div>
<div class="group bg-white/5 p-7 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center cursor-pointer">
<span class="material-symbols-outlined text-primary-light text-3xl mb-4 block">inventory</span>
<p class="font-bold text-[13px]">المخازن الذكية</p>
</div>
<div class="group bg-white/5 p-7 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center cursor-pointer">
<span class="material-symbols-outlined text-primary-light text-3xl mb-4 block">receipt</span>
<p class="font-bold text-[13px]">الفاتورة الضريبية</p>
</div>
<div class="group bg-white/5 p-7 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center cursor-pointer">
<span class="material-symbols-outlined text-primary-light text-3xl mb-4 block">precision_manufacturing</span>
<p class="font-bold text-[13px]">خطوط الإنتاج</p>
</div>
<div class="group bg-white/5 p-7 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center cursor-pointer">
<span class="material-symbols-outlined text-primary-light text-3xl mb-4 block">bar_chart</span>
<p class="font-bold text-[13px]">تحليلات الأداء</p>
</div>
<div class="group bg-white/5 p-7 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center cursor-pointer">
<span class="material-symbols-outlined text-primary-light text-3xl mb-4 block">schema</span>
<p class="font-bold text-[13px]">إدارة المشاريع</p>
</div>
<div class="group bg-white/5 p-7 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center cursor-pointer">
<span class="material-symbols-outlined text-primary-light text-3xl mb-4 block">military_tech</span>
<p class="font-bold text-[13px]">إدارة الجودة</p>
</div>
<div class="group bg-white/5 p-7 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-primary-light transition-all text-center cursor-pointer">
<span class="material-symbols-outlined text-primary-light text-3xl mb-4 block">smartphone</span>
<p class="font-bold text-[13px]">تطبيقات النقال</p>
</div>
</div>
<div class="mt-16 text-center">
<p class="text-emerald-100/40 mb-8 text-sm">+92 وحدة إضافية بانتظارك لتخصيص تجربتك</p>
<button class="px-6 py-4 bg-primary-light text-primary-dark font-extrabold rounded-xl hover:bg-white transition-all shadow-xl shadow-primary-light/10">تواصل مع المستشار التقني</button>
</div>
</div>
</section>
<!-- Connectivity -->
<section class="py-28 bg-white overflow-hidden">
<div class="max-w-[100rem] mx-auto px-6">
<div class="vibrant-gradient rounded-[3.5rem] p-12 lg:p-20 relative overflow-hidden flex flex-col lg:flex-row items-center gap-16">
<div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10 pointer-events-none"></div>
<div class="lg:w-1/2 text-right relative z-10">
<h2 class="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">نماء تحت تصرفك.. <br/><span class="text-emerald-100">في أي وقت ومن أي مكان</span></h2>
<p class="text-white/80 text-lg mb-12 leading-relaxed">احصل على القوة الكاملة لنسخة Namaa Desktop للمكاتب، أو تابع أعمالك عبر تطبيقات الجوال المزامنة لحظياً.</p>
<div class="flex flex-wrap gap-4 justify-end">
<button class="bg-white/10 backdrop-blur-md text-white border border-white/20 px-7 py-4 rounded-2xl flex items-center gap-4 hover:bg-white hover:text-primary transition-all">
<span class="material-symbols-outlined text-2xl">laptop_mac</span>
<div class="text-right">
<p class="text-[10px] uppercase font-bold opacity-60">تحميل نسخة</p>
<p class="font-extrabold text-base">Desktop Edition</p>
</div>
</button>
<button class="bg-white/10 backdrop-blur-md text-white border border-white/20 px-7 py-4 rounded-2xl flex items-center gap-4 hover:bg-white hover:text-primary transition-all">
<span class="material-symbols-outlined text-2xl">apple</span>
<div class="text-right">
<p class="text-[10px] uppercase font-bold opacity-60">متوفر في</p>
<p class="font-extrabold text-base">App Store</p>
</div>
</button>
<button class="bg-white/10 backdrop-blur-md text-white border border-white/20 px-7 py-4 rounded-2xl flex items-center gap-4 hover:bg-white hover:text-primary transition-all">
<span class="material-symbols-outlined text-2xl">play_store</span>
<div class="text-right">
<p class="text-[10px] uppercase font-bold opacity-60">متوفر في</p>
<p class="font-extrabold text-base">Google Play</p>
</div>
</button>
</div>
</div>
<div class="lg:w-1/2 relative z-10">
<div class="relative">
<div class="absolute -inset-10 bg-white/20 blur-[100px] rounded-full animate-pulse-vibrant"></div>
<img alt="Multi-device support" class="relative z-10 transform -rotate-1 hover:rotate-0 transition-transform duration-500 drop-shadow-2xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ5dnBMXhYQi3DTX9301cjprwTVpGAmyPklhZeCcWnhLujQjtb7cEzHbuNEl8twO-KyYFog-bMHFnZTOHOZ5rrIHYMBohgfuj9wNYf3pk_AKnvBsIhUzmSqiwIGCIsWGSBDu50shnXpQwkse2iITY9fI2bR9C9rD8xJIuikwYEzTQBzw05O-jbuFXA_Vs_FfgLKgbnE4ubgq4nTOVQyS2-ZJBU_y3EbD-nCk8KbRudlSWHW5LC6Usjofn9x-ihF_mdpYg1Vs7c8Cw"/>
</div>
</div>
</div>
</div>
</section>
<!-- Final CTA -->
<section class="py-28 text-center relative overflow-hidden bg-white">
<div class="max-w-4xl mx-auto px-6 relative z-10">
<h2 class="text-5xl font-black text-on-surface mb-8 leading-tight">جاهز لقفزة نوعية في إدارة <span class="text-primary">استثماراتك؟</span></h2>
<p class="text-lg text-on-surface-variant mb-14 max-w-2xl mx-auto leading-relaxed">انضم لأكثر من 5,000 منشأة تعتمد على نماء يومياً لإدارة عملياتها المعقدة بكل سهولة واحترافية.</p>
<div class="flex flex-col sm:flex-row justify-center gap-5">
<button class="vibrant-gradient text-white px-14 py-6 rounded-2xl font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">ابدأ الفترة التجريبية</button>
<button class="bg-white border-2 border-emerald-100 text-primary px-14 py-6 rounded-2xl font-black text-xl hover:bg-emerald-50 transition-all">تحدث مع المبيعات</button>
</div>
<div class="mt-12 flex flex-wrap items-center justify-center gap-6 text-on-surface-variant font-bold text-sm">
<div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-xl">check_circle</span> إعداد في دقائق</div>
<div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-xl">check_circle</span> لا حاجة لبطاقة ائتمان</div>
<div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-xl">check_circle</span> دعم فني محلي 24/7</div>
</div>
</div>
</section>
<!-- Footer -->
<footer class="bg-slate-50 border-t border-slate-100 pt-20 pb-10">
<div class="max-w-[100rem] mx-auto px-6">
<div class="flex flex-col lg:flex-row justify-between items-start gap-16 mb-20">
<div class="max-w-xs">
<a class="text-3xl font-black text-primary mb-6 block" href="#">نما إنفست</a>
<p class="text-on-surface-variant leading-relaxed text-sm">نظام ERP متكامل يهدف لتمكين المؤسسات من تحقيق نمو مستدام عبر تكنولوجيا ذكية وسهلة الاستخدام.</p>
</div>
<div class="grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-24">
<div>
<h5 class="font-bold text-on-surface mb-6">المنتجات</h5>
<ul class="space-y-4 text-sm text-on-surface-variant">
<li><a class="hover:text-primary transition-colors" href="#">الحلول المالية</a></li>
<li><a class="hover:text-primary transition-colors" href="#">نقاط البيع</a></li>
<li><a class="hover:text-primary transition-colors" href="#">المخازن واللوجستيات</a></li>
</ul>
</div>
<div>
<h5 class="font-bold text-on-surface mb-6">الشركة</h5>
<ul class="space-y-4 text-sm text-on-surface-variant">
<li><a class="hover:text-primary transition-colors" href="#">عن نماء</a></li>
<li><a class="hover:text-primary transition-colors" href="#">العملاء</a></li>
<li><a class="hover:text-primary transition-colors" href="#">تواصل معنا</a></li>
</ul>
</div>
<div>
<h5 class="font-bold text-on-surface mb-6">الدعم</h5>
<ul class="space-y-4 text-sm text-on-surface-variant">
<li><a class="hover:text-primary transition-colors" href="#">مركز المساعدة</a></li>
<li><a class="hover:text-primary transition-colors" href="#">التوثيق التقني</a></li>
<li><a class="hover:text-primary transition-colors" href="#">الأسئلة الشائعة</a></li>
</ul>
</div>
</div>
</div>
<div class="pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
<p class="text-xs text-slate-400 font-bold">© 2024 نما إنفست. جميع الحقوق محفوظة.</p>
<div class="flex gap-8 text-xs text-slate-400 font-bold">
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
