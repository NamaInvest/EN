"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, CheckCircle, Shield, Zap, Globe, Cpu, ChevronDown, Monitor, Moon, Sun, Layout } from "lucide-react";

export default function SaaSLandingPage() {
  const [activeTheme, setActiveTheme] = useState("glassmorphism");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    { id: "glassmorphism", name: "الزجاجي الحديث (Glassmorphism)", icon: <Layout className="w-4 h-4 ml-2" /> },
    { id: "neon", name: "المستقبل المظلم (Cyber Neon)", icon: <Moon className="w-4 h-4 ml-2" /> },
    { id: "executive", name: "الرسمي الفاخر (Executive Premium)", icon: <Monitor className="w-4 h-4 ml-2" /> },
    { id: "light", name: "الأعمال المشرق (Light Enterprise)", icon: <Sun className="w-4 h-4 ml-2" /> },
  ];

  if (!mounted) return null;

  const getThemeStyles = () => {
    switch (activeTheme) {
      case "neon":
        return {
          bg: "bg-slate-950",
          text: "text-white",
          accent: "text-fuchsia-400",
          badge: "bg-fuchsia-900/30 text-fuchsia-400 border border-fuchsia-500/30",
          buttonPrefix: "bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 shadow-[0_0_20px_rgba(217,70,239,0.4)]",
          card: "bg-slate-900/50 backdrop-blur-md border border-fuchsia-500/20 shadow-[0_8px_32px_rgba(217,70,239,0.1)]",
          googleBtn: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700",
          pattern: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-slate-950 to-slate-950",
        };
      case "executive":
        return {
          bg: "bg-[#0b132b]",
          text: "text-slate-100",
          accent: "text-emerald-400",
          badge: "bg-emerald-900/30 text-emerald-400 border border-emerald-500/30",
          buttonPrefix: "bg-emerald-600 hover:bg-emerald-500 shadow-xl",
          card: "bg-[#1c2541] border border-slate-700 shadow-2xl",
          googleBtn: "bg-white text-slate-900 hover:bg-gray-100",
          pattern: "bg-gradient-to-b from-[#0b132b] to-[#1c2541]",
        };
      case "light":
        return {
          bg: "bg-gray-50",
          text: "text-slate-900",
          accent: "text-blue-600",
          badge: "bg-blue-100 text-blue-700 border border-blue-200",
          buttonPrefix: "bg-blue-600 hover:bg-blue-700 shadow-md",
          card: "bg-white border border-gray-200 shadow-lg",
          googleBtn: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
          pattern: "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]",
        };
      case "glassmorphism":
      default:
        return {
          bg: "bg-slate-900",
          text: "text-white",
          accent: "text-cyan-400",
          badge: "bg-white/10 text-cyan-300 border border-white/20 backdrop-blur-md",
          buttonPrefix: "bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          card: "bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          googleBtn: "bg-white hover:bg-gray-100 text-slate-900",
          pattern: "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-black",
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div className={`min-h-screen font-sans ${theme.bg} ${theme.text} ${theme.pattern} transition-all duration-700`} dir="rtl">
      
      {/* Navigation & Theme Switcher */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${activeTheme === 'light' ? 'border-gray-200 bg-white/80' : 'border-white/10 bg-black/20 backdrop-blur-md'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTheme === 'light' ? 'bg-blue-600' : 'bg-gradient-to-br from-cyan-400 to-blue-600'}`}>
              <Shield className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">نما إنفست</span>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Theme Dropdown Toggle */}
            <div className="relative group">
              <button className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTheme === 'light' ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-gray-300'}`}>
                تغيير الواجهة
                <ChevronDown className="w-4 h-4 mr-2" />
              </button>
              <div className={`absolute top-full left-0 mt-2 w-56 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top ${activeTheme === 'light' ? 'bg-white border border-gray-200 shadow-xl' : 'bg-slate-800 border border-slate-700 shadow-2xl'}`}>
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTheme(t.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm text-right transition-colors ${
                      activeTheme === t.id 
                        ? (activeTheme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-white/10 text-white') 
                        : (activeTheme === 'light' ? 'hover:bg-gray-50 text-gray-700' : 'hover:bg-slate-700 text-gray-300')
                    }`}
                  >
                    {t.icon}
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 relative overflow-hidden">
        {/* Background Glow Elements */}
        {activeTheme !== 'light' && (
          <>
            <div className={`absolute top-1/4 -right-64 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none ${activeTheme === 'neon' ? 'bg-fuchsia-600' : activeTheme === 'executive' ? 'bg-emerald-600' : 'bg-cyan-600'}`} />
            <div className={`absolute bottom-0 -left-64 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 pointer-events-none ${activeTheme === 'neon' ? 'bg-purple-600' : activeTheme === 'executive' ? 'bg-blue-800' : 'bg-blue-600'}`} />
          </>
        )}

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          
          {/* Left/Content Column */}
          <div className="relative z-10 flex flex-col gap-8">
            <div className={`inline-flex items-center px-4 py-2 rounded-full w-max text-sm font-semibold tracking-wide ${theme.badge}`}>
              <Zap className="w-4 h-4 ml-2" />
              أقوى نظام Enterprise ERP مدار بالذكاء الاصطناعي
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              أتمت أعمالك مع <br />
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${activeTheme === 'neon' ? 'from-fuchsia-400 to-purple-400' : activeTheme === 'executive' ? 'from-emerald-400 to-teal-400' : activeTheme === 'light' ? 'from-blue-600 to-cyan-600' : 'from-cyan-400 to-blue-500'}`}>
                نما سوفت المستقل
              </span>
            </h1>
            
            <p className={`text-lg md:text-xl leading-relaxed max-w-xl ${activeTheme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
              نظام سحابي متكامل يشمل إدارة المخزون، نقاط البيع، المحاسبة بقيد مزدوج، وفاتورة هيئة الزكاة والضريبة والجمارك (المرحلة الثانية) أوتوماتيكياً بطبقة حماية بنكية.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button 
                onClick={() => window.location.href = '/onboarding/zatca'}
                className={`flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white transition-all transform hover:scale-105 active:scale-95 ${theme.buttonPrefix}`}
              >
                تأسيس شركة جديدة مجاناً
                <ArrowRight className="w-5 h-5 mr-3" />
              </button>
              
              <button 
                onClick={() => window.open('https://wa.me/966531206628', '_blank')}
                className={`flex items-center justify-center px-8 py-4 rounded-xl font-bold text-[#25D366] bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-all`}
              >
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                تواصل معنا عبر واتساب
              </button>
              
              <button 
                onClick={() => window.location.href = '/login'}
                className={`flex items-center justify-center px-8 py-4 rounded-xl font-bold transition-all ${theme.googleBtn}`}
              >
                 تسجيل الدخول (SSO)
                 <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                   <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                   <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                   <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                   <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                 </svg>
              </button>
            </div>
            
            <div className={`flex items-center gap-6 mt-6 text-sm font-medium ${activeTheme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> اعتماد هيئة الزكاة</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> خوادم مستقلة</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> أمان بنكي</div>
            </div>
          </div>

          {/* Right/Visual Column */}
          <div className="relative z-10 hidden lg:block perspective-1000">
            <div className={`relative w-full aspect-square rounded-full ${theme.card} flex items-center justify-center transform rotate-y-12 shadow-2xl overflow-hidden`}>
               {/* Abstract App UI Mockup Representation */}
               <div className="absolute inset-8 rounded-full border border-current opacity-10 flex items-center justify-center animate-[spin_20s_linear_infinite]">
                 <div className="absolute inset-8 border border-current opacity-20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
               </div>
               
               <div className={`w-3/4 h-2/3 rounded-2xl overflow-hidden shadow-2xl border ${activeTheme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-slate-900 border-slate-700'}`}>
                 <div className={`h-8 w-full border-b flex items-center px-4 gap-2 ${activeTheme === 'light' ? 'bg-gray-200 border-gray-300' : 'bg-slate-800 border-slate-700'}`}>
                   <div className="w-3 h-3 rounded-full bg-red-500"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                   <div className="w-3 h-3 rounded-full bg-green-500"></div>
                 </div>
                 <div className="p-6 flex flex-col gap-4">
                   <div className={`h-8 rounded-lg w-1/3 ${activeTheme === 'light' ? 'bg-blue-200' : 'bg-slate-700'}`}></div>
                   <div className="grid grid-cols-3 gap-4">
                     <div className={`h-24 rounded-lg bg-gradient-to-br ${activeTheme === 'neon' ? 'from-fuchsia-500/20 to-purple-500/20 border-fuchsia-500/30' : activeTheme === 'light' ? 'from-blue-100 to-cyan-100 border-blue-200' : 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30'} border`}></div>
                     <div className={`col-span-2 h-24 rounded-lg bg-gradient-to-br ${activeTheme === 'neon' ? 'from-purple-500/20 to-pink-500/20 border-purple-500/30' : activeTheme === 'light' ? 'from-teal-100 to-emerald-100 border-teal-200' : 'from-blue-500/20 to-indigo-500/20 border-blue-500/30'} border`}></div>
                   </div>
                   <div className={`h-32 rounded-lg ${activeTheme === 'light' ? 'bg-gray-200' : 'bg-slate-800'} w-full border ${activeTheme === 'light' ? 'border-gray-300' : 'border-slate-700'}`}></div>
                 </div>
               </div>
               
               {/* Floating Icon Badges */}
               <div className={`absolute top-10 right-10 p-4 rounded-xl backdrop-blur-md shadow-xl border ${theme.card}`}>
                 <Globe className={`w-8 h-8 ${theme.accent}`} />
               </div>
               <div className={`absolute bottom-20 left-10 p-4 rounded-xl backdrop-blur-md shadow-xl border ${theme.card}`}>
                 <Cpu className={`w-8 h-8 ${theme.accent}`} />
               </div>
            </div>
          </div>
          
        </div>
      </main>

    </div>
  );
}
