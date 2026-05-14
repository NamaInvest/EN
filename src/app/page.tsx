"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import packageJson from '../../package.json';
import { ShieldCheck, Bot, MessageCircle, ShoppingCart, Building, Wallet, Users, Fingerprint, Database, Factory, Cpu, TrendingUp, Truck, Wrench, Home, Layers, Phone, Calculator, CreditCard, FileText, Clock, Archive, Package, BellRing, Barcode, Hash, CheckSquare, Camera, UserCheck, Award, Megaphone, Gift, Link as LinkIcon, Star, BookOpen, Eye, GitMerge, Map, Target, Settings, Inbox, RefreshCcw, CalendarDays, DollarSign, Activity, Network, BarChart3, FileEdit, Receipt, Sliders, FileCheck, History, Repeat, CheckCircle, LineChart, Briefcase, Globe, ClipboardList, LayoutDashboard, BarChart2, Hourglass, Pill, ShoppingBag, UtensilsCrossed, Cog, Brain, ChevronDown, ChevronUp, ArrowLeft, Menu, X, Search, Download, Monitor } from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────
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
  { cat: 'crm', icon: <LinkIcon size={18}/>, title: "التسويق بالعمولة", desc: "شبكة شركاء تعمل على الأداء" },
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

const INDUSTRIES = [
  {
    id: 'pharmacy', emoji: '💊', icon: <Pill size={26}/>,
    title: 'الصيدليات', titleEn: 'Pharmacies',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700',
    features: ['تتبع تواريخ الصلاحية (FEFO)', 'منع بيع الدواء المنتهي', 'إدارة البدائل الطبية', 'الأرقام التسلسلية للأدوية', 'تقارير مخزون دوائي متخصصة'],
    url: '/pharmacy'
  },
  {
    id: 'retail', emoji: '🛒', icon: <ShoppingBag size={26}/>,
    title: 'التموينات والحلويات', titleEn: 'Grocery & Sweets',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
    features: ['إدارة آلاف الأصناف', 'ربط الموازين الإلكترونية', 'نظام ولاء وخصومات ذكية', 'جرد وتنبيهات النقص', 'باركود وملصقات جماعية'],
    url: '/retail'
  },
  {
    id: 'restaurant', emoji: '🍽️', icon: <UtensilsCrossed size={26}/>,
    title: 'المطاعم والكافيهات', titleEn: 'Restaurants & Cafes',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700',
    features: ['خريطة طاولات تفاعلية', 'شاشة مطبخ رقمية (KDS)', 'منيو إلكتروني لحظي', 'إدارة الوجبات المركبة', 'دعم التوصيل والطلبات'],
    url: '/restaurant'
  },
  {
    id: 'factory', emoji: '🏭', icon: <Factory size={26}/>,
    title: 'المصانع والإنتاج', titleEn: 'Manufacturing',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700',
    features: ['قائمة المواد BOM', 'تتبع مراحل الإنتاج', 'حساب تكلفة التصنيع', 'إدارة الهالك والمواد الخام', 'تخطيط موارد الإنتاج MRP'],
    url: '/factory'
  },
  {
    id: 'services', emoji: '🔧', icon: <Cog size={26}/>,
    title: 'الخدمات والصيانة', titleEn: 'Services & Maintenance',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700',
    features: ['كارد الدخول Job Card', 'تتبع حالة الأجهزة', 'جدولة المواعيد الذكية', 'إدارة قطع الغيار', 'تنبيه العميل بواتساب'],
    url: '/services'
  },
];

const POWER_CLUSTERS = [
  {
    emoji: '💰', icon: <Calculator size={22}/>,
    title: 'السيطرة المالية', titleEn: 'Financial Mastery',
    color: 'from-emerald-600 to-teal-700', count: 13,
    desc: 'وداعاً للأخطاء الحسابية. نظام محاسبي دقيق مع تقارير ضريبية فورية.',
    highlights: ['قيود مزدوجة آلية', 'مطابقة بنكية Auto-Match', 'شجرة حسابات متعددة', 'تقارير ZATCA', 'الموازنات التقديرية'],
  },
  {
    emoji: '📦', icon: <Package size={22}/>,
    title: 'قوة المخزون', titleEn: 'Inventory Powerhouse',
    color: 'from-blue-600 to-indigo-700', count: 14,
    desc: 'تحكم كامل بالكميات وتواريخ الانتهاء ومواقع الأرفف.',
    highlights: ['جرد متعدد المستودعات', 'FEFO تلقائي', 'WMS بالأرفف والمواقع', 'تنبيهات النقص الذكية', 'جرد بالكاميرا AI'],
  },
  {
    emoji: '🛒', icon: <ShoppingCart size={22}/>,
    title: 'تجربة البيع', titleEn: 'Customer & POS',
    color: 'from-amber-600 to-orange-700', count: 19,
    desc: 'POS فائق السرعة مع نظام ولاء يبني علاقة طويلة مع عملائك.',
    highlights: ['POS أوفلاين مزامن', 'نقاط الولاء والمكافآت', 'بطاقات الهدايا', 'CRM Leads', 'تابي وتمارا وسلة وزد'],
  },
  {
    emoji: '⚙️', icon: <Cog size={22}/>,
    title: 'كفاءة التشغيل', titleEn: 'Operational Excellence',
    color: 'from-rose-600 to-pink-700', count: 25,
    desc: 'أتمتة كاملة من المادة الخام للمنتج النهائي.',
    highlights: ['BOM وأوامر التصنيع', 'إدارة الأسطول والوقود', 'رواتب WPS وبصمة ZKTeco', 'تتبع المشاريع', 'Job Cards الصيانة'],
  },
  {
    emoji: '🧠', icon: <Brain size={22}/>,
    title: 'الذكاء الاصطناعي', titleEn: 'AI & Analytics',
    color: 'from-violet-600 to-purple-700', count: 6,
    desc: 'قرر بناءً على البيانات. AI يكشف التلاعب ويتنبأ بالمبيعات.',
    highlights: ['كشف الاحتيال AI', 'تنبؤ الطلب AI', 'مدير مالي ذكي', 'بوت تيليجرام', 'Copilot داخل كل شاشة'],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────
export default function NamaInvestLanding() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Client-side fallback: redirect subdomain visitors to /login or /dashboard
  useEffect(() => {
    const host = window.location.hostname;
    if (host !== 'namainvist.com' && host !== 'www.namainvist.com' && host.endsWith('.namainvist.com')) {
      const token = document.cookie.split(';').some(c => c.trim().startsWith('token='));
      window.location.href = token ? '/dashboard' : '/login';
    }
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
    <div className="min-h-screen bg-[#fbf8fa] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900" dir="rtl" lang="ar" translate="no">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Kufi+Arabic:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{__html: `
        * { font-family: 'Noto Kufi Arabic', 'Outfit', sans-serif !important; }

        @keyframes bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}} />

      {/* TopNavBar Shell */}
      <nav className="fixed top-8 inset-x-0 mx-auto w-[90%] max-w-7xl rounded-full border border-slate-200/60 bg-white/70 backdrop-blur-3xl shadow-sm flex justify-between items-center px-8 py-3 z-50 transition-all duration-500 hover:shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-slate-800 tracking-normal">نما إنفست</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#platform" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">المنصة</Link>
          <Link href="#modules" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">الوحدات</Link>
          <Link href="#intelligence" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">الذكاء</Link>
          <Link href="/pricing" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">الأسعار</Link>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="hidden lg:block text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">تسجيل الدخول</Link>
          <Link href="/sign-up" className="bg-slate-800 text-white px-8 py-3 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-md">ابدأ مجاناً</Link>
        </div>
        {/* Mobile Toggle */}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6 pt-32">
          <Link href="#platform" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800">المنصة</Link>
          <Link href="#intelligence" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800">الذكاء الاصطناعي</Link>
          <Link href="#modules" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800">الوحدات البرمجية</Link>
          <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800">الأسعار</Link>
          <div className="w-16 h-px bg-slate-200 my-4"></div>
          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-slate-600">تسجيل الدخول</Link>
          <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold bg-slate-900 text-white px-8 py-4 rounded-full mt-4">ابدأ مجاناً</Link>
        </div>
      )}

      <main style={{ paddingTop: '8rem' }}>
        
        {/* Hero Section */}
        <section className="relative px-6 md:px-16 overflow-hidden flex flex-col items-center" style={{ paddingTop: '12rem', paddingBottom: '6rem', marginTop: '5rem' }}>
          <div className="w-full max-w-7xl mx-auto flex flex-col items-center text-center">
            <span className="inline-block px-5 py-2 rounded-full bg-slate-200/50 text-slate-700 text-xs font-bold mb-8 mt-12">
              الإصدار الجديد 2.0 (متوافق مع ZATCA)
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-normal text-slate-800 mb-8 max-w-4xl mx-auto" style={{ lineHeight: '1.7' }}>
              البساطة تلتقي <span className="text-indigo-600">بالقوة</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-16 font-medium" style={{ lineHeight: '1.8' }}>
              الجيل القادم من أنظمة إدارة الأعمال ERP. أدر عملياتك المعقدة بدقة متناهية من منصة سحابية واحدة مصممة لجميع القطاعات.
            </p>
            <div className="relative w-full max-w-5xl mx-auto flex justify-center" style={{ animation: 'bob 6s ease-in-out infinite' }}>
              <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-[100px] -z-10"></div>
              <img 
                alt="NamaInvest Dashboard Preview" 
                className="w-full rounded-3xl shadow-2xl border border-white/60 backdrop-blur-sm" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDetA7XFFV0AEGWaDfNxFYTCpvJky3yWsBc8h3_Oi5YPysNWxfkQOokhJE9xKpVkhoSQlOldeay-ig_sTc974dgOVx7pWzuZmEma4s-JtD12c-SDKDyp-mWppUNCCY_fsWoyWjrDOfglQ2vidJ2NR54UrZAqiOjCk9CpSCWrPUHBTepuyAY2elnsuGngE8fAB9WYFuNNCSZUe6L9qjtefdnWSaLIJ6gNeeyididKIza1UIQ-NIWI0j7kc17Ofxvub8YXrsg4XIPwEc" 
              />
            </div>
          </div>
        </section>

        {/* Feature 1: Intuitive Workflow */}
        <section id="platform" className="py-32 px-6 md:px-16 w-full flex flex-col items-center">
          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 md:gap-20">
            <div className="flex-1 w-full flex flex-col text-right order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">سير عمل بديهي</h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium">
                توقف عن محاربة أدواتك. يوفر نما إنفست بيئة خالية من الاحتكاك حيث تبدو كل خطوة طبيعية وكل نقرة مقصودة بدقة.
              </p>
              <ul className="space-y-5 flex flex-col text-right">
                <li className="flex items-center gap-4 self-start">
                  <CheckCircle className="text-indigo-600 w-6 h-6 shrink-0" />
                  <span className="text-lg font-bold text-slate-700">ترابط آلي بين كافة الوحدات (POS, ERP, HR)</span>
                </li>
                <li className="flex items-center gap-4 self-start">
                  <CheckCircle className="text-indigo-600 w-6 h-6 shrink-0" />
                  <span className="text-lg font-bold text-slate-700">اختصارات ذكية للوصول السريع للمهام</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full order-1 md:order-2">
              <div className="rounded-3xl overflow-hidden shadow-2xl aspect-square">
                <img 
                  alt="Workflow Graphics" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDD-K3QalGsP6Ws05rYapRN9D5M7DFfl_ZK0JrXhqQFUi09w-jMJeb5uRx9kbpS7lpVwsBcDsjoMdzPXQ3PnjHYXibex1NdRnMli1wyENg_GelbOJx9KCrQNyqvowl44goB0mYxp-jQ3-0b6vVOLKQHLFqvIJOIJh8iPlyFv24kWg6pjGLpyF63JmHpYvem9vVGgcqtzQOtFq_x0S8XIF4whndFHq8wq4D1RYwOxWaN2ovm8IkrUpHryRZbKGSPPSbqIF8h4zVHi3M" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: Deep Intelligence */}
        <section id="intelligence" className="py-32 px-6 md:px-16 bg-slate-200/30 w-full flex flex-col items-center">
          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 md:gap-20">
            <div className="flex-1 w-full">
              <div className="rounded-3xl overflow-hidden shadow-2xl aspect-square">
                <img 
                  alt="Intelligence Graphics" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVgJIJ94405PL6aatLlom1pVPRzZyFE6EsvjkppgBGgMDu2CJLRyJzrnWdeEvcZLaMU0DXs14Zo7aXnp86HRwddbxTOidt9hBxWz6W94vsWIlrTvmgZUrFWGxxkohO_Nv-Wh8BWrNGQQhTvF-sQQRCPL63pq9ilVbUnphTxNqmjBLBWfriohuDP7MO_orhnCUlR5B3CYcG4679rn40DbzkwPSOy5K5BXkqNUnhIrxSkm_RturAuyFek-CQF-3K29synNaW48c6bAo" 
                />
              </div>
            </div>
            <div className="flex-1 w-full flex flex-col text-right">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">ذكاء اصطناعي عميق</h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium">
                أكثر من مجرد مقاييس. يقوم محركنا بتحليل الأنماط عبر نظامك البيئي بأكمله لاستخراج الرؤى المالية والتنبؤ بالمبيعات قبل أن تطلبها.
              </p>
              <div className="grid grid-cols-2 gap-6 text-center">
                <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                  <span className="text-4xl md:text-5xl font-extrabold text-indigo-600 block mb-2">99%</span>
                  <span className="text-sm font-bold text-slate-500">دقة التحليل المالي</span>
                </div>
                <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                  <span className="text-4xl md:text-5xl font-extrabold text-indigo-600 block mb-2">2.4x</span>
                  <span className="text-sm font-bold text-slate-500">زيادة الكفاءة التشغيلية</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Directory */}
        <section id="modules" className="py-32 px-6 md:px-16 w-full flex flex-col items-center">
          <div className="w-full max-w-7xl mx-auto flex flex-col items-center text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-6">104+ وحدة برمجية متكاملة</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
              كل ما تحتاجه في مكان واحد. من المشتريات والمبيعات إلى نقاط البيع والمحاسبة المعقدة.
            </p>
          </div>
          
          <div className="w-full max-w-4xl mx-auto flex flex-wrap justify-center gap-3 mb-16">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveTab(cat.id)}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab===cat.id 
                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-300' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredModules.slice(0, 16).map((m) => (
              <div key={m.title} className="group p-8 rounded-3xl bg-white border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors mb-6 shrink-0">
                  {m.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{m.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{m.desc}</p>
              </div>
            ))}
          </div>
          
          {filteredModules.length > 16 && (
            <div className="text-center mt-12 w-full flex justify-center">
              <button className="px-8 py-4 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">
                عرض المزيد من الوحدات
              </button>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 md:px-16 w-full flex flex-col items-center">
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
            <div className="w-full relative bg-white rounded-[3rem] p-12 md:p-32 text-center border border-slate-100 overflow-hidden shadow-2xl flex flex-col items-center">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] -z-10"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[120px] -z-10"></div>
              
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-8 leading-[1.6]">جاهز لرفع مستوى عملك؟</h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-12 font-medium">
                انضم إلى أكثر من 500 شركة تعتمد على نما إنفست لإعادة تعريف الدقة التشغيلية والمالية.
              </p>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full md:w-auto">
                <Link href="/sign-up" className="bg-slate-800 text-white px-12 py-5 rounded-full text-lg font-bold shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all duration-400 w-full md:w-auto text-center">
                  ابدأ مجاناً الآن
                </Link>
                <Link href="/pricing" className="px-12 py-5 rounded-full text-lg font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-400 w-full md:w-auto text-center">
                  جدولة عرض توضيحي
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer Shell */}
      <footer className="w-full py-16 border-t border-slate-200/60 bg-transparent flex flex-col items-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-16 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-right">
          <div className="flex flex-col gap-2 items-center md:items-start">
            <span className="text-2xl font-extrabold text-slate-800 tracking-normal">نما إنفست</span>
            <p className="text-slate-400 text-sm font-bold">© {new Date().getFullYear()} NamaInvest. مبني من أجل الدقة والموثوقية.</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-8 text-sm font-bold text-slate-500">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">الخصوصية</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">الشروط</Link>
            <Link href="/security" className="hover:text-slate-900 transition-colors">الأمان</Link>
            <Link href="/status" className="hover:text-slate-900 transition-colors">حالة النظام</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
