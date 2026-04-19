import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, ShoppingBag, ArrowRight, Award, BellRing, Barcode, Scale, Tag, Layers, LayoutDashboard } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ظ†ط¸ط§ظ… ط¥ط¯ط§ط±ط© ط§ظ„طھظ…ظˆظٹظ†ط§طھ ظˆط§ظ„ط­ظ„ظˆظٹط§طھ | ظ†ظ…ط§ ط¥ظ†ظپط³طھ â€” Grocery & Retail ERP',
  description: 'ظ†ط¸ط§ظ… ظ…طھظƒط§ظ…ظ„ ظ„ظ„طھظ…ظˆظٹظ†ط§طھ ظˆط§ظ„ط­ظ„ظˆظٹط§طھ ظˆظ…ط­ظ„ط§طھ ط§ظ„ط¨ظ‚ط§ظ„ط©: ط¥ط¯ط§ط±ط© ط¢ظ„ط§ظپ ط§ظ„ط£طµظ†ط§ظپطŒ ط§ظ„ظ…ظˆط§ط²ظٹظ† ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹط©طŒ ظ†ظ‚ط§ط· ط§ظ„ظˆظ„ط§ط،طŒ ظˆط§ظ„ط¨ط§ط±ظƒظˆط¯. Best grocery retail management software in Saudi Arabia.',
  keywords: 'ظ†ط¸ط§ظ… طھظ…ظˆظٹظ†ط§طھ, ط¨ط±ظ†ط§ظ…ط¬ ط¨ظ‚ط§ظ„ط©, ظ†ط¸ط§ظ… ط­ظ„ظˆظٹط§طھ, ط¥ط¯ط§ط±ط© ظ…ط­ظ„, POS طھظ…ظˆظٹظ†ط§طھ, grocery management system, retail ERP Saudi Arabia, barcode system',
};

const features = [
  { icon: <LayoutDashboard size={20}/>, title: 'ط¥ط¯ط§ط±ط© ط¢ظ„ط§ظپ ط§ظ„ط£طµظ†ط§ظپ', desc: 'ظ…ط¹ط§ظ„ط¬ط© 120 طµظ†ظپط§ظ‹ ظپظٹ ط§ظ„ط¯ظ‚ظٹظ‚ط© ط¨ط¯ظ‚ط© ظƒط§ظ…ظ„ط©. ظ‡ظٹظƒظ„ط© ظ‡ط±ظ…ظٹط© ظ„ظ„ط£طµظ†ط§ظپ: ظپط¦ط©طŒ ظ…ط¬ظ…ظˆط¹ط©طŒ ظˆطµظ†ظپ ظپط±ط¹ظٹ.' },
  { icon: <Scale size={20}/>, title: 'ط±ط¨ط· ط§ظ„ظ…ظˆط§ط²ظٹظ† ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹط©', desc: 'طھظƒط§ظ…ظ„ ظ…ط¨ط§ط´ط± ظ…ط¹ ط§ظ„ظ…ظˆط§ط²ظٹظ† ظ„ط¨ظٹط¹ ط§ظ„ظ…ظ†طھط¬ط§طھ ط¨ط§ظ„ظˆط²ظ† (ظƒظٹظ„ظˆ/ط¬ط±ط§ظ…) ظ…ط¹ ط§ط­طھط³ط§ط¨ ط§ظ„ط³ط¹ط± طھظ„ظ‚ط§ط¦ظٹط§ظ‹.' },
  { icon: <Award size={20}/>, title: 'ظ†ط¸ط§ظ… ط§ظ„ظˆظ„ط§ط، ظˆط§ظ„ط®طµظˆظ…ط§طھ', desc: 'ظ†ظ‚ط§ط· ظˆظ„ط§ط، طھظ„ظ‚ط§ط¦ظٹط© ظ„ظƒظ„ ط¹ظ…ظ„ظٹط© ط´ط±ط§ط،طŒ ط¹ط±ظˆط¶ "ط§ط´طھط±ظٹ 2 ظˆط§ط­طµظ„ ط¹ظ„ظ‰ 1"طŒ ظˆظƒظˆط¨ظˆظ†ط§طھ ط®طµظ… ط­طµط±ظٹط©.' },
  { icon: <BellRing size={20}/>, title: 'طھظ†ط¨ظٹظ‡ط§طھ ط§ظ„ظ†ظ‚طµ ط§ظ„ط°ظƒظٹط©', desc: 'ط±ط§ط¯ط§ط± ط°ظƒظٹ ظٹط±ط§ظ‚ط¨ ط§ظ„ظ…ط®ط²ظˆظ† ظ„ط­ط¸ظٹط§ظ‹ ظˆظٹظڈظ†ط¨ظ‘ظ‡ ظپظˆط± ط§ظ‚طھط±ط§ط¨ ط£ظٹ طµظ†ظپ ظ…ظ† ط§ظ„ط­ط¯ ط§ظ„ط£ط¯ظ†ظ‰.' },
  { icon: <Barcode size={20}/>, title: 'ط¨ط§ط±ظƒظˆط¯ ط§ظ„ظ…ظٹط²ط§ظ† ط§ظ„ظ…طھظ‚ط¯ظ…', desc: 'ط¯ط¹ظ… ظƒط§ظ…ظ„ ظ„ظ„ط¨ط§ط±ظƒظˆط¯ ط§ظ„ظ…طھط؛ظٹط± (Variable Weight Barcode) ط§ظ„ط®ط§طµ ط¨ظ…ظ†طھط¬ط§طھ ط§ظ„ظ„ط­ظˆظ… ظˆط§ظ„ط¬ط¨ظ† ظˆط§ظ„ط­ظ„ظˆظٹط§طھ.' },
  { icon: <Tag size={20}/>, title: 'ط·ط¨ط§ط¹ط© ط§ظ„ظ…ظ„طµظ‚ط§طھ ط§ظ„ط¬ظ…ط§ط¹ظٹط©', desc: 'ط·ط¨ط§ط¹ط© ظ…ظ„طµظ‚ط§طھ ط£ط³ط¹ط§ط± ظˆط¨ط§ط±ظƒظˆط¯ ط¬ظ…ط§ط¹ظٹط© ط¨طھظ†ط³ظٹظ‚ط§طھ EAN/QR/Code128 ظ„ظ…ط¦ط§طھ ط§ظ„ط£طµظ†ط§ظپ ط¯ظپط¹ط© ظˆط§ط­ط¯ط©.' },
  { icon: <ShoppingBag size={20}/>, title: 'ط¬ط±ط¯ ط³ط±ظٹط¹ ظˆط¢ظ„ظٹ', desc: 'ط¯ظˆط±ط© ط¬ط±ط¯ ظ…طھظƒط§ظ…ظ„ط©: طھط®ط·ظٹط·طŒ طھط¹ط¯ط§ط¯ ط¨ط§ظ„ظƒط§ظ…ظٹط±ط§ ط£ظˆ ط§ظ„ط¨ط§ط±ظƒظˆط¯طŒ ظˆط§ظƒطھط´ط§ظپ ط§ظ„ظپظˆط§ط±ظ‚ ظپظˆط±ط§ظ‹.' },
  { icon: <CheckCircle size={20}/>, title: 'طھظ‚ط§ط±ظٹط± ط§ظ„ظ…ط¨ظٹط¹ط§طھ ط§ظ„ظٹظˆظ…ظٹط©', desc: 'طھظ‚ط±ظٹط± ظٹظˆظ…ظٹ طھظپطµظٹظ„ظٹ: ط£ظƒط«ط± ط§ظ„ط£طµظ†ط§ظپ ظ…ط¨ظٹط¹ط§ظ‹طŒ ظ‡ط§ظ…ط´ ط§ظ„ط±ط¨ط­طŒ ظˆظ…ظ‚ط§ط±ظ†ط© ط§ظ„ط£ط¯ط§ط، ط§ظ„ط£ط³ط¨ظˆط¹ظٹ.' },
];

export default function RetailPage() {
  return (
    <div className="min-h-screen" dir="rtl" style={{ fontFamily: "'Lateef', sans-serif", background: '#F8FAFC' }}>
      <link href="https://fonts.googleapis.com/css2?family=Lateef:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg flex items-center justify-center"><Layers className="w-4 h-4 text-white"/></div>
            <span className="font-black text-slate-900">ظ†ظ…ط§ ط¥ظ†ظپط³طھ</span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-600"><ArrowRight size={14}/> ط§ظ„ط±ط¦ظٹط³ظٹط©</Link>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            ًں›’ ط§ظ„طھظ…ظˆظٹظ†ط§طھ ظˆط§ظ„ط­ظ„ظˆظٹط§طھ â€” Grocery & Sweets
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            طھط­ظƒظ… ظپظٹ ط¢ظ„ط§ظپ ط§ظ„ط£طµظ†ط§ظپ
            <br/>
            <span className="text-amber-300 text-3xl md:text-4xl">ط¨ط¶ط؛ط·ط© ط²ط± ظˆط§ط­ط¯ط©</span>
          </h1>
          <p className="text-amber-100 text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
            Smart Retail & Grocery Solutions. High-volume inventory tracking, loyalty programs, and seamless POS.
          </p>
          <p className="text-slate-300 text-base mb-10 max-w-2xl mx-auto">
            ط³ظˆط§ط، ظƒظ†طھ طھط¯ظٹط± ط³ظˆط¨ط± ظ…ط§ط±ظƒطھ ط¶ط®ظ… ط£ظˆ ظ…ط­ظ„ ط­ظ„ظˆظٹط§طھ ظپط§ط®ط±طŒ ظ†ط¸ط§ظ…ظ†ط§ ظٹط¶ظ…ظ† ظ„ظƒ ط¬ط±ط¯ط§ظ‹ ظ„ط­ط¸ظٹط§ظ‹ ظˆظ…ط¨ظٹط¹ط§طھ ظ„ط§ طھطھظˆظ‚ظپ.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/966531206628" target="_blank" className="px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
              <Phone size={18}/> ط·ظ„ط¨ ط¹ط±ط¶ طھظˆط¶ظٹط­ظٹ
            </a>
            <Link href="/#modules" className="px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
              ط§ط³طھط¹ط±ط¶ ط¬ظ…ظٹط¹ ط§ظ„ظ…ظٹط²ط§طھ
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-3">ظ…ظٹط²ط§طھ ظ…طµظ…ظ…ط© ظ„طھط¬ط§ط±ط© ط§ظ„طھط¬ط²ط¦ط©</h2>
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
        <h2 className="text-3xl font-black mb-4">ط¬ط§ظ‡ط² ظ„طھط·ظˆظٹط± ظ…طھط¬ط±ظƒطں</h2>
        <p className="text-amber-200 mb-8">طھظˆط§طµظ„ ظ…ط¹ظ†ط§ ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط¹ط±ط¶ طھظˆط¶ظٹط­ظٹ ظ…ط¬ط§ظ†ظٹ</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://wa.me/966531206628" target="_blank" className="px-8 py-4 bg-white text-amber-800 font-black rounded-xl hover:bg-amber-50 flex items-center gap-2 transition-all">
            <Phone size={18}/> طھظˆط§طµظ„ ط¹ط¨ط± ظˆط§طھط³ط§ط¨
          </a>
          <Link href="/" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
            ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط±ط¦ظٹط³ظٹط©
          </Link>
        </div>
      </div>
      <footer className="py-6 bg-slate-900 text-center text-slate-400 text-sm font-bold">
        آ© {new Date().getFullYear()} ظ†ظ…ط§ ط¥ظ†ظپط³طھ â€” Grocery & Retail ERP | <Link href="/" className="hover:text-white">namainvist.com</Link>
      </footer>
    </div>
  );
}

