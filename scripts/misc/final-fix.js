const { Client } = require('ssh2');

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { console.error('sftp error:', err.message); c.end(); return r(false); }
        const buf = Buffer.from(content, 'utf8');
        const stream = sftp.createWriteStream(remotePath);
        stream.write(buf); stream.end();
        stream.on('close', () => { console.log('[✓] Written', remotePath.split('/').pop()); c.end(); r(true); });
        stream.on('error', e => { console.error('[✗]', e.message); c.end(); r(false); });
      });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

// Restore page.tsx to be a proper standalone client page (no server wrapper needed)
// The key fix: remove "export const dynamic" from client component (it's meaningless there)
// And add it properly to a layout.tsx or use generateStaticParams trick

const fixedPage = `"use client";
// This page renders client-side - no static caching
import React, { useState, useEffect } from "react";
import {
  ShieldCheck, Bot, MessageCircle, ShoppingCart,
  Building, Wallet, Users, Fingerprint, Database, Factory,
  Cpu, TrendingUp, Truck, Wrench, Home, Layers, Phone,
  Calculator, CreditCard, FileText, Clock, Archive,
  Package, BellRing, Barcode, Hash, CheckSquare, Camera,
  UserCheck, Award, Megaphone, Gift, Link, Star, BookOpen,
  Eye, GitMerge, Map, Target, Settings, Inbox, RefreshCcw,
  CalendarDays, DollarSign, Activity, Network, BarChart3,
  FileEdit, Receipt, Sliders, FileCheck, History, Repeat,
  CheckCircle, LineChart, Briefcase, Globe, ClipboardList,
  LayoutDashboard, BarChart2, Hourglass
} from "lucide-react";

const CATEGORIES = [
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

const modulesList = [
  { cat: 'finance', icon: <Calculator size={18}/>, title: "المحاسبة المالية", desc: "قيود يومية وشجرة حسابات متعددة المستويات" },
  { cat: 'finance', icon: <Building size={18}/>, title: "الحسابات البنكية", desc: "تتبع الأرصدة والتسويات البنكية" },
  { cat: 'finance', icon: <BarChart2 size={18}/>, title: "ميزان المراجعة", desc: "Drill-Down حتى القيد الأصلي" },
  { cat: 'finance', icon: <Globe size={18}/>, title: "الاعتمادات المستندية (LC)", desc: "تكاليف الاستيراد والشحن والتخليص" },
  { cat: 'finance', icon: <Briefcase size={18}/>, title: "الأصول الثابتة", desc: "احتساب الاهتلاك وسندات التخريد" },
  { cat: 'finance', icon: <LineChart size={18}/>, title: "الموازنات التقديرية", desc: "رقابة مالية ومقارنة الفعلي بالمتوقع" },
  { cat: 'finance', icon: <Wallet size={18}/>, title: "العهد والنثريات", desc: "صرف وتسوية مصاريف الفروع" },
  { cat: 'finance', icon: <CreditCard size={18}/>, title: "المصروفات العمومية", desc: "تسجيل وتبويب المصروفات اليومية" },
  { cat: 'finance', icon: <ShieldCheck size={18}/>, title: "الخزينة والصناديق", desc: "عرض بانورامي للنقد في الفروع" },
  { cat: 'finance', icon: <FileCheck size={18}/>, title: "المطابقة البنكية", desc: "Auto Match لكشوفات البنك" },
  { cat: 'finance', icon: <CheckSquare size={18}/>, title: "الشيكات", desc: "تتبع أوراق القبض والدفع كاملاً" },
  { cat: 'finance', icon: <History size={18}/>, title: "أقساط العملاء", desc: "جدولة التمويل ومتابعة التحصيل" },
  { cat: 'finance', icon: <FileText size={18}/>, title: "سندات القبض والدفع", desc: "سند واحد يسدد فواتير متعددة" },
  { cat: 'sales', icon: <ShoppingCart size={18}/>, title: "المبيعات B2B", desc: "فوترة ZATCA Phase 2 كاملة" },
  { cat: 'sales', icon: <LayoutDashboard size={18}/>, title: "نقطة البيع POS", desc: "باركود سريع وأوفلاين مزامن" },
  { cat: 'sales', icon: <Clock size={18}/>, title: "الورديات والإغلاق", desc: "حماية مالية لنهاية الدوام" },
  { cat: 'sales', icon: <Archive size={18}/>, title: "أرشيف المبيعات", desc: "XML للزكاة وبحث متقدم" },
  { cat: 'sales', icon: <Sliders size={18}/>, title: "خيارات المبيعات", desc: "سياسات الخصم والائتمان" },
  { cat: 'sales', icon: <ClipboardList size={18}/>, title: "أوامر البيع (SO)", desc: "حجز المخزون للعملاء" },
  { cat: 'sales', icon: <Truck size={18}/>, title: "مذكرات التسليم", desc: "تتبع التسليم الجزئي للمشاريع" },
  { cat: 'sales', icon: <Map size={18}/>, title: "مسارات التوزيع", desc: "خطوط سير مندوبي المبيعات" },
  { cat: 'sales', icon: <Target size={18}/>, title: "أهداف المبيعات", desc: "قياس أداء المندوبين لحظياً" },
  { cat: 'sales', icon: <RefreshCcw size={18}/>, title: "مرتجعات المبيعات", desc: "إشعارات دائنة وإعادة للمخزون" },
  { cat: 'sales', icon: <Repeat size={18}/>, title: "الفواتير المتكررة", desc: "أتمتة فواتير الاشتراكات" },
  { cat: 'sales', icon: <Receipt size={18}/>, title: "عروض الأسعار", desc: "تحويل العرض لفاتورة بنقرة" },
  { cat: 'purchases', icon: <FileEdit size={18}/>, title: "طلبات الشراء (PR)", desc: "دورة اعتماد احتياجات الأقسام" },
  { cat: 'purchases', icon: <Inbox size={18}/>, title: "عروض الموردين (RFQ)", desc: "مقارنة عمياء بين الموردين" },
  { cat: 'purchases', icon: <Receipt size={18}/>, title: "أوامر الشراء (PO)", desc: "تأكيد الكميات والأسعار للمورد" },
  { cat: 'purchases', icon: <ShoppingCart size={18}/>, title: "فواتير المشتريات", desc: "إدخال مباشر مع ربط محاسبي" },
  { cat: 'purchases', icon: <CheckSquare size={18}/>, title: "استلام البضاعة (GRN)", desc: "مطابقة الكميات وفحص الجودة" },
  { cat: 'purchases', icon: <RefreshCcw size={18}/>, title: "مرتجعات المشتريات", desc: "إشعار مدين للمورد وتسوية" },
  { cat: 'purchases', icon: <Settings size={18}/>, title: "خيارات المشتريات", desc: "سياسات الموافقات والحدود المالية" },
  { cat: 'stock', icon: <Package size={18}/>, title: "بطاقات المنتجات", desc: "Matrix + وحدات تحويل متعددة" },
  { cat: 'stock', icon: <Building size={18}/>, title: "المستودعات والفروع", desc: "هيكل شجري + صلاحيات معزولة" },
  { cat: 'stock', icon: <BellRing size={18}/>, title: "تنبيهات النقص", desc: "رادار مخزون ذكي ومتابعة" },
  { cat: 'stock', icon: <Database size={18}/>, title: "الأرصدة الحية", desc: "متاح، محجوز، مباع لحظياً" },
  { cat: 'stock', icon: <Activity size={18}/>, title: "حركات المخزون", desc: "تتبع كل عملية دخول وخروج" },
  { cat: 'stock', icon: <Sliders size={18}/>, title: "تسويات الجرد", desc: "تصحيح الفوارق بقيود محاسبية" },
  { cat: 'stock', icon: <Layers size={18}/>, title: "تحويلات المخزون", desc: "نقل البضاعة بين الفروع" },
  { cat: 'stock', icon: <CheckSquare size={18}/>, title: "الجرد المخزني", desc: "دورة جرد كاملة من التخطيط للإغلاق" },
  { cat: 'stock', icon: <Camera size={18}/>, title: "الجرد بالرؤية الذكية", desc: "مسح كاميرا AI لتسريع الجرد 80%" },
  { cat: 'stock', icon: <Barcode size={18}/>, title: "الباركود والملصقات", desc: "طباعة جماعية EAN/QR/Code128" },
  { cat: 'stock', icon: <Hourglass size={18}/>, title: "تواريخ الصلاحية", desc: "FEFO تلقائي وتنبيهات الانتهاء" },
  { cat: 'stock', icon: <Hash size={18}/>, title: "الأرقام التسلسلية", desc: "تتبع الوحدة من المورد للعميل" },
  { cat: 'stock', icon: <LayoutDashboard size={18}/>, title: "WMS المتقدم", desc: "أرفف ومواقع وتوجيه العمال" },
  { cat: 'stock', icon: <GitMerge size={18}/>, title: "التحويلات الذكية", desc: "توازن المخزون تلقائياً بين الفروع" },
  { cat: 'stock', icon: <Settings size={18}/>, title: "خيارات المستودعات", desc: "FIFO/متوسط والبيع بلا مخزون" },
  { cat: 'hr', icon: <Users size={18}/>, title: "إدارة الموظفين", desc: "ملف متكامل من التعيين للتقاعد" },
  { cat: 'hr', icon: <DollarSign size={18}/>, title: "مسيرات الرواتب", desc: "WPS متوافق وقيد محاسبي آلي" },
  { cat: 'hr', icon: <Fingerprint size={18}/>, title: "الحضور والانصراف", desc: "ربط ZKTeco والبصمة الوجهية" },
  { cat: 'hr', icon: <CalendarDays size={18}/>, title: "الإجازات والغياب", desc: "طلب واعتماد ورصيد تلقائي" },
  { cat: 'hr', icon: <CreditCard size={18}/>, title: "سلف الموظفين", desc: "جدولة استقطاع شهري من الراتب" },
  { cat: 'hr', icon: <BookOpen size={18}/>, title: "برامج التدريب", desc: "ربط التدريب بالمسار الوظيفي" },
  { cat: 'hr', icon: <Star size={18}/>, title: "تقييم الأداء KPI", desc: "مؤشرات موضوعية مرتبطة بالحوافز" },
  { cat: 'hr', icon: <Briefcase size={18}/>, title: "الوظائف والتوظيف", desc: "إعلان الوظائف واستقبال الطلبات" },
  { cat: 'hr', icon: <Cpu size={18}/>, title: "التسجيل الوجهي AI", desc: "بصمة الوجه بدقة 99.9%" },
  { cat: 'crm', icon: <UserCheck size={18}/>, title: "العملاء وكبار المشترين", desc: "ملف ائتماني كامل وحد المديونية" },
  { cat: 'crm', icon: <Target size={18}/>, title: "فرص البيع (CRM Leads)", desc: "قمع مبيعات من الاهتمام للإغلاق" },
  { cat: 'crm', icon: <Award size={18}/>, title: "برنامج نقاط الولاء", desc: "مكافآت تحفيز تلقائية للعملاء" },
  { cat: 'crm', icon: <Gift size={18}/>, title: "بطاقات الهدايا", desc: "إصدار وتتبع رصيد البطاقات" },
  { cat: 'crm', icon: <CheckSquare size={18}/>, title: "الكوبونات وأكواد الخصم", desc: "استهداف شرائح بعروض حصرية" },
  { cat: 'crm', icon: <Megaphone size={18}/>, title: "العروض الترويجية", desc: "اشتري 2 واحصل على 1 تلقائياً" },
  { cat: 'crm', icon: <Link size={18}/>, title: "التسويق بالعمولة", desc: "شبكة شركاء تعمل على الأداء" },
  { cat: 'crm', icon: <History size={18}/>, title: "أقساط ومديونيات", desc: "جداول سداد وتنبيهات تلقائية" },
  { cat: 'ai', icon: <TrendingUp size={18}/>, title: "المدير المالي الذكي", desc: "تشخيص مالي وتوصيات استراتيجية" },
  { cat: 'ai', icon: <Building size={18}/>, title: "محلل كشف البنك AI", desc: "تصنيف المعاملات تلقائياً" },
  { cat: 'ai', icon: <Eye size={18}/>, title: "كشف الاحتيال AI", desc: "رادار ذكي للتلاعب والشذوذ" },
  { cat: 'ai', icon: <Network size={18}/>, title: "سلسلة التوريد AI", desc: "تنبؤ الطلب وتحسين الشراء" },
  { cat: 'ai', icon: <Bot size={18}/>, title: "المساعد الذكي AI", desc: "Copilot داخل كل شاشة" },
  { cat: 'ai', icon: <MessageCircle size={18}/>, title: "بوت تيليجرام", desc: "تقارير وموافقات عبر البوت" },
  { cat: 'enterprise', icon: <Factory size={18}/>, title: "أوامر التصنيع", desc: "تتبع الإنتاج واحتساب التكلفة" },
  { cat: 'enterprise', icon: <Cpu size={18}/>, title: "تخطيط الموارد MRP", desc: "حساب الاحتياج وتوليد طلبات الشراء" },
  { cat: 'enterprise', icon: <BookOpen size={18}/>, title: "وصفات التصنيع (BOM)", desc: "مكونات كل منتج بالكميات الدقيقة" },
  { cat: 'enterprise', icon: <CheckSquare size={18}/>, title: "إدارة المشاريع", desc: "مراحل وتقدم ومستخلصات دفعية" },
  { cat: 'enterprise', icon: <CheckCircle size={18}/>, title: "ضبط الجودة (QC)", desc: "فحص البضاعة الواردة قبل القبول" },
  { cat: 'enterprise', icon: <Wrench size={18}/>, title: "نظام الصيانة", desc: "طلبات خدمة وإصدار الفاتورة" },
  { cat: 'enterprise', icon: <Truck size={18}/>, title: "أسطول المركبات", desc: "تكاليف التشغيل وجدولة الصيانة" },
  { cat: 'enterprise', icon: <Database size={18}/>, title: "إدارة الوقود", desc: "كشف شذوذ استهلاك الوقود" },
  { cat: 'enterprise', icon: <Map size={18}/>, title: "رحلات الأسطول", desc: "توثيق الرحلات وتكلفة السائق" },
  { cat: 'enterprise', icon: <Home size={18}/>, title: "إدارة العقارات", desc: "عقود إيجار وعائد استثماري" },
  { cat: 'enterprise', icon: <FileText size={18}/>, title: "عقود الإيجار IFRS 16", desc: "التزامات الإيجار معياري" },
  { cat: 'enterprise', icon: <History size={18}/>, title: "أقساط العقارات", desc: "تحصيل المستثمرين في المشاريع" },
  { cat: 'enterprise', icon: <BookOpen size={18}/>, title: "الفصول الدراسية", desc: "جداول وحضور الطلاب" },
  { cat: 'enterprise', icon: <Users size={18}/>, title: "الطلاب والرسوم", desc: "ملفات الطلاب وتحصيل المديونيات" },
  { cat: 'enterprise', icon: <CalendarDays size={18}/>, title: "الحجوزات والمواعيد", desc: "جدولة بلا تداخل وتأكيدات تلقائية" },
  { cat: 'enterprise', icon: <Clock size={18}/>, title: "تقويم الحجوزات", desc: "عرض بصري يومي وأسبوعي وشهري" },
  { cat: 'admin', icon: <LayoutDashboard size={18}/>, title: "لوحة التحكم الرئيسية", desc: "مؤشرات الأداء والتنبيهات لحظياً" },
  { cat: 'admin', icon: <Settings size={18}/>, title: "مركز القيادة والإعدادات", desc: "سياسات الشركة والمظهر والمستخدمين" },
  { cat: 'admin', icon: <Building size={18}/>, title: "بيانات المنشأة", desc: "تسجيل ZATCA ومعلومات قانونية" },
  { cat: 'admin', icon: <Layers size={18}/>, title: "الفروع ونقاط البيع", desc: "عزل إيرادات وبيانات كل فرع" },
  { cat: 'admin', icon: <DollarSign size={18}/>, title: "إدارة العملات", desc: "أسعار صرف وقيود الفروق" },
  { cat: 'admin', icon: <CheckSquare size={18}/>, title: "نظام الموافقات", desc: "مسارات اعتماد متعددة المراحل" },
  { cat: 'admin', icon: <MessageCircle size={18}/>, title: "تكامل واتساب", desc: "فواتير وإشعارات عبر واتساب" },
  { cat: 'admin', icon: <Eye size={18}/>, title: "سجلات المراجعة", desc: "تتبع كل تعديل بزمنه ومُنفّذه" },
  { cat: 'admin', icon: <Activity size={18}/>, title: "صحة النظام", desc: "مراقبة الخوادم وزمن الاستجابة" },
  { cat: 'admin', icon: <BellRing size={18}/>, title: "التنبيهات الذكية", desc: "مركز تجميع كل تنبيهات النظام" },
  { cat: 'admin', icon: <BarChart3 size={18}/>, title: "مركز التقارير", desc: "50+ تقرير قابل للتصدير" },
  { cat: 'admin', icon: <ShieldCheck size={18}/>, title: "الصلاحيات المتقدمة", desc: "104 قسم × مستخدم × صلاحية" },
];

export default function NamaInvestLanding() {
  const [activeTab, setActiveTab] = useState('all');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => { setMounted(true); }, []);
  
  const filtered = activeTab === 'all' ? modulesList : modulesList.filter(m => m.cat === activeTab);

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" dir="rtl" style={{ background: '#F8FAFC', color: '#0F172A' }}>
      <style dangerouslySetInnerHTML={{__html: \`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Cairo', sans-serif !important; }
        .tab-scroll::-webkit-scrollbar { height: 0; }
      \`}} />

      <nav className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900">نما إنفست</span>
          </div>
          <div className="hidden md:flex gap-8 font-bold text-slate-600 text-sm">
            <a href="#" className="hover:text-indigo-600">الرئيسية</a>
            <a href="#modules" className="hover:text-indigo-600">الأنظمة الـ 104</a>
            <a href="#" className="hover:text-indigo-600">القطاعات</a>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.location.href = '/sign-in'} className="text-slate-600 font-bold text-sm hidden sm:block hover:text-indigo-600 transition-colors">تسجيل الدخول</button>
            <button onClick={() => window.open('https://wa.me/966531206628', '_blank')} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2">
              <Phone className="w-4 h-4" /> تواصل معنا
            </button>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}/>
        <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl"/>
        <div className="absolute -bottom-40 left-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl"/>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            🚀 النظام المؤسسي الأول في المملكة — متوافق 100% مع هيئة الزكاة
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            نظام <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">نما إنفست</span>
            <br/>
            <span className="text-3xl md:text-4xl font-bold text-slate-300">104 وحدة برمجية في بيئة واحدة</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
            من نقاط البيع وإدارة المخزون المتقدمة إلى المحاسبة المالية وعقود الإيجار والذكاء الاصطناعي.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {[{ num: '104+', label: 'وحدة برمجية' }, { num: '10', label: 'قطاع أعمال' }, { num: '100%', label: 'متوافق ZATCA' }, { num: '24/7', label: 'دعم فني' }].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-6 py-4 text-center min-w-[110px]">
                <div className="text-3xl font-black text-white">{s.num}</div>
                <div className="text-xs text-slate-400 font-bold mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => window.open('https://wa.me/966531206628', '_blank')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/40 transition-all text-lg">
              🚀 جرب النظام مجاناً
            </button>
            <button onClick={() => { const el = document.getElementById('modules'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all text-lg">
              استعرض الـ 104 وحدة ↓
            </button>
          </div>
        </div>
      </div>

      <div id="modules" className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-900 mb-3">موسوعة أنظمة نما إنفست</h2>
          <p className="text-slate-500 text-lg">104 وحدة برمجية متكاملة — اضغط على أي قسم للتصفية</p>
        </div>
        <div className="tab-scroll flex gap-2 overflow-x-auto pb-3 mb-8">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setActiveTab(c.id)}
              className={\`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap \${activeTab === c.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}\`}>
              {c.emoji} {c.label} {activeTab === c.id && \`(\${filtered.length})\`}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((m, i) => (
            <div key={i} className="group bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-200 cursor-default">
              <div className="w-10 h-10 bg-indigo-50 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center text-indigo-600 group-hover:text-white mb-3 transition-all duration-300">
                {m.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1 leading-tight group-hover:text-indigo-700 transition-colors">{m.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8 text-slate-400 text-sm font-bold">
          عرض {mounted ? filtered.length : modulesList.length} من {modulesList.length} وحدة
        </div>
      </div>

      <div className="bg-gradient-to-l from-indigo-900 to-slate-900 text-white py-16 px-4 text-center">
        <h2 className="text-4xl font-black mb-4">جاهز لتحويل عملك رقمياً؟</h2>
        <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">ابدأ اليوم مجاناً مع كامل الدعم الفني والتدريب</p>
        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={() => window.open('https://wa.me/966531206628', '_blank')} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl shadow-lg transition-all text-lg flex items-center gap-2">
            <Phone className="w-5 h-5"/> تواصل عبر واتساب
          </button>
          <button onClick={() => window.location.href = '/sign-in'} className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all text-lg">
            تسجيل الدخول للنظام
          </button>
        </div>
      </div>

      <footer className="py-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white"/>
            </div>
            <span className="font-black text-slate-800">نما إنفست</span>
          </div>
          <div className="text-slate-400 text-sm font-bold">© {new Date().getFullYear()} جميع الحقوق محفوظة لشركة نما إنفست</div>
          <div className="flex gap-6 text-sm font-bold text-slate-400">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">الشروط والأحكام</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">سياسة الخصوصية</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
`;

(async () => {
  // Restore proper page.tsx (the client-only version with useEffect fix)
  await writeFile('/www/wwwroot/namainvist.com/src/app/page.tsx', fixedPage);
  
  // Remove the server wrapper file
  await ssh('rm -f /www/wwwroot/namainvist.com/src/app/landing.tsx');
  
  // Clean rebuild
  console.log('\n🔨 Final clean build...');
  await ssh('cd /www/wwwroot/namainvist.com && rm -rf .next && npm run build 2>&1 | tail -20');
  
  // Verify
  const check = await ssh('grep -c "104" /www/wwwroot/namainvist.com/.next/server/app/index.html 2>&1');
  console.log('\n--- "104" count in built HTML:', check, '---');
  
  await ssh('pm2 restart main-site 2>&1 | tail -3');
  console.log('\n✅ Final fix deployed!');
})();
