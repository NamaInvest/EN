"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import {
  ShieldCheck, Bot, MessageCircle, ShoppingCart,
  Building, Wallet, Users, Fingerprint, Database, Factory,
  Cpu, TrendingUp, Truck, Wrench, Home, Layers, Phone,
  Calculator, CreditCard, FileText, Clock, Archive,
  Package, BellRing, Barcode, Hash, CheckSquare, Camera,
  UserCheck, Award, Megaphone, Gift, Link as LinkIcon, Star, BookOpen,
  Eye, GitMerge, Map, Target, Settings, Inbox, RefreshCcw,
  CalendarDays, DollarSign, Activity, Network, BarChart3,
  FileEdit, Receipt, Sliders, FileCheck, History, Repeat,
  CheckCircle, LineChart, Briefcase, Globe, ClipboardList,
  LayoutDashboard, BarChart2, Hourglass,
  Pill, ShoppingBag, UtensilsCrossed, Cog, Brain,
  ChevronDown, ChevronUp, ArrowLeft, Menu, X, Search, Download, Monitor
} from "lucide-react";

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
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);
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

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full m-0 p-0 min-h-screen overflow-x-hidden bg-slate-50 text-slate-900" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: '20px' }}>
      <style dangerouslySetInnerHTML={{__html: `
        html { font-size: 26px !important; }
        .tab-scroll::-webkit-scrollbar { height: 0; }
        .ind-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .ind-card:hover { transform: translateY(-5px); }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none} }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(79,70,229,0.4)} 50%{box-shadow:0 0 20px 6px rgba(79,70,229,0.2)} }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        .animate-pulse:hover { animation: none; }
        * { font-family: 'Noto Sans Arabic', sans-serif !important; }
      `}} />

      {/* NAV */}
      <nav className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-black text-slate-900">نما إنفست</span>
                <span className="text-xs text-indigo-500 font-bold block leading-none">Nama Invest ERP</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Links */}
          <div className="hidden md:flex gap-6 font-bold text-slate-600 text-sm">
            <a href="#industries" onClick={(e) => scrollToSection(e, 'industries')} className="hover:text-indigo-600 transition-colors">القطاعات</a>
            <a href="#clusters" onClick={(e) => scrollToSection(e, 'clusters')} className="hover:text-indigo-600 transition-colors">المجموعات</a>
            <a href="#modules" onClick={(e) => scrollToSection(e, 'modules')} className="hover:text-indigo-600 transition-colors">الـ 104 وحدة</a>
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors text-indigo-600 font-black">💎 الأسعار</Link>
          </div>

          {/* Action Buttons — Always visible */}
          <div className="flex gap-2 md:gap-3 items-center">
            <Link href="/sign-in" className="px-4 md:px-5 py-2 md:py-2.5 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-black rounded-xl transition-all duration-300 text-sm md:text-base">
              تسجيل الدخول
            </Link>
            <Link href="/sign-up" className="px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-300 text-sm md:text-base animate-pulse hover:animate-none">
              🚀 سجّل مجاناً
            </Link>
            <a href="https://wa.me/966531206628" target="_blank" rel="noopener noreferrer" className="hidden lg:flex px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all items-center gap-2">
              <Phone className="w-5 h-5" /> تواصل معنا
            </a>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="md:hidden flex items-center">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 hover:text-indigo-600 p-2">
               {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
             </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl fade-in flex flex-col p-4 gap-4">
            <a href="#industries" onClick={(e) => scrollToSection(e, 'industries')} className="font-bold text-slate-700 hover:text-indigo-600">القطاعات التي نخدمها</a>
            <a href="#clusters" onClick={(e) => scrollToSection(e, 'clusters')} className="font-bold text-slate-700 hover:text-indigo-600">المجموعات الخمس الاستراتيجية</a>
            <a href="#modules" onClick={(e) => scrollToSection(e, 'modules')} className="font-bold text-slate-700 hover:text-indigo-600">قائمة الـ 104 وحدة برمجية</a>
            <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-indigo-600 hover:text-indigo-700">💎 الباقات والأسعار</Link>
            <div className="h-px bg-slate-100 my-2"></div>
            <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-center py-2">تسجيل الدخول</Link>
            <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-center border border-indigo-600 text-indigo-600 font-bold rounded-xl">تسجيل حساب جديد</Link>
            <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-center bg-amber-500 text-white font-bold rounded-xl">💎 عرض الأسعار والباقات</Link>
            <a href="https://wa.me/966531206628" target="_blank" rel="noopener noreferrer" className="px-4 py-3 text-center bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
               <Phone className="w-5 h-5" /> تواصل معنا الآن
            </a>
          </div>
        )}
      </nav>

      <main>
      {/* HERO */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}/>
        <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl"/>
        <div className="absolute -bottom-40 left-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl"/>
        <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            🚀 نظام تشغيل الأعمال — متوافق 100% مع هيئة الزكاة (ZATCA Phase 2)
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">نما إنفست</span>
            <br/>
            <span className="text-3xl md:text-4xl font-bold text-slate-300">نظام واحد · لكل الأعمال</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto mb-3 leading-relaxed">
            NamaInvest — Comprehensive cloud ERP for Pharmacies, Grocery, Restaurants, Factories & Services. 104 integrated modules.
          </p>
          <p className="text-slate-400 text-base max-w-2xl mx-auto mb-10 leading-relaxed">
            من نقاط البيع والمخزون المتقدم إلى المحاسبة والموارد البشرية والذكاء الاصطناعي — كل ما تحتاجه في منصة سحابية واحدة.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {[
              { num: '104+', label: 'وحدة برمجية' },
              { num: '15', label: 'قطاع أعمال' },
              { num: '100%', label: 'متوافق ZATCA' },
              { num: '24/7', label: 'دعم فني' },
            ].map((s,i) => (
              <div key={s.label} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-6 py-4 text-center min-w-[110px]">
                <div className="text-3xl font-black text-white">{s.num}</div>
                <div className="text-xs text-slate-400 font-bold mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-4 w-full mt-4">
            <a href="/updates/desktop/NamaInvest-Setup-2.3.0.exe" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/40 transition-all text-lg min-w-[220px]">
              <Download size={20} /> 🚀 جرب النظام مجاناً
            </a>
            <a href="#download" onClick={(e) => scrollToSection(e, 'download')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/40 transition-all text-lg min-w-[220px]">
              <Download size={20} /> تحميل التطبيق
            </a>
            <Link href="/pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-amber-500/40 transition-all text-lg min-w-[220px]">
              💎 عرض الباقات والأسعار
            </Link>
          </div>
        </div>
      </section>

      {/* ── INDUSTRIES ───────────────────────────────────────────────────── */}
      <section id="industries" className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            🏪 القطاعات التي نخدمها — Industries We Serve
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-3">مهما كان نشاطك.. نما إنفست يناسبك</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            بنية وحداتية مرنة (Modular Architecture) تتكيف مع كل قطاع تجاري
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
          {INDUSTRIES.map(ind => (
            <div
              key={ind.id}
              className={`ind-card rounded-2xl border-2 p-5 cursor-pointer flex flex-col items-center text-center ${
                activeIndustry === ind.id
                  ? `${ind.bg} ${ind.border} shadow-xl`
                  : 'bg-white border-slate-200 hover:shadow-lg hover:border-slate-300'
              }`}
              onClick={() => setActiveIndustry(activeIndustry === ind.id ? null : ind.id)}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${ind.color} text-white shadow-md`}>
                {ind.icon}
              </div>
              <h3 className={`font-black text-base mb-0.5 ${activeIndustry === ind.id ? ind.text : 'text-slate-800'}`}>
                {ind.emoji} {ind.title}
              </h3>
              <p className="text-xs text-slate-400 font-bold mb-3">{ind.titleEn}</p>
              {activeIndustry === ind.id && (
                <div className="fade-in mt-2 pt-2 border-t border-slate-200 w-full flex flex-col items-center">
                  <ul className="space-y-1.5 mb-3 flex flex-col items-center text-center">
                    {ind.features.map((f, i) => (
                      <li key={f} className={`text-xs font-bold flex items-center justify-center gap-1.5 ${ind.text}`}>
                        <CheckCircle size={11} className="flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href={ind.url} 
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full max-w-[200px] mx-auto flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r ${ind.color}`}
                  >
                    اعرف أكثر <ArrowLeft size={11} />
                  </Link>
                </div>
              )}
              {activeIndustry !== ind.id && (
                <p className="text-xs text-slate-400 font-bold flex items-center justify-center gap-1 w-full mt-2">
                  اضغط لعرض المميزات <ChevronDown size={11} />
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── POWER CLUSTERS ───────────────────────────────────────────────── */}
      <section id="clusters" className="bg-slate-900 py-20 px-4">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12 flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              ⚡ مجموعات القوة الخمس — 5 Power Clusters
            </div>
            <h2 className="text-4xl font-black text-white mb-3 text-center">الـ 104 وحدة.. منظّمة بذكاء</h2>
            <p className="text-slate-400 text-lg text-center">Five strategic clusters covering every aspect of your business</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 justify-items-center w-full">
            {POWER_CLUSTERS.map((c, i) => (
              <div key={c.titleEn} className={`rounded-2xl overflow-hidden cursor-pointer transition-all w-full flex flex-col text-center ${expandedCluster===i?'ring-2 ring-white/30 scale-[1.02]':''}`}
                onClick={() => setExpandedCluster(expandedCluster===i ? null : i)}>
                <div className={`bg-gradient-to-br ${c.color} p-5 text-white flex flex-col items-center`}>
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="text-2xl font-black opacity-80">{c.count}</span>
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">{c.icon}</div>
                  </div>
                  <h3 className="font-black text-base leading-tight mb-0.5 text-center">{c.title}</h3>
                  <p className="text-xs opacity-75 font-bold text-center">{c.titleEn}</p>
                </div>
                <div className="bg-slate-800 p-4 w-full flex flex-col items-center">
                  <p className="text-slate-300 text-xs leading-relaxed mb-3 text-center w-full">{c.desc}</p>
                  {expandedCluster === i ? (
                    <div className="fade-in w-full flex flex-col items-center">
                      <ul className="space-y-1.5 mb-3 flex flex-col items-center text-center">
                        {c.highlights.map((h, j) => (
                          <li key={h} className="flex items-center justify-center gap-1.5 text-xs text-slate-200 font-bold">
                            <CheckCircle size={11} className="flex-shrink-0 text-emerald-400" /> {h}
                          </li>
                        ))}
                      </ul>
                      <span className="text-xs text-slate-400 flex items-center justify-center gap-1 font-bold w-full"><ChevronUp size={11}/> إخفاء</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center justify-center gap-1 font-bold hover:text-white transition-colors w-full"><ChevronDown size={11}/> عرض الميزات</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 104 MODULES ──────────────────────────────────────────────────── */}
      <section id="modules" className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            🗂️ الموسوعة الكاملة
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4">104 وحدة برمجية متكاملة</h2>
          
          {/* البحث الذكي الجديد */}
          <div className="relative max-w-md mx-auto mt-8 mb-12">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="ابحث عن ميزة، وحدة، أو وظيفة..." 
              className="w-full pr-12 pl-4 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="tab-scroll flex flex-wrap justify-center items-center gap-2 pb-3 mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab===cat.id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
              }`}>
              {cat.emoji} {cat.label} {activeTab===cat.id && `(${filteredModules.length})`}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center w-full">
                    {filteredModules.map((m) => (
            <div key={m.title} className="group bg-white w-full border border-slate-100 rounded-2xl p-4 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-50 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center text-indigo-600 group-hover:text-white mb-3 transition-all duration-300">{m.icon}</div>
              <h3 className="text-sm font-bold text-slate-800 mb-2 leading-tight group-hover:text-indigo-700 transition-colors">{m.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed text-center">{m.desc}</p>
            </div>
          ))}
        </div>
        
        {filteredModules.length === 0 && (
          <div className="text-center py-20 w-full">
            <p className="text-slate-400 font-bold">لا توجد نتائج تطابق بحثك 🔍</p>
          </div>
        )}
        <div className="text-center mt-8 text-slate-400 text-sm font-bold">
          عرض {filteredModules.length} من {modulesList.length} وحدة
        </div>
      </section>

      </main>

      {/* ── DOWNLOAD SECTION ───────────────────────────────────────────── */}
      <section id="download" className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            🖥️ نسخة سطح المكتب — Desktop Edition
          </div>
          <h2 className="text-4xl font-black mb-4">حمّل نما إنفست على جهازك</h2>
          <p className="text-slate-300 text-lg mb-2 max-w-2xl mx-auto">
            نسخة سطح المكتب تعمل بدون إنترنت مع قاعدة بيانات محلية — مثالية للمحلات والمطاعم
          </p>
          <p className="text-slate-400 text-sm mb-10">Windows 10/11 · 64-bit · تحديثات تلقائية</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: '🔒', title: 'أمان كامل', desc: 'بياناتك محلية على جهازك فقط' },
              { icon: '📡', title: 'يعمل أوفلاين', desc: 'لا حاجة للإنترنت أثناء العمل' },
              { icon: '🔄', title: 'تحديث تلقائي', desc: 'تحديثات فورية عند توفرها' },
            ].map(f => (
              <div key={f.title} className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-5 text-center">
                <div className="text-3xl mb-2">{f.icon}</div>
                <h3 className="font-black text-base mb-1">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
          <a
            href="/updates/desktop/NamaInvest-Setup-2.3.0.exe"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black rounded-2xl shadow-2xl shadow-emerald-500/40 transition-all text-xl"
          >
            <Download size={26} />
            تحميل NamaInvest v2.2.1
          </a>
          <p className="text-slate-500 text-xs mt-4">Windows 64-bit Installer · ~120MB</p>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-4xl font-black mb-4">جاهز لتحويل عملك رقمياً؟</h2>
          <p className="text-slate-300 text-lg mb-2 max-w-xl mx-auto">ابدأ اليوم مجاناً مع كامل الدعم الفني والتدريب</p>
          <p className="text-slate-400 text-sm mb-8">Ready to modernize your business? Start free with full support.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/pricing" className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-xl shadow-lg transition-all text-lg flex items-center gap-2">
              💎 شاهد الباقات والأسعار
            </Link>
            <a href="#download" onClick={(e: any) => { e.preventDefault(); document.getElementById('download')?.scrollIntoView({behavior:'smooth'}); }} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl shadow-lg transition-all text-lg flex items-center gap-2">
              <Download className="w-5 h-5"/> تحميل التطبيق
            </a>
            <a href="https://wa.me/966531206628" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all text-lg flex items-center gap-2">
              <Phone className="w-5 h-5"/> تواصل عبر واتساب
            </a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-12 bg-white border-t border-slate-200 text-center">
        <div className="max-w-7xl mx-auto w-full px-4 flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <Link href="/" className="flex flex-col items-center justify-center gap-2">
               <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg flex items-center justify-center">
                 <Layers className="w-6 h-6 text-white"/>
               </div>
               <div className="text-center">
                 <span className="font-black text-xl text-slate-800">نما إنفست</span>
                 <span className="text-xs text-slate-400 font-bold block leading-none mt-1">Nama Invest ERP</span>
               </div>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold">
            <Link href="/pharmacy" className="text-slate-400 hover:text-indigo-600 transition-colors">الصيدليات</Link>
            <Link href="/retail" className="text-slate-400 hover:text-indigo-600 transition-colors">التموينات</Link>
            <Link href="/restaurant" className="text-slate-400 hover:text-indigo-600 transition-colors">المطاعم</Link>
            <Link href="/factory" className="text-slate-400 hover:text-indigo-600 transition-colors">المصانع</Link>
            <Link href="/pricing" className="text-indigo-500 hover:text-indigo-700 transition-colors font-black">💎 الأسعار</Link>
            <Link href="/sign-up" className="text-slate-400 hover:text-indigo-600 transition-colors">سجّل مجاناً</Link>
          </div>
          <div className="text-slate-400 text-sm font-bold w-full text-center border-t border-slate-100 pt-6">© {new Date().getFullYear()} جميع الحقوق محفوظة لشركة نما إنفست</div>
        </div>
      </footer>
    </div>
  );
}
