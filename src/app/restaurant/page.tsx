import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, UtensilsCrossed, ArrowRight, LayoutDashboard, Monitor, FileText, Layers, Clock, RefreshCcw, MessageCircle, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'نظام إدارة المطاعم والكافيهات | نما إنفست – Restaurant POS System',
  description: 'نظام متكامل لإدارة المطاعم والكافيهات: خريطة الطاولات، شاشة المطبخ الرقمية KDS، المنيو الإلكتروني، وإدارة التوصيل. Best restaurant management system in Saudi Arabia.',
  keywords: 'نظام مطعم, برنامج كافيه, إدارة مطاعم, POS مطعم, شاشة مطبخ KDS, restaurant management system, cafe POS Saudi Arabia, food delivery integration',
};

const features = [
  { icon: <LayoutDashboard size={20}/>, title: 'خريطة الطاولات التفاعلية', desc: 'عرض بصري لحالة كل طاولة (مشغولة/فارغة/قيد الدفع). تحريك الطلب بين الطاولات بسحب وإفلات.' },
  { icon: <Monitor size={20}/>, title: 'شاشة المطبخ الرقمية KDS', desc: 'يصل الطلب للشيف في ثوانٍ بدون ورق. عرض أولوية الطلبات وزمن الإعداد على شاشة المطبخ.' },
  { icon: <FileText size={20}/>, title: 'المنيو الإلكتروني اللحظي', desc: 'تحديث الأسعار والأصناف والصور لحظياً على جميع نقاط البيع دون الحاجة لإعادة التشغيل.' },
  { icon: <RefreshCcw size={20}/>, title: 'تعديلات الطلبات (Modifiers)', desc: 'إضافات وإزالات مرنة: "بدون بصل، زبدة إضافية، حار"، مع ربط كل تعديل بوصفة التصنيع.' },
  { icon: <Clock size={20}/>, title: 'إدارة الورديات والإغلاق', desc: 'حساب دقيق لمبيعات كل نادل لكل وردية. تقرير إغلاق وردية مالي شامل في ثوانٍ.' },
  { icon: <UtensilsCrossed size={20}/>, title: 'إدارة الوصفات والتكلفة', desc: 'كل صنف في المنيو مرتبط بوصفة تحسب التكلفة الحقيقية (BOM). سحب تلقائي من المخزون.' },
  { icon: <MessageCircle size={20}/>, title: 'دعم التوصيل وواتساب', desc: 'استقبال طلبات التوصيل مع تأكيد تلقائي عبر واتساب وتتبع حالة الطلب للعميل.' },
  { icon: <BarChart3 size={20}/>, title: 'تقارير الأداء التفصيلية', desc: 'أكثر الأصناف مبيعاً، ساعات الذروة، متوسط الفاتورة، وأداء كل موظف بشكل منفصل.' },
];

export default function RestaurantPage() {
  return (
    <div className="min-h-screen" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', sans-serif", background: '#F8FAFC' }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto Sans Arabic:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg flex items-center justify-center"><Layers className="w-4 h-4 text-white"/></div>
            <span className="font-black text-slate-900">نما إنفست</span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-600"><ArrowRight size={14}/> الرئيسية</Link>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-rose-900 via-pink-900 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-400/30 text-rose-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            🍽️ المطاعم والكافيهات – Restaurant & Cafe Solutions
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            نظّم مطعمك بذكاء
            <br/>
            <span className="text-rose-300 text-3xl md:text-4xl">من الطلب حتى التقديم</span>
          </h1>
          <p className="text-rose-100 text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
            Next-Gen Restaurant Management. Table mapping, Digital Kitchen Display (KDS), and seamless order workflows.
          </p>
          <p className="text-slate-300 text-base mb-10 max-w-2xl mx-auto">
            تخلص من فوضى الطلبات الورقية. نظام نما إنفست ينظم طاولاتك، يسرع مطبخك، ويزيد من رضا عملائك.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/966531206628" target="_blank" className="px-7 py-3.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
              <Phone size={18}/> طلب عرض توضيحي
            </a>
            <Link href="/#modules" className="px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
              استعرض جميع الميزات
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-3">ميزات مصممة لنجاح مطعمك</h2>
          <p className="text-slate-500 text-lg">Everything from table management to kitchen operations and delivery</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-rose-200 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mb-4">{f.icon}</div>
              <h3 className="font-black text-slate-800 mb-2 text-sm">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-rose-900 to-pink-900 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-black mb-4">جاهز لتطوير مطعمك؟</h2>
        <p className="text-rose-200 mb-8">تواصل معنا للحصول على عرض توضيحي مجاني</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://wa.me/966531206628" target="_blank" className="px-8 py-4 bg-white text-rose-800 font-black rounded-xl hover:bg-rose-50 flex items-center gap-2 transition-all">
            <Phone size={18}/> تواصل عبر واتساب
          </a>
          <Link href="/" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
            العودة للرئيسية
          </Link>
        </div>
      </div>
      <footer className="py-6 bg-slate-900 text-center text-slate-400 text-sm font-bold">
        © {new Date().getFullYear()} نما إنفست – Restaurant & Cafe ERP | <Link href="/" className="hover:text-white">namainvist.com</Link>
      </footer>
    </div>
  );
}
