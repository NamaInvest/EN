import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, Pill, ArrowRight, ShieldCheck, Hourglass, Hash, Barcode, FileText, BarChart3, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ظ†ط¸ط§ظ… ط¥ط¯ط§ط±ط© ط§ظ„طµظٹط¯ظ„ظٹط§طھ | ظ†ظ…ط§ ط¥ظ†ظپط³طھ â€” Pharmacy Management System',
  description: 'ظ†ط¸ط§ظ… ظ…طھظƒط§ظ…ظ„ ظ„ط¥ط¯ط§ط±ط© ط§ظ„طµظٹط¯ظ„ظٹط§طھ: طھطھط¨ط¹ طھظˆط§ط±ظٹط® ط§ظ„طµظ„ط§ط­ظٹط© (FEFO)طŒ ظ…ظ†ط¹ ط¨ظٹط¹ ط§ظ„ط¯ظˆط§ط، ط§ظ„ظ…ظ†طھظ‡ظٹطŒ ط¥ط¯ط§ط±ط© ط§ظ„ط¨ط¯ط§ط¦ظ„ ط§ظ„ط·ط¨ظٹط©طŒ ظˆط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„طھط³ظ„ط³ظ„ظٹط©. The most advanced pharmacy ERP in Saudi Arabia.',
  keywords: 'ظ†ط¸ط§ظ… طµظٹط¯ظ„ظٹط©, ط¨ط±ظ†ط§ظ…ط¬ طµظٹط¯ظ„ظٹط©, ط¥ط¯ط§ط±ط© ط£ط¯ظˆظٹط©, طھظˆط§ط±ظٹط® ط§ظ†طھظ‡ط§ط، ط§ظ„طµظ„ط§ط­ظٹط©, FEFO, pharmacy management system, Saudi Arabia pharmacy software',
};

const features = [
  { icon: <Hourglass size={20}/>, title: 'طھطھط¨ط¹ طھظˆط§ط±ظٹط® ط§ظ„طµظ„ط§ط­ظٹط© FEFO', desc: 'ظٹط³طھط­ظٹظ„ ط¨ط±ظ…ط¬ظٹط§ظ‹ طھظ…ط±ظٹط± ظپط§طھظˆط±ط© ط¨ط¯ظˆط§ط، ظ…ظ†طھظ‡ظٹ ط§ظ„طµظ„ط§ط­ظٹط©. ط§ظ„ظ†ط¸ط§ظ… ظٹط·ط¨ظ‚ First-Expired-First-Out طھظ„ظ‚ط§ط¦ظٹط§ظ‹.' },
  { icon: <ShieldCheck size={20}/>, title: 'ظ…ظ†ط¹ ط¨ظٹط¹ ط§ظ„ط£ط¯ظˆظٹط© ط§ظ„ظ…ظ†طھظ‡ظٹط©', desc: 'ط­ظ…ط§ظٹط© ط·ط¨ظ‚ظٹط© ظƒط§ظ…ظ„ط© ظ…ظ† ط§ظ„ظƒط§ط´ظٹط± ظ„ظ…ظ†ط¹ ط£ظٹ ظ…ظ†طھط¬ ظ…ظ†طھظ‡ظٹ ط§ظ„طµظ„ط§ط­ظٹط© ظ…ظ† ط§ظ„ظˆطµظˆظ„ ظ„ظ„ط¹ظ…ظٹظ„.' },
  { icon: <Pill size={20}/>, title: 'ط¥ط¯ط§ط±ط© ط§ظ„ط¨ط¯ط§ط¦ظ„ ط§ظ„ط·ط¨ظٹط©', desc: 'ظ‚ط§ط¹ط¯ط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¨ط¯ط§ط¦ظ„ ط§ظ„ط¹ظ„ظ…ظٹط©. ظٹظ‚طھط±ط­ ط§ظ„ظƒط§ط´ظٹط± ط§ظ„ط¨ط¯ظٹظ„ ظپظˆط±ط§ظ‹ ط¹ظ†ط¯ ظ†ظپط§ط° ط§ظ„ط¯ظˆط§ط، ط§ظ„ط£طµظ„ظٹ.' },
  { icon: <Hash size={20}/>, title: 'ط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„طھط³ظ„ط³ظ„ظٹط© ظ„ظ„ط£ط¯ظˆظٹط©', desc: 'طھطھط¨ط¹ ظƒظ„ ظˆط­ط¯ط© ط¯ظˆط§ط، ظ…ظ† ط§ظ„ظ…ظˆط±ط¯ ط¥ظ„ظ‰ ط§ظ„ط¹ظ…ظٹظ„ ط¹ط¨ط± Serial Number ظپط±ظٹط¯ â€” ط­ظ…ط§ظٹط© ط¶ط¯ ط§ظ„طھط²ظˆظٹط±.' },
  { icon: <Barcode size={20}/>, title: 'ط¨ط§ط±ظƒظˆط¯ ط³ط±ظٹط¹ ظˆط¯ظ‚ظٹظ‚', desc: 'ظ…ط³ط­ ط§ظ„ط¨ط§ط±ظƒظˆط¯ ط®ظ„ط§ظ„ 0.3 ط«ط§ظ†ظٹط© ظ…ط¹ ط¹ط±ط¶ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط¯ظˆط§ط، ظƒط§ظ…ظ„ط©: ط§ظ„ط³ط¹ط±طŒ ط§ظ„طµظ„ط§ط­ظٹط©طŒ ظˆط§ظ„ظ…ط®ط²ظˆظ†.' },
  { icon: <BarChart3 size={20}/>, title: 'طھظ‚ط§ط±ظٹط± ظ…ط®ط²ظˆظ† ط¯ظˆط§ط¦ظٹط©', desc: 'طھظ‚ط§ط±ظٹط± ظ…طھط®طµطµط©: ط§ظ„ط£ط¯ظˆظٹط© ط¹ظ„ظ‰ ظˆط´ظƒ ط§ظ„ط§ظ†طھظ‡ط§ط،طŒ ط§ظ„ط£ظƒط«ط± ظ…ط¨ظٹط¹ط§ظ‹طŒ ظ‡ط§ظ…ط´ ط§ظ„ط±ط¨ط­ ظ„ظƒظ„ طµظ†ظپطŒ ظˆظ…ط¹ط¯ظ„ ط§ظ„ط¯ظˆط±ط§ظ†.' },
  { icon: <FileText size={20}/>, title: 'ظپط§طھظˆط±ط© ZATCA ط¥ظ„ظƒطھط±ظˆظ†ظٹط©', desc: 'ط¥طµط¯ط§ط± ط§ظ„ظپظˆط§طھظٹط± ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹط© ط§ظ„ظ…طھظˆط§ظپظ‚ط© ظ…ط¹ ط§ظ„ظ…ط±ط­ظ„ط© ط§ظ„ط«ط§ظ†ظٹط© ظ„ظ‡ظٹط¦ط© ط§ظ„ط²ظƒط§ط© ظˆط§ظ„ط¶ط±ظٹط¨ط© ظˆط§ظ„ط¬ظ…ط§ط±ظƒ.' },
  { icon: <CheckCircle size={20}/>, title: 'ط¬ط±ط¯ ط¯ظˆط±ظٹ ط°ظƒظٹ', desc: 'ط¯ظˆط±ط© ط¬ط±ط¯ ظ…طھظƒط§ظ…ظ„ط© ظ…ط¹ ط§ظ„ظƒط´ظپ ط§ظ„طھظ„ظ‚ط§ط¦ظٹ ط¹ظ† ط§ظ„ظپظˆط§ط±ظ‚ ظˆط¥طµط¯ط§ط± ظ‚ظٹظˆط¯ ط§ظ„طھط³ظˆظٹط© ط§ظ„ظ…ط­ط§ط³ط¨ظٹط©.' },
];

export default function PharmacyPage() {
  return (
    <div className="min-h-screen" dir="rtl" style={{ fontFamily: "'Lateef', sans-serif", background: '#F8FAFC' }}>
      <link href="https://fonts.googleapis.com/css2?family=Lateef:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white"/>
            </div>
            <span className="font-black text-slate-900">ظ†ظ…ط§ ط¥ظ†ظپط³طھ</span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-600">
            <ArrowRight size={14}/> ط§ظ„ط±ط¦ظٹط³ظٹط©
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            ًں’ٹ ط­ظ„ظˆظ„ ظ…طھط®طµطµط© ظ„ظ„طµظٹط¯ظ„ظٹط§طھ â€” Pharmacy Solutions
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            ط£ط¯ط± طµظٹط¯ظ„ظٹطھظƒ ط¨ط¯ظ‚ط© طµظٹط¯ظ„ط§ظ†ظٹط©
            <br/>
            <span className="text-emerald-300 text-3xl md:text-4xl">ظˆط¯ط§ط¹ط§ظ‹ ظ„ط£ط®ط·ط§ط، ط§ظ„ظ…ط®ط²ظˆظ†</span>
          </h1>
          <p className="text-emerald-100 text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
            Precision-driven Pharmacy Management. Tracking expiry dates, preventing dispensing errors, and managing alternatives automatically.
          </p>
          <p className="text-slate-300 text-base mb-10 max-w-2xl mx-auto">
            ظ†ط¸ط§ظ… ظ†ظ…ط§ ط¥ظ†ظپط³طھ ظٹظˆظپط± طھط­ظƒظ…ط§ظ‹ ظƒط§ظ…ظ„ط§ظ‹ ظپظٹ ط§ظ„ط£ط¯ظˆظٹط©طŒ طھطھط¨ط¹ط§ظ‹ ط¯ظ‚ظٹظ‚ط§ظ‹ ظ„طھظˆط§ط±ظٹط® ط§ظ„ط§ظ†طھظ‡ط§ط،طŒ ظˆظ†ظ‚ط§ط· ط¨ظٹط¹ ظپط§ط¦ظ‚ط© ط§ظ„ط³ط±ط¹ط© ظ„ط®ط¯ظ…ط© ط¹ظ…ظ„ط§ط¦ظƒ ظپظٹ ط«ظˆط§ظ†ظچ.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/966531206628" target="_blank" className="px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
              <Phone size={18}/> ط·ظ„ط¨ ط¹ط±ط¶ طھظˆط¶ظٹط­ظٹ
            </a>
            <Link href="/#modules" className="px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
              ط§ط³طھط¹ط±ط¶ ط¬ظ…ظٹط¹ ط§ظ„ظ…ظٹط²ط§طھ
            </Link>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-3">ظ…ظٹط²ط§طھ ظ…طµظ…ظ…ط© ط®طµظٹطµط§ظ‹ ظ„ظ„طµظٹط¯ظ„ظٹط§طھ</h2>
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
        <h2 className="text-3xl font-black mb-4">ط¬ط§ظ‡ط² ظ„طھط·ظˆظٹط± طµظٹط¯ظ„ظٹطھظƒطں</h2>
        <p className="text-emerald-200 mb-8">طھظˆط§طµظ„ ظ…ط¹ظ†ط§ ط§ظ„ظٹظˆظ… ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط¹ط±ط¶ طھظˆط¶ظٹط­ظٹ ظ…ط¬ط§ظ†ظٹ</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://wa.me/966531206628" target="_blank" className="px-8 py-4 bg-white text-emerald-800 font-black rounded-xl shadow-lg transition-all hover:bg-emerald-50 flex items-center gap-2">
            <Phone size={18}/> طھظˆط§طµظ„ ط¹ط¨ط± ظˆط§طھط³ط§ط¨
          </a>
          <Link href="/" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
            ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط±ط¦ظٹط³ظٹط©
          </Link>
        </div>
      </div>

      <footer className="py-6 bg-slate-900 text-center text-slate-400 text-sm font-bold">
        آ© {new Date().getFullYear()} ظ†ظ…ط§ ط¥ظ†ظپط³طھ â€” Pharmacy ERP Solution | <Link href="/" className="hover:text-white">namainvist.com</Link>
      </footer>
    </div>
  );
}

