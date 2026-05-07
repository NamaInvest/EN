"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import { ShieldCheck, Bot, MessageCircle, ShoppingCart, Building, Wallet, Users, Fingerprint, Database, Factory, Cpu, TrendingUp, Truck, Wrench, Home, Layers, Phone, Calculator, CreditCard, FileText, Clock, Archive, Package, BellRing, Barcode, Hash, CheckSquare, Camera, UserCheck, Award, Megaphone, Gift, Link as LinkIcon, Star, BookOpen, Eye, GitMerge, Map, Target, Settings, Inbox, RefreshCcw, CalendarDays, DollarSign, Activity, Network, BarChart3, FileEdit, Receipt, Sliders, FileCheck, History, Repeat, CheckCircle, LineChart, Briefcase, Globe, ClipboardList, LayoutDashboard, BarChart2, Hourglass, Pill, ShoppingBag, UtensilsCrossed, Cog, Brain, ChevronDown, ChevronUp, ArrowLeft, Menu, X, Search, Download, Zap, ArrowRight, Play } from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────
export const CATEGORIES = [
  { id: 'all', label: 'الكل', emoji: '🌐' },
  { id: 'finance', label: 'المالية', emoji: '💰' },
  { id: 'sales', label: 'المبيعات', emoji: '🛒' },
  { id: 'purchases', label: 'المشتريات', emoji: '📦' },
  { id: 'stock', label: 'المخزون', emoji: '🏭' },
  { id: 'hr', label: 'الموارد البشرية', emoji: '👥' },
  { id: 'crm', label: 'العملاء والتسويق', emoji: '🎁' },
  { id: 'ai', label: 'الذكاء الاصطناعي', emoji: '🧠' },
  { id: 'enterprise', label: 'القطاعات المتخصصة', emoji: '🏢' },
  { id: 'admin', label: 'الإدارة', emoji: '⚙️' },
];

export const modulesList = [
  { cat: 'finance', icon: <Calculator size={20}/>, title: "المحاسبة المالية", desc: "قيود يومية وشجرة حسابات متعددة المستويات" },
  { cat: 'finance', icon: <Building size={20}/>, title: "الحسابات البنكية", desc: "تتبع الأرصدة والتسويات البنكية" },
  { cat: 'finance', icon: <BarChart2 size={20}/>, title: "ميزان المراجعة", desc: "Drill-Down حتى القيد الأصلي" },
  { cat: 'finance', icon: <Globe size={20}/>, title: "الاعتمادات المستندية (LC)", desc: "تكاليف الاستيراد والشحن والتخليص" },
  { cat: 'finance', icon: <Briefcase size={20}/>, title: "الأصول الثابتة", desc: "احتساب الاهتلاك وسندات التخريد" },
  { cat: 'finance', icon: <LineChart size={20}/>, title: "الموازنات التقديرية", desc: "رقابة مالية ومقارنة الفعلي بالمتوقع" },
  { cat: 'finance', icon: <Wallet size={20}/>, title: "العهد والنثريات", desc: "صرف وتسوية مصاريف الفروع" },
  { cat: 'finance', icon: <CreditCard size={20}/>, title: "المصروفات العمومية", desc: "تسجيل وتبويب المصروفات اليومية" },
  { cat: 'finance', icon: <ShieldCheck size={20}/>, title: "الخزينة والصناديق", desc: "عرض بانورامي للنقد في الفروع" },
  { cat: 'sales', icon: <ShoppingCart size={20}/>, title: "المبيعات B2B", desc: "فوترة ZATCA Phase 2 كاملة" },
  { cat: 'sales', icon: <LayoutDashboard size={20}/>, title: "نقطة البيع POS", desc: "باركود سريع وأوفلاين مزامن" },
  { cat: 'sales', icon: <Target size={20}/>, title: "أهداف المبيعات", desc: "قياس أداء المندوبين لحظياً" },
  { cat: 'purchases', icon: <FileEdit size={20}/>, title: "طلبات الشراء (PR)", desc: "دورة اعتماد احتياجات الأقسام" },
  { cat: 'purchases', icon: <Inbox size={20}/>, title: "عروض الموردين (RFQ)", desc: "مقارنة عمياء بين الموردين" },
  { cat: 'stock', icon: <Package size={20}/>, title: "بطاقات المنتجات", desc: "Matrix + وحدات تحويل متعددة" },
  { cat: 'stock', icon: <Database size={20}/>, title: "الأرصدة الحية", desc: "متاح، محجوز، مباع لحظياً" },
  { cat: 'hr', icon: <Users size={20}/>, title: "إدارة الموظفين", desc: "ملف متكامل من التعيين للتقاعد" },
  { cat: 'hr', icon: <DollarSign size={20}/>, title: "مسيرات الرواتب", desc: "WPS متوافق وقيد محاسبي آلي" },
  { cat: 'crm', icon: <UserCheck size={20}/>, title: "العملاء وكبار المشترين", desc: "ملف ائتماني كامل وحد المديونية" },
  { cat: 'crm', icon: <Award size={20}/>, title: "برنامج نقاط الولاء", desc: "مكافآت تحفيز تلقائية للعملاء" },
  { cat: 'ai', icon: <TrendingUp size={20}/>, title: "المدير المالي الذكي", desc: "تشخيص مالي وتوصيات استراتيجية" },
  { cat: 'ai', icon: <Eye size={20}/>, title: "كشف الاحتيال AI", desc: "رادار ذكي للتلاعب والشذوذ" },
  { cat: 'enterprise', icon: <Factory size={20}/>, title: "أوامر التصنيع", desc: "تتبع الإنتاج واحتساب التكلفة" },
  { cat: 'admin', icon: <Settings size={20}/>, title: "مركز القيادة والإعدادات", desc: "سياسات الشركة والمظهر والمستخدمين" },
];

export const INDUSTRIES = [
  {
    id: 'pharmacy', emoji: '💊', icon: <Pill size={32} strokeWidth={1.5} />,
    title: 'الصيدليات', titleEn: 'Pharmacies',
    color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20',
    features: ['تتبع تواريخ الصلاحية (FEFO)', 'منع بيع الدواء المنتهي', 'إدارة البدائل الطبية']
  },
  {
    id: 'retail', emoji: '🛒', icon: <ShoppingBag size={32} strokeWidth={1.5} />,
    title: 'التموينات والحلويات', titleEn: 'Grocery & Sweets',
    color: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/20',
    features: ['إدارة آلاف الأصناف', 'ربط الموازين الإلكترونية', 'نظام ولاء وخصومات ذكية']
  },
  {
    id: 'restaurant', emoji: '🍽️', icon: <UtensilsCrossed size={32} strokeWidth={1.5} />,
    title: 'المطاعم والكافيهات', titleEn: 'Restaurants & Cafes',
    color: 'from-rose-400 to-pink-500', shadow: 'shadow-pink-500/20',
    features: ['خريطة طاولات تفاعلية', 'شاشة مطبخ رقمية (KDS)', 'منيو إلكتروني لحظي']
  },
  {
    id: 'factory', emoji: '🏭', icon: <Factory size={32} strokeWidth={1.5} />,
    title: 'المصانع والإنتاج', titleEn: 'Manufacturing',
    color: 'from-blue-400 to-indigo-500', shadow: 'shadow-indigo-500/20',
    features: ['قائمة المواد BOM', 'تتبع مراحل الإنتاج', 'حساب تكلفة التصنيع']
  },
  {
    id: 'services', emoji: '🔧', icon: <Cog size={32} strokeWidth={1.5} />,
    title: 'الخدمات والصيانة', titleEn: 'Services & Maintenance',
    color: 'from-violet-400 to-purple-500', shadow: 'shadow-purple-500/20',
    features: ['كارد الدخول Job Card', 'تتبع حالة الأجهزة', 'جدولة المواعيد الذكية']
  },
];

export const POWER_CLUSTERS = [
  { icon: <Calculator size={28}/>, title: 'السيطرة المالية', color: 'from-teal-400 to-emerald-500', count: 13, desc: 'وداعاً للأخطاء الحسابية. نظام دقيق مع تقارير ضريبية فورية.' },
  { icon: <Package size={28}/>, title: 'قوة المخزون', color: 'from-blue-400 to-indigo-500', count: 14, desc: 'تحكم كامل بالكميات وتواريخ الانتهاء ومواقع الأرفف.' },
  { icon: <ShoppingCart size={28}/>, title: 'تجربة البيع', color: 'from-orange-400 to-rose-500', count: 19, desc: 'POS سريع مع نظام ولاء يبني علاقة طويلة مع عملائك.' },
  { icon: <Cog size={28}/>, title: 'كفاءة التشغيل', color: 'from-pink-400 to-fuchsia-500', count: 25, desc: 'أتمتة كاملة من المادة الخام للمنتج النهائي.' },
  { icon: <Brain size={28}/>, title: 'الذكاء الاصطناعي', color: 'from-violet-400 to-purple-500', count: 6, desc: 'قرر بناءً على البيانات. AI يكشف التلاعب ويتنبأ بالمبيعات.' },
];

export default function VibrantLandingPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredModules = useMemo(() => {
    return modulesList.filter(m => {
      const matchesTab = activeTab === 'all' || m.cat === activeTab;
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-[#fafafc] text-slate-900 overflow-x-hidden selection:bg-purple-200 selection:text-purple-900" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
      <style dangerouslySetInnerHTML={{__html: `
        html { font-size: 16px !important; }
        * { font-family: 'Noto Sans Arabic', sans-serif !important; }
        .transform-3d { transform: perspective(2000px) rotateY(-10deg) rotateX(5deg); }
        .transform-3d:hover { transform: perspective(2000px) rotateY(0deg) rotateX(0deg); }
      `}} />
      
      {/* ── Navbar ───────────────────────────────────────────── */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all duration-300 transform group-hover:-rotate-3">
              <Zap className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <div>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">نما إنفست</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 font-bold text-slate-600">
            <a href="#features" className="hover:text-violet-600 transition-colors">المميزات</a>
            <a href="#industries" className="hover:text-violet-600 transition-colors">القطاعات</a>
            <a href="#modules" className="hover:text-violet-600 transition-colors">الوحدات</a>
            <Link href="/pricing" className="text-slate-900 hover:text-violet-600 transition-colors">الأسعار</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/sign-in" className="font-bold text-slate-600 hover:text-slate-900 transition-colors px-2">دخول</Link>
            <Link href="/sign-up" className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 transition-all duration-300 hover:-translate-y-0.5">
              جرب مجاناً
            </Link>
          </div>

          <button className="md:hidden text-slate-900" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28}/> : <Menu size={28}/>}
          </button>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-6 overflow-hidden">
        {/* Dynamic Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-fuchsia-400/20 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-pulse" style={{ animationDuration: '8s' }}/>
        <div className="absolute top-40 left-0 w-[500px] h-[500px] bg-violet-400/20 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }}/>
        <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-orange-300/20 rounded-full blur-[100px] mix-blend-multiply opacity-70"/>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 text-center lg:text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-sm text-sm font-bold text-violet-700 mb-8">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"/> نظام التشغيل الأذكى لعملك
            </div>
            <h1 className="text-6xl lg:text-[5rem] font-black leading-[1.1] tracking-tight mb-6 text-slate-900">
              أدر أعمالك بذكاء <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500">لا بجهد.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              نما إنفست هو الـ ERP العصري الذي يجمع 104 وحدة سحابية مع واجهة مذهلة وذكاء اصطناعي. متوافق 100% مع أنظمة الزكاة والضريبة.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/sign-up" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black rounded-2xl shadow-xl shadow-violet-500/30 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-3 text-lg">
                ابدأ رحلتك مجاناً <ArrowLeft className="w-5 h-5"/>
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 flex items-center justify-center gap-3 text-lg group">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                  <Play className="w-3.5 h-3.5 text-slate-600 group-hover:text-violet-600 ml-0.5" fill="currentColor"/>
                </div>
                شاهد العرض
              </button>
            </div>
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm font-bold text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500"/> ZATCA Phase 2</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500"/> دعم 24/7</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500"/> أمان بنكي</span>
            </div>
          </div>
          
          <div className="lg:w-1/2 relative w-full">
            {/* Dashboard Mockup 3D Effect */}
            <div className="relative transform-3d shadow-2xl rounded-3xl overflow-hidden border border-white/40 bg-white/40 backdrop-blur-2xl p-2 transition-transform duration-700">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 aspect-[16/10] flex flex-col">
                <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50/50">
                  <div className="w-3 h-3 rounded-full bg-rose-400"/>
                  <div className="w-3 h-3 rounded-full bg-amber-400"/>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"/>
                </div>
                <div className="flex-1 p-6 grid grid-cols-3 gap-6">
                  <div className="col-span-1 space-y-4">
                    <div className="h-24 rounded-xl bg-violet-100/50 border border-violet-100"/>
                    <div className="h-24 rounded-xl bg-fuchsia-100/50 border border-fuchsia-100"/>
                    <div className="h-32 rounded-xl bg-orange-100/50 border border-orange-100"/>
                  </div>
                  <div className="col-span-2 space-y-4">
                    <div className="h-32 rounded-xl bg-slate-50 border border-slate-100"/>
                    <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 min-h-[140px]"/>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-10 -right-10 bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-bounce" style={{ animationDuration: '4s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><TrendingUp size={20}/></div>
                <div>
                  <div className="text-xs text-slate-400 font-bold">المبيعات اليوم</div>
                  <div className="text-lg font-black text-slate-800">+14,500 ر.س</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-10 -left-5 bg-slate-900 text-white p-4 rounded-2xl shadow-xl shadow-slate-900/20 border border-slate-800 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/30 flex items-center justify-center text-violet-300"><Bot size={20}/></div>
                <div>
                  <div className="text-xs text-slate-400 font-bold">المساعد الذكي</div>
                  <div className="text-sm font-bold">تم تحسين المخزون بنسبة 12% ✨</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Clusters / Features ───────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">قوة استثنائية في كل قسم</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">خمس مجموعات استراتيجية مصممة لتجعل إدارة عملك أسهل وأكثر متعة.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {POWER_CLUSTERS.map((c, i) => (
              <div key={i} className="group bg-[#fafafc] rounded-3xl p-6 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:border-violet-100 transition-all duration-500">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:-translate-y-2 transition-transform duration-500`}>
                  {c.icon}
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{c.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{c.desc}</p>
                <div className="text-xs font-bold text-violet-600 bg-violet-50 inline-block px-3 py-1.5 rounded-lg group-hover:bg-violet-100 transition-colors">
                  {c.count} وحدة برمجية
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industries ───────────────────────────────────────────── */}
      <section id="industries" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900"/>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}/>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-black text-white mb-4">صُنع خصيصاً لقطاعك</h2>
              <p className="text-lg text-slate-400 max-w-xl">مهما كان مجال عملك، قمنا بتخصيص الواجهات والأدوات لتناسب طبيعة عملياتك اليومية.</p>
            </div>
            <Link href="/pricing" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-bold transition-colors">
              عرض كل القطاعات <ArrowLeft className="w-4 h-4"/>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {INDUSTRIES.map(ind => (
              <div key={ind.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors cursor-pointer group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ind.color} flex items-center justify-center text-white mb-6 shadow-lg ${ind.shadow} transform group-hover:scale-110 transition-transform duration-500`}>
                  {ind.icon}
                </div>
                <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                  {ind.title}
                </h3>
                <ul className="space-y-3">
                  {ind.features.map(f => (
                    <li key={f} className="text-sm text-slate-300 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0"/>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules Dictionary ───────────────────────────────────────────── */}
      <section id="modules" className="py-24 bg-[#fafafc]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">الموسوعة الشاملة</h2>
            <p className="text-slate-500 mb-8">ابحث في أكثر من 104 وحدة برمجية مصممة لتلبية كافة احتياجاتك</p>
            
            <div className="relative max-w-2xl mx-auto mb-10">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
              <input 
                type="text" 
                placeholder="ابحث عن ميزة (مثال: نقاط البيع، المحاسبة، الجرد)..." 
                className="w-full pr-14 pl-6 py-4 rounded-full border-2 border-slate-100 bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none shadow-sm text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap justify-center items-center gap-2 pb-3">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setActiveTab(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                    activeTab===cat.id 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredModules.map((m) => (
              <div key={m.title} className="bg-white rounded-3xl p-5 border border-slate-100 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 group cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                  {m.icon}
                </div>
                <h3 className="text-base font-black text-slate-800 mb-1">{m.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer / CTA ───────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 rounded-[3rem] p-12 md:p-20 text-center text-white mb-20 relative overflow-hidden shadow-2xl shadow-violet-500/20">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-50"/>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-6">انضم إلى المستقبل الآن</h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">ارتقِ بعملك إلى مستوى جديد من السهولة والتحكم الذكي.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/sign-up" className="px-8 py-4 bg-white text-violet-600 font-black rounded-2xl shadow-xl hover:scale-105 transition-transform">
                  إنشاء حساب مجاني
                </Link>
                <a href="https://wa.me/966531206628" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2">
                  <Phone size={20}/> تواصل مع المبيعات
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100 pt-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black text-slate-800">نما إنفست</span>
            </div>
            <div className="flex gap-6 text-sm font-bold text-slate-500">
              <Link href="/privacy" className="hover:text-violet-600">سياسة الخصوصية</Link>
              <Link href="/terms" className="hover:text-violet-600">الشروط والأحكام</Link>
              <Link href="/pricing" className="hover:text-violet-600">الأسعار</Link>
            </div>
            <div className="text-sm text-slate-400">
              © {new Date().getFullYear()} نما إنفست. جميع الحقوق محفوظة.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
