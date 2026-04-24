import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, Factory, ArrowRight, BookOpen, Cpu, DollarSign, Layers, Activity, Package, GitMerge, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'نظام إدارة المصانع والتصنيع | نما إنفست – Manufacturing ERP System',
  description: 'نظام تخطيط موارد المصانع: قائمة المواد BOM، تتبع خطوط الإنتاج، حساب تكلفة التصنيع، MRP، وإدارة الهالك. Advanced manufacturing ERP for Saudi factories.',
  keywords: 'نظام مصنع, إدارة إنتاج, BOM, MRP, تكلفة تصنيع, manufacturing ERP, production management Saudi Arabia, factory management system, قائمة المواد',
};

const features = [
  { icon: <BookOpen size={20}/>, title: 'قائمة المواد (BOM)', desc: 'تحديد دقيق لكل مكونات المنتج بالكميات الدقيقة. تداخل BOM متعددة المستويات لمنتجات التجميع المعقدة.' },
  { icon: <Activity size={20}/>, title: 'تتبع مراحل الإنتاج', desc: 'مراقبة المنتج عبر كل مراحل التصنيع: المواد الخام، معالجة، تجميع، فحص، وتغليف – في الوقت الفعلي.' },
  { icon: <DollarSign size={20}/>, title: 'حساب تكلفة التصنيع', desc: 'التكلفة الحقيقية = مواد خام + عمالة مباشرة + تكاليف تشغيل. دقة متناهية لكل وحدة منتجة.' },
  { icon: <Cpu size={20}/>, title: 'تخطيط الموارد MRP', desc: 'حساب الاحتياج من المواد الخام آلياً بناءً على طلبات الإنتاج وتوليد طلبات الشراء تلقائياً.' },
  { icon: <Package size={20}/>, title: 'إدارة الهالك والمخلفات', desc: 'تتبع الكميات المفقودة في كل مرحلة إنتاج. تحليل معدل الهالك وتقارير التحسين المستمر.' },
  { icon: <GitMerge size={20}/>, title: 'التحويلات بين المستودعات', desc: 'حركة المواد الخام من المستودع للإنتاج وحركة المنتج التام للمستودع الرئيسي آلياً ومُحاسبياً.' },
  { icon: <Factory size={20}/>, title: 'أوامر التشغيل', desc: 'إصدار أمر تشغيل رقمي يحجز المواد الخام ويطلق عملية الإنتاج مع تتبع كامل لحالة التنفيذ.' },
  { icon: <BarChart3 size={20}/>, title: 'تقارير الكفاءة الإنتاجية', desc: 'كفاءة خط الإنتاج، معدل العيوب، تكلفة الوحدة، وتحليل الفجوة بين المخطط والفعلي.' },
];

export default function FactoryPage() {
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

      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            🏭 المصانع والإنتاج – Manufacturing & Factory Solutions
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            حوّل مصنعك إلى منظومة
            <br/>
            <span className="text-blue-300 text-3xl md:text-4xl">رقمية فائقة الكفاءة</span>
          </h1>
          <p className="text-blue-100 text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
            Advanced Industrial ERP. Bill of Materials (BOM), production stage tracking, and precision costing for manufacturing plants.
          </p>
          <p className="text-slate-300 text-base mb-10 max-w-2xl mx-auto">
            من المادة الخام إلى المنتج النهائي – تتبع كل مرحلة في خط الإنتاج واحسب تكاليفك بدقة متناهية.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/966531206628" target="_blank" className="px-7 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
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
          <h2 className="text-3xl font-black text-slate-900 mb-3">ميزات مصممة للمصانع والإنتاج</h2>
          <p className="text-slate-500 text-lg">From raw materials to finished goods – full manufacturing lifecycle management</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">{f.icon}</div>
              <h3 className="font-black text-slate-800 mb-2 text-sm">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* JSON-LD for Manufacturing */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "NamaInvest Manufacturing ERP",
          "applicationCategory": "BusinessApplication / Manufacturing ERP",
          "description": "Advanced manufacturing ERP with BOM, MRP, production tracking and cost calculation for Saudi factories.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "SAR" }
        })}} />
      </div>

      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-black mb-4">جاهز لتطوير مصنعك؟</h2>
        <p className="text-blue-200 mb-8">تواصل معنا للحصول على عرض توضيحي مجاني</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://wa.me/966531206628" target="_blank" className="px-8 py-4 bg-white text-blue-800 font-black rounded-xl hover:bg-blue-50 flex items-center gap-2 transition-all">
            <Phone size={18}/> تواصل عبر واتساب
          </a>
          <Link href="/" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
            العودة للرئيسية
          </Link>
        </div>
      </div>
      <footer className="py-6 bg-slate-900 text-center text-slate-400 text-sm font-bold">
        © {new Date().getFullYear()} نما إنفست – Manufacturing ERP | <Link href="/" className="hover:text-white">namainvist.com</Link>
      </footer>
    </div>
  );
}
