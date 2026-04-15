import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, ShoppingBag, ArrowRight, Award, BellRing, Barcode, Scale, Tag, Layers, LayoutDashboard } from 'lucide-react';

export const metadata: Metadata = {
  title: 'نظام إدارة التموينات والحلويات | نما إنفست — Grocery & Retail ERP',
  description: 'نظام متكامل للتموينات والحلويات ومحلات البقالة: إدارة آلاف الأصناف، الموازين الإلكترونية، نقاط الولاء، والباركود. Best grocery retail management software in Saudi Arabia.',
  keywords: 'نظام تموينات, برنامج بقالة, نظام حلويات, إدارة محل, POS تموينات, grocery management system, retail ERP Saudi Arabia, barcode system',
};

const features = [
  { icon: <LayoutDashboard size={20}/>, title: 'إدارة آلاف الأصناف', desc: 'معالجة 120 صنفاً في الدقيقة بدقة كاملة. هيكلة هرمية للأصناف: فئة، مجموعة، وصنف فرعي.' },
  { icon: <Scale size={20}/>, title: 'ربط الموازين الإلكترونية', desc: 'تكامل مباشر مع الموازين لبيع المنتجات بالوزن (كيلو/جرام) مع احتساب السعر تلقائياً.' },
  { icon: <Award size={20}/>, title: 'نظام الولاء والخصومات', desc: 'نقاط ولاء تلقائية لكل عملية شراء، عروض "اشتري 2 واحصل على 1"، وكوبونات خصم حصرية.' },
  { icon: <BellRing size={20}/>, title: 'تنبيهات النقص الذكية', desc: 'رادار ذكي يراقب المخزون لحظياً ويُنبّه فور اقتراب أي صنف من الحد الأدنى.' },
  { icon: <Barcode size={20}/>, title: 'باركود الميزان المتقدم', desc: 'دعم كامل للباركود المتغير (Variable Weight Barcode) الخاص بمنتجات اللحوم والجبن والحلويات.' },
  { icon: <Tag size={20}/>, title: 'طباعة الملصقات الجماعية', desc: 'طباعة ملصقات أسعار وباركود جماعية بتنسيقات EAN/QR/Code128 لمئات الأصناف دفعة واحدة.' },
  { icon: <ShoppingBag size={20}/>, title: 'جرد سريع وآلي', desc: 'دورة جرد متكاملة: تخطيط، تعداد بالكاميرا أو الباركود، واكتشاف الفوارق فوراً.' },
  { icon: <CheckCircle size={20}/>, title: 'تقارير المبيعات اليومية', desc: 'تقرير يومي تفصيلي: أكثر الأصناف مبيعاً، هامش الربح، ومقارنة الأداء الأسبوعي.' },
];

export default function RetailPage() {
  return (
    <div className="min-h-screen" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif", background: '#F8FAFC' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg flex items-center justify-center"><Layers className="w-4 h-4 text-white"/></div>
            <span className="font-black text-slate-900">نما إنفست</span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-600"><ArrowRight size={14}/> الرئيسية</Link>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            🛒 التموينات والحلويات — Grocery & Sweets
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            تحكم في آلاف الأصناف
            <br/>
            <span className="text-amber-300 text-3xl md:text-4xl">بضغطة زر واحدة</span>
          </h1>
          <p className="text-amber-100 text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
            Smart Retail & Grocery Solutions. High-volume inventory tracking, loyalty programs, and seamless POS.
          </p>
          <p className="text-slate-300 text-base mb-10 max-w-2xl mx-auto">
            سواء كنت تدير سوبر ماركت ضخم أو محل حلويات فاخر، نظامنا يضمن لك جرداً لحظياً ومبيعات لا تتوقف.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/966531206628" target="_blank" className="px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
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
          <h2 className="text-3xl font-black text-slate-900 mb-3">ميزات مصممة لتجارة التجزئة</h2>
          <p className="text-slate-500 text-lg">Everything you need to run a modern grocery or sweets store</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-amber-200 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4">{f.icon}</div>
              <h3 className="font-black text-slate-800 mb-2 text-sm">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-900 to-orange-900 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-black mb-4">جاهز لتطوير متجرك؟</h2>
        <p className="text-amber-200 mb-8">تواصل معنا للحصول على عرض توضيحي مجاني</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://wa.me/966531206628" target="_blank" className="px-8 py-4 bg-white text-amber-800 font-black rounded-xl hover:bg-amber-50 flex items-center gap-2 transition-all">
            <Phone size={18}/> تواصل عبر واتساب
          </a>
          <Link href="/" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
            العودة للرئيسية
          </Link>
        </div>
      </div>
      <footer className="py-6 bg-slate-900 text-center text-slate-400 text-sm font-bold">
        © {new Date().getFullYear()} نما إنفست — Grocery & Retail ERP | <Link href="/" className="hover:text-white">namainvist.com</Link>
      </footer>
    </div>
  );
}
