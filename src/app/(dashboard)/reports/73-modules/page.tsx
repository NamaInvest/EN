'use client';

import React, { useState } from 'react';
import { useTranslation } from "@/lib/i18n";
import { 
  Building2, Box, Calculator, Users, Shield, Globe, 
  Activity, ShoppingCart, Zap, CreditCard, LayoutDashboard, Database, HardDrive, Smartphone,
  X, BarChart3, TrendingUp, Cpu, Network
} from 'lucide-react';

const MODULES_DATA = [
  // Financial
  { id: 1, title: 'الحسابات العامة (Accounting)', cat: 'finance', desc: 'قيود يومية و دفتر أستاذ متوافق مع المعايير الدولية.' },
  { id: 2, title: 'المالية والتحليل (Finance)', cat: 'finance', desc: 'قوائم دخل وميزانيات عمومية فورية.' },
  { id: 3, title: 'الخزينة والبنوك (Treasury)', cat: 'finance', desc: 'إدارة وتوجيه التدفقات النقدية والمطابقة.' },
  { id: 4, title: 'المصروفات (Expenses)', cat: 'finance', desc: 'تصفية العهد والنثريات وإدارتها بالصور.' },
  { id: 5, title: 'سندات القبض والدفع', cat: 'finance', desc: 'دورة نقدية متكاملة לסلف والمصروفات.' },
  { id: 6, title: 'بطاقات التمويل (Installments)', cat: 'finance', desc: 'تقسيط مرن مع تتبع الفوائد للعملاء.' },
  { id: 7, title: 'الأصول الثابتة (Fixed Assets)', cat: 'finance', desc: 'إهلاك ذكي للأصول واحتساب قيمتها الدفترية.' },
  { id: 8, title: 'ضريبة عالمية (Universal Tax)', cat: 'finance', desc: 'دعم ZATCA و GST و VAT لأي دولة.' },
  { id: 9, title: 'تعدد العملات الآني', cat: 'finance', desc: 'ربط أسعار الصرف الحية للعملات العالمية.' },
  { id: 10, title: 'الاعتمادات المستندية (L/C)', cat: 'finance', desc: 'أتمتة الاستيراد والشحن الجمركي من الخارج.' },

  // AI Core
  { id: 11, title: 'المدير المالي الذكي (AI-CFO)', cat: 'ai', desc: 'توليد تقارير مالية وصفية بناء على البيانات.' },
  { id: 12, title: 'سلاسل الإمداد الذكية (AI-SCM)', cat: 'ai', desc: 'توقع نفاذ المخزون المستقبلي.' },
  { id: 13, title: 'البنك الذكي (OCR AutoBank)', cat: 'ai', desc: 'مطابقة الكشوفات البنكية آلياً.' },
  { id: 14, title: 'شات النظام (AI-Copilot)', cat: 'ai', desc: 'طلب تقارير من الكاشير بالمحادثة النصية.' },
  { id: 15, title: 'مراقبة التلاعب (AI Fraud)', cat: 'ai', desc: 'عين الصقر لاكتشاف السرقات والاختلاسات.' },
  { id: 16, title: 'تسعير حيوي (Dynamic Pricing)', cat: 'ai', desc: 'زيادة الأسعار حسب العرض والطلب.' },
  { id: 17, title: 'الماكينة القارئة (OCR Hub)', cat: 'ai', desc: 'إدخال الفواتير وجوازات السفر عبر الصور.' },

  // Sales & Trade
  { id: 18, title: 'إدارة المنتجات العالمية', cat: 'sales', desc: 'ألوان ومقاسات ووحدات مزدوجة للمنتج.' },
  { id: 19, title: 'الكاشير الجبار (POS offline)', cat: 'sales', desc: 'كاشير يعمل بدون إنترنت مع مزامنة ذاتية.' },
  { id: 20, title: 'المبيعات اللوجستية', cat: 'sales', desc: 'فواتير آجلة للتصدير والتوريد الدولي.' },
  { id: 21, title: 'مشتريات المصانع', cat: 'sales', desc: 'إدارة طلبات الموردين الدوليين.' },
  { id: 22, title: 'مرتجعات المبيعات', cat: 'sales', desc: 'تسوية وإشعارات دائنة ضريبياً.' },
  { id: 23, title: 'مرتجعات المشتريات', cat: 'sales', desc: 'إرجاع وتأثير مباشر على حساب المورد.' },
  { id: 24, title: 'عروض أسعار (Estimates)', cat: 'sales', desc: 'عروض PDF للعملاء بتصاميم متعددة.' },
  { id: 25, title: 'أوامر شراء دقيقة', cat: 'sales', desc: 'دورة اعتماد وموافقة الطلبيات.' },
  { id: 26, title: 'الفوترة التلقائية المنتظمة', cat: 'sales', desc: 'توليد فاتورة اشتراك كل بداية شهر.' },
  { id: 27, title: 'ربط المتاجر (E-Com Sync)', cat: 'sales', desc: 'سلة، زد، وشوبيفاي في مخزون واحد.' },
  { id: 28, title: 'بوابة الجملة (B2B Portal)', cat: 'sales', desc: 'منصة تسوق خاصة لوكلائك.' },
  { id: 29, title: 'نظام مناقصات (Procurement)', cat: 'sales', desc: 'طرح مناقصات لشراء أصول الشركة.' },
  { id: 30, title: 'الكونسايمنت (Consignment)', cat: 'sales', desc: 'بيع بضاعة الأمانة عند الموزعين.' },

  // Warehouses
  { id: 31, title: 'مستودعات شجرية', cat: 'stock', desc: 'عناوين رفوف وصناديق لتصدير البضائع.' },
  { id: 32, title: 'المخزون المتطور (WMS Base)', cat: 'stock', desc: 'متوسط تكلفة أو وارد أولاً (FIFO).' },
  { id: 33, title: 'مناقلات الفروع', cat: 'stock', desc: 'تحويلات داخلية ومخزون تحت النقل.' },
  { id: 34, title: 'التوريد المتوازن الذكي', cat: 'stock', desc: 'نقل مخزون راكد לفرع نشط لمنع لخسارة.' },
  { id: 35, title: 'جرد أعمى بالباركود', cat: 'stock', desc: 'مطابقة عبر الجوال مع الكاميرا المخفية.' },
  { id: 36, title: 'بيل أوف ماتيريال (BOM)', cat: 'stock', desc: 'إنتاج مواد بناءً على وصفة ووحدات.' },
  { id: 37, title: 'تواريخ الانتهاء والطبخ', cat: 'stock', desc: 'تتبع السلع والأدوية لمنع بيع المنتهي.' },
  { id: 38, title: 'مولد باركود متطور', cat: 'stock', desc: 'طباعة ستيكرات باركود للرفوف دولياً.' },
  { id: 39, title: 'صيانات وأوامر الشغل', cat: 'stock', desc: 'جدولة ميكانيكية وإصلاح الأصول.' },
  { id: 40, title: 'توجيه الرافعات WMS', cat: 'stock', desc: 'تحديد الرفوف للرافعة الشوكية تلقائياً.' },

  // HR
  { id: 41, title: 'شؤون الموظفين (Core HR)', cat: 'hr', desc: 'ملف الموظف الكامل والمكافآت.' },
  { id: 42, title: 'الرواتب والأجور العالمية', cat: 'hr', desc: 'مسيرات بنكية (WPS) ومعادلات للخصومات.' },
  { id: 43, title: 'بصمة وحضور حي', cat: 'hr', desc: 'ارتباط مباشر ببصمة الوجه والكاميرات.' },
  { id: 44, title: 'الإجازات والانقطاعات', cat: 'hr', desc: 'دورة حياة إجازة الموظف وتصفيتها.' },
  { id: 45, title: 'ورديات وشفتات وتقاطعها', cat: 'hr', desc: 'أوفر تايم ومناوبات المستشفيات والبيع.' },
  { id: 46, title: 'الخدمة الذاتية التطبيقية', cat: 'hr', desc: 'بوابة موظف يطلب منها سلفه من جواله.' },
  { id: 47, title: 'المهام (Task Boards)', cat: 'hr', desc: 'كانبان بورد للموظفين وتوزيع أعمالهم.' },
  { id: 48, title: 'تقييم الأداء والمؤشرات', cat: 'hr', desc: 'تارقت المطور والمندوب والمحاسب.' },
  { id: 49, title: 'محرك العمولات البيعي', cat: 'hr', desc: 'نسب تلقائية بحسب مبيعات كل بائع شهرياً.' },
  { id: 50, title: 'أرشفة الوثائق السرية', cat: 'hr', desc: 'منع سرقة ومشاركة وثائق الشركة الحساسة.' },

  // Logistics & Retail CRM
  { id: 51, title: 'قاعدة العملاء الكبرى', cat: 'logistics', desc: 'بيانات، حدود ائتمان، وولاء أبد الآبدين.' },
  { id: 52, title: 'نظام الـ CRM للاتصالات', cat: 'logistics', desc: 'استقطاب العملاء وتتبع شكاويهم بفاعلية.' },
  { id: 53, title: 'الكوبونات (Coupons)', cat: 'logistics', desc: 'توزيع كود خصم لمشاهير السوشال ميديا.' },
  { id: 54, title: 'الولاء والنقاط (Cashback)', cat: 'logistics', desc: 'استرجاع نقدي للعميل في محفظته ليعود.' },
  { id: 55, title: 'تخفيضات أوتوماتيكية', cat: 'logistics', desc: 'اشتر حبة وتأخذ الثانية بنص السعر.' },
  { id: 56, title: 'بطاقات الهدايا والشحن', cat: 'logistics', desc: 'شحن رصيد وإهداء للأسواق الضخمة.' },
  { id: 57, title: 'نظام المسوقين (Affiliates)', cat: 'logistics', desc: 'دفع نسبة للمسوق عبر روابط التخفيض.' },
  { id: 58, title: 'تذاكر الدعم السحابي', cat: 'logistics', desc: 'مركز تذاكر دعم فني لعملائك الكبار.' },
  { id: 59, title: 'واتساب بوت التسويقي', cat: 'logistics', desc: 'إرسال فواتير و تنبيهات عبر واتساب حصري.' },
  { id: 60, title: 'إدارة أسطول المركبات', cat: 'logistics', desc: 'استهلاك بنزين، صيانة شاحنات، وسجل السائق.' },
  { id: 61, title: 'بوليصات شركة الشحن', cat: 'logistics', desc: 'ارتباط Aramex وإصدار البوليصة لحظياً.' },
  { id: 62, title: 'تتبع جي بي إس (GPS live)', cat: 'logistics', desc: 'تتبع خرائطي لشحنات المؤسسة ومسارها.' },
  { id: 63, title: 'طاولات الفنادق والضيافة', cat: 'logistics', desc: 'توزع الطاولات وغرف الفنادق لقطاع المطاعم.' },

  // Admin
  { id: 64, title: 'الداشبورد المجمعة (KPI)', cat: 'admin', desc: 'لوحة قيادة بانورامية للإدارة التنفيذية.' },
  { id: 65, title: 'شجرة الفروع الكبرى', cat: 'admin', desc: 'فصل الميزانيات، وتوزيعها لمراكز التكلفة.' },
  { id: 66, title: 'الشركات المتعددة القابضة', cat: 'admin', desc: 'أكثر من شركة في لوحة واحدة.' },
  { id: 67, title: 'محرك التقارير اللامحدود', cat: 'admin', desc: 'رسوم بيانية و PDF مع تصدير ديناميكي.' },
  { id: 68, title: 'التدقيق اللحظي (Audit)', cat: 'admin', desc: 'سجل حركات خفي "من حذف، من أضاف".' },
  { id: 69, title: 'صلاحيات جوهرية (RBAC)', cat: 'admin', desc: 'تحديد دقيق (من يرى ماذا وبأي شاشة).' },
  { id: 70, title: 'الإعدادات العامة والسياسات', cat: 'admin', desc: 'ألوان، ثيمات، وإعدادات الطابعات المتعددة.' },
  { id: 71, title: 'بوابة المطورين (APIs)', cat: 'admin', desc: 'Webhooks للمبرمجين לلربط مع أي منصة.' },
  { id: 72, title: 'معمل ذكاء الأعمال (BI Studio)', cat: 'admin', desc: 'سحب وإسقاط לصنع تقرير خاص بك تماماً.' },
  { id: 73, title: 'صيانة التشغيل والطوارئ', cat: 'admin', desc: 'نسخ احتياطي سحابي واستقبال الباتشات.' },
];

export default function Epic73ModulesDashboard() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedMod, setSelectedMod] = useState<any>(null);

  const filters = [
    { id: 'all', name: 'الجميع 🌍' },
    { id: 'finance', name: 'المالية والضرائب 💰' },
    { id: 'ai', name: 'الذكاء الاصطناعي 🧠' },
    { id: 'sales', name: 'سلسلة التوريد و التجارة 🛒' },
    { id: 'stock', name: 'المخازن والأصول 🏭' },
    { id: 'hr', name: 'الموارد البشرية 👥' },
    { id: 'logistics', name: 'اللوجستيات وعلاقات العملاء 🤝' },
    { id: 'admin', name: 'الإدارة والتأسيس 🔒' },
  ];

  const filteredModules = activeFilter === 'all' ? MODULES_DATA : MODULES_DATA.filter(m => m.cat === activeFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl" style={{ fontFamily: 'system-ui' }}>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-indigo-900 to-blue-900 rounded-3xl p-8 text-white shadow-xl mb-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="inline-block bg-blue-500/30 px-3 py-1 rounded-full text-blue-200 text-sm font-bold border border-blue-400/30 mb-4 whitespace-nowrap">تقرير هيكلة الأنظمة العالمية</div>
              <h1 className="text-3xl md:text-5xl font-black mb-4">الأقسام الـ 73 لنظامك (The Global 73)</h1>
              <p className="text-blue-200 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">بنية هندسية تضع Nama Invest في قمة أنظمة الـ ERP العالمية، توفر تكاملاً حقيقياً بين طقم الموارد البشرية والمخازن والذكاء الاصطناعي في بيئة عمل لا تقهر.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center flex-shrink-0">
               <div className="text-sm text-blue-200 mb-1 font-bold">قوة المعالجة المركزية لـ</div>
               <div className="text-5xl font-black text-white">73</div>
               <div className="text-lg font-bold text-blue-300">نظاماً فرعياً مدمجاً</div>
            </div>
         </div>
      </div>

      {/* Filter Toggles */}
      <div className="flex flex-wrap gap-3 mb-8">
         {filters.map(f => (
            <button 
              key={f.id} 
              onClick={() => setActiveFilter(f.id)}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all ${activeFilter === f.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              {f.name}
            </button>
         ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
         {filteredModules.map((mod, idx) => (
             <div 
                key={mod.id} 
                onClick={() => setSelectedMod(mod)}
                className="bg-white cursor-pointer rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                style={{ animationDelay: `${idx * 0.02}s`, animationFillMode: 'both' }}
             >
                <div className="flex justify-between items-start mb-4">
                   <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-50 group-hover:scale-110 transition-transform">
                      {mod.cat === 'finance' ? <Calculator /> : 
                       mod.cat === 'ai' ? <Zap className="text-yellow-500" /> : 
                       mod.cat === 'sales' ? <ShoppingCart /> : 
                       mod.cat === 'stock' ? <Box /> : 
                       mod.cat === 'hr' ? <Users /> : 
                       mod.cat === 'admin' ? <LayoutDashboard /> : <Globe />}
                   </div>
                   <div className="text-xs font-black text-slate-300 group-hover:text-blue-200">
                     MOD-{mod.id.toString().padStart(2, '0')}
                   </div>
                </div>
                
                <h3 className="font-bold text-lg text-slate-800 mb-2 leading-snug group-hover:text-blue-600">{mod.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4 flex-1">{mod.desc}</p>
                
                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> جاهز للعمل العالمي
                </div>
             </div>
         ))}
      </div>
      
      {/* Detailed Modal Report */}
      {selectedMod && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 sm:p-8 flex items-start justify-between text-white relative overflow-hidden">
               <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-2 text-blue-200">
                    <Cpu className="w-5 h-5" />
                    <span className="font-bold text-sm tracking-widest uppercase">Global Module Architecture</span>
                 </div>
                 <h2 className="text-2xl sm:text-4xl font-black">{selectedMod.title}</h2>
                 <p className="mt-3 text-blue-100 leading-relaxed max-w-2xl text-sm sm:text-base opacity-90">{selectedMod.desc}</p>
               </div>
               <button 
                 onClick={() => setSelectedMod(null)} 
                 className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors relative z-10"
               >
                 <X className="w-6 h-6" />
               </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto" dir="rtl">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Performance Indicators */}
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800">
                       <TrendingUp className="w-6 h-6 text-emerald-500" />
                       مؤشرات الأداء اللحظية (KPIs)
                    </h3>
                    <div className="space-y-4">
                       <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center">
                          <span className="font-semibold text-slate-600">كفاءة معالجة البيانات</span>
                          <span className="bg-emerald-100 text-emerald-700 font-black px-3 py-1 rounded-lg text-sm">99.8%</span>
                       </div>
                       <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center">
                          <span className="font-semibold text-slate-600">اعتمادية الذكاء الاصطناعي</span>
                          <span className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-lg text-sm">متصل وفعّال</span>
                       </div>
                       <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center">
                          <span className="font-semibold text-slate-600">زمن الاستجابة للتقارير</span>
                          <span className="bg-purple-100 text-purple-700 font-black px-3 py-1 rounded-lg text-sm">&lt; 0.2 ثانية</span>
                       </div>
                    </div>
                  </div>

                  {/* Tech Specs */}
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800">
                       <Network className="w-6 h-6 text-indigo-500" />
                       التكامل العالمي (Global Integration)
                    </h3>
                    <ul className="space-y-3">
                       <li className="flex items-start gap-3 text-slate-600">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5"><div className="w-2 h-2 rounded-full bg-emerald-600"></div></div>
                          <span className="font-medium text-sm leading-relaxed">متوافق مع المعايير الضريبية العالمية (MTC, ZATCA, GST).</span>
                       </li>
                       <li className="flex items-start gap-3 text-slate-600">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5"><div className="w-2 h-2 rounded-full bg-emerald-600"></div></div>
                          <span className="font-medium text-sm leading-relaxed">يعمل في بيئة حوسبة سحابية (Cloud-native) بـ 10 سيرفرات متزامنة.</span>
                       </li>
                       <li className="flex items-start gap-3 text-slate-600">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5"><div className="w-2 h-2 rounded-full bg-emerald-600"></div></div>
                          <span className="font-medium text-sm leading-relaxed">يدعم تعدد وتصريف العملات اللحظي (Multi-Currency API).</span>
                       </li>
                       <li className="flex items-start gap-3 text-slate-600">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5"><div className="w-2 h-2 rounded-full bg-emerald-600"></div></div>
                          <span className="font-medium text-sm leading-relaxed">موجه بشكل ذكي بواسطة (AI Engine) للتنبؤ المالي.</span>
                       </li>
                    </ul>
                  </div>

               </div>
               
               <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6">
                 <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                   <BarChart3 className="w-5 h-5 text-blue-600" />
                   التقرير التشغيلي للقسم
                 </h4>
                 <p className="text-blue-800/80 text-sm font-medium leading-loose">
                   هذا القسم البرمجي تم تصميمه كنواة مستقلة ضمن معمارية الـ Monolith الخاصة بالنظام، مما يجعله قادراً على العمل بمرونة فائقة وتخزين بياناته المحللة ضمن خوادم قواعد البيانات الضخمة (Prisma-Postgres).
                   إضافة إلى ذلك، يعمل هذا الجزء التشغيلي بدون الحاجة لمعالجة خارجية، ويغذي الداشبورد الرئيسية للإدارة العليا بأدق التفاصيل والرسوم البيانية المباشرة عبر واجهات React Server Components الحديثة جداً.
                 </p>
               </div>
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-slate-100 p-4 sm:px-8 bg-slate-50 flex justify-end">
               <button 
                 onClick={() => setSelectedMod(null)}
                 className="bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
               >
                 إغلاق التقرير المتقدم
               </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
