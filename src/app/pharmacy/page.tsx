import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, Pill, ArrowRight, ShieldCheck, Hourglass, Hash, Barcode, FileText, BarChart3, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'نظام إدارة الصيدليات | نما إنفست – Pharmacy Management System',
  description: 'نظام متكامل لإدارة الصيدليات: تتبع تواريخ الصلاحية (FEFO)، منع بيع الدواء المنتهي، إدارة البدائل الطبية، والأرقام التسلسلية. The most advanced pharmacy ERP in Saudi Arabia.',
  keywords: 'نظام صيدلية, برنامج صيدلية, إدارة أدوية, تواريخ انتهاء الصلاحية, FEFO, pharmacy management system, Saudi Arabia pharmacy software',
};

const features = [
  { icon: <Hourglass size={20}/>, title: 'تتبع تواريخ الصلاحية FEFO', desc: 'يستحيل برمجياً تمرير فاتورة بدواء منتهي الصلاحية. النظام يطبق First-Expired-First-Out تلقائياً.' },
  { icon: <ShieldCheck size={20}/>, title: 'منع بيع الأدوية المنتهية', desc: 'حماية طبقية كاملة من الكاشير لمنع أي منتج منتهي الصلاحية من الوصول للعميل.' },
  { icon: <Pill size={20}/>, title: 'إدارة البدائل الطبية', desc: 'قاعدة بيانات البدائل العلمية. يقترح الكاشير البديل فوراً عند نفاد الدواء الأصلي.' },
  { icon: <Hash size={20}/>, title: 'الأرقام التسلسلية للأدوية', desc: 'تتبع كل وحدة دواء من المورد إلى العميل عبر Serial Number فريد – حماية ضد التزوير.' },
  { icon: <Barcode size={20}/>, title: 'باركود سريع ودقيق', desc: 'مسح الباركود خلال 0.3 ثانية مع عرض معلومات الدواء كاملة: السعر، الصلاحية، والمخزون.' },
  { icon: <BarChart3 size={20}/>, title: 'تقارير مخزون دوائية', desc: 'تقارير متخصصة: الأدوية على وشك الانتهاء، الأكثر مبيعاً، هامش الربح لكل صنف، ومعدل الدوران.' },
  { icon: <FileText size={20}/>, title: 'فاتورة ZATCA إلكترونية', desc: 'إصدار الفواتير الإلكترونية المتوافقة مع المرحلة الثانية لهيئة الزكاة والضريبة والجمارك.' },
  { icon: <CheckCircle size={20}/>, title: 'جرد دوري ذكي', desc: 'دورة جرد متكاملة مع الكشف التلقائي عن الفوارق وإصدار قيود التسوية المحاسبية.' },
];

export default function PharmacyPage() {
  return (
    <div className="min-h-screen" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', sans-serif", background: '#F8FAFC' }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto Sans Arabic:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white"/>
            </div>
            <span className="font-black text-slate-900">نما إنفست</span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-600">
            <ArrowRight size={14}/> الرئيسية
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            💊 حلول متخصصة للصيدليات – Pharmacy Solutions
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            أدر صيدليتك بدقة صيدلانية
            <br/>
            <span className="text-emerald-300 text-3xl md:text-4xl">وداعاً لأخطاء المخزون</span>
          </h1>
          <p className="text-emerald-100 text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
            Precision-driven Pharmacy Management. Tracking expiry dates, preventing dispensing errors, and managing alternatives automatically.
          </p>
          <p className="text-slate-300 text-base mb-10 max-w-2xl mx-auto">
            نظام نما إنفست يوفر تحكماً كاملاً في الأدوية، تتبعاً دقيقاً لتواريخ الانتهاء، ونقاط بيع فائقة السرعة لخدمة عملائك في ثوانٍ.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/966531206628" target="_blank" className="px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
              <Phone size={18}/> طلب عرض توضيحي
            </a>
            <Link href="/#modules" className="px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
              استعرض جميع الميزات
            </Link>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-3">ميزات مصممة خصيصاً للصيدليات</h2>
          <p className="text-slate-500 text-lg">Pharmacy-specific features for maximum safety and efficiency</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">{f.icon}</div>
              <h3 className="font-black text-slate-800 mb-2 text-sm">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-black mb-4">جاهز لتطوير صيدليتك؟</h2>
        <p className="text-emerald-200 mb-8">تواصل معنا اليوم للحصول على عرض توضيحي مجاني</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://wa.me/966531206628" target="_blank" className="px-8 py-4 bg-white text-emerald-800 font-black rounded-xl shadow-lg transition-all hover:bg-emerald-50 flex items-center gap-2">
            <Phone size={18}/> تواصل عبر واتساب
          </a>
          <Link href="/" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
            العودة للرئيسية
          </Link>
        </div>
      </div>

      <footer className="py-6 bg-slate-900 text-center text-slate-400 text-sm font-bold">
        © {new Date().getFullYear()} نما إنفست – Pharmacy ERP Solution | <Link href="/" className="hover:text-white">namainvist.com</Link>
      </footer>
    </div>
  );
}
