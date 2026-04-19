import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, UtensilsCrossed, ArrowRight, LayoutDashboard, Monitor, FileText, Layers, Clock, RefreshCcw, MessageCircle, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ظ†ط¸ط§ظ… ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط·ط§ط¹ظ… ظˆط§ظ„ظƒط§ظپظٹظ‡ط§طھ | ظ†ظ…ط§ ط¥ظ†ظپط³طھ â€” Restaurant POS System',
  description: 'ظ†ط¸ط§ظ… ظ…طھظƒط§ظ…ظ„ ظ„ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط·ط§ط¹ظ… ظˆط§ظ„ظƒط§ظپظٹظ‡ط§طھ: ط®ط±ظٹط·ط© ط§ظ„ط·ط§ظˆظ„ط§طھطŒ ط´ط§ط´ط© ط§ظ„ظ…ط·ط¨ط® ط§ظ„ط±ظ‚ظ…ظٹط© KDSطŒ ط§ظ„ظ…ظ†ظٹظˆ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹطŒ ظˆط¥ط¯ط§ط±ط© ط§ظ„طھظˆطµظٹظ„. Best restaurant management system in Saudi Arabia.',
  keywords: 'ظ†ط¸ط§ظ… ظ…ط·ط¹ظ…, ط¨ط±ظ†ط§ظ…ط¬ ظƒط§ظپظٹظ‡, ط¥ط¯ط§ط±ط© ظ…ط·ط§ط¹ظ…, POS ظ…ط·ط¹ظ…, ط´ط§ط´ط© ظ…ط·ط¨ط® KDS, restaurant management system, cafe POS Saudi Arabia, food delivery integration',
};

const features = [
  { icon: <LayoutDashboard size={20}/>, title: 'ط®ط±ظٹط·ط© ط§ظ„ط·ط§ظˆظ„ط§طھ ط§ظ„طھظپط§ط¹ظ„ظٹط©', desc: 'ط¹ط±ط¶ ط¨طµط±ظٹ ظ„ط­ط§ظ„ط© ظƒظ„ ط·ط§ظˆظ„ط© (ظ…ط´ط؛ظˆظ„ط©/ظپط§ط±ط؛ط©/ظ‚ظٹط¯ ط§ظ„ط¯ظپط¹). طھط­ط±ظٹظƒ ط§ظ„ط·ظ„ط¨ ط¨ظٹظ† ط§ظ„ط·ط§ظˆظ„ط§طھ ط¨ط³ط­ط¨ ظˆط¥ظپظ„ط§طھ.' },
  { icon: <Monitor size={20}/>, title: 'ط´ط§ط´ط© ط§ظ„ظ…ط·ط¨ط® ط§ظ„ط±ظ‚ظ…ظٹط© KDS', desc: 'ظٹطµظ„ ط§ظ„ط·ظ„ط¨ ظ„ظ„ط´ظٹظپ ظپظٹ ط«ظˆط§ظ†ظچ ط¨ط¯ظˆظ† ظˆط±ظ‚. ط¹ط±ط¶ ط£ظˆظ„ظˆظٹط© ط§ظ„ط·ظ„ط¨ط§طھ ظˆط²ظ…ظ† ط§ظ„ط¥ط¹ط¯ط§ط¯ ط¹ظ„ظ‰ ط´ط§ط´ط© ط§ظ„ظ…ط·ط¨ط®.' },
  { icon: <FileText size={20}/>, title: 'ط§ظ„ظ…ظ†ظٹظˆ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ط§ظ„ظ„ط­ط¸ظٹ', desc: 'طھط­ط¯ظٹط« ط§ظ„ط£ط³ط¹ط§ط± ظˆط§ظ„ط£طµظ†ط§ظپ ظˆط§ظ„طµظˆط± ظ„ط­ط¸ظٹط§ظ‹ ط¹ظ„ظ‰ ط¬ظ…ظٹط¹ ظ†ظ‚ط§ط· ط§ظ„ط¨ظٹط¹ ط¯ظˆظ† ط§ظ„ط­ط§ط¬ط© ظ„ط¥ط¹ط§ط¯ط© ط§ظ„طھط´ط؛ظٹظ„.' },
  { icon: <RefreshCcw size={20}/>, title: 'طھط¹ط¯ظٹظ„ط§طھ ط§ظ„ط·ظ„ط¨ط§طھ (Modifiers)', desc: 'ط¥ط¶ط§ظپط§طھ ظˆط¥ط²ط§ظ„ط§طھ ظ…ط±ظ†ط©: "ط¨ط¯ظˆظ† ط¨طµظ„طŒ ط²ط¨ط¯ط© ط¥ط¶ط§ظپظٹط©طŒ ط­ط§ط±"طŒ ظ…ط¹ ط±ط¨ط· ظƒظ„ طھط¹ط¯ظٹظ„ ط¨ظˆطµظپط© ط§ظ„طھطµظ†ظٹط¹.' },
  { icon: <Clock size={20}/>, title: 'ط¥ط¯ط§ط±ط© ط§ظ„ظˆط±ط¯ظٹط§طھ ظˆط§ظ„ط¥ط؛ظ„ط§ظ‚', desc: 'ط­ط³ط§ط¨ ط¯ظ‚ظٹظ‚ ظ„ظ…ط¨ظٹط¹ط§طھ ظƒظ„ ظ†ط§ط¯ظ„ ظ„ظƒظ„ ظˆط±ط¯ظٹط©. طھظ‚ط±ظٹط± ط¥ط؛ظ„ط§ظ‚ ظˆط±ط¯ظٹظ‘ط© ظ…ط§ظ„ظٹ ط´ط§ظ…ظ„ ظپظٹ ط«ظˆط§ظ†ظچ.' },
  { icon: <UtensilsCrossed size={20}/>, title: 'ط¥ط¯ط§ط±ط© ط§ظ„ظˆطµظپط§طھ ظˆط§ظ„طھظƒظ„ظپط©', desc: 'ظƒظ„ طµظ†ظپ ظپظٹ ط§ظ„ظ…ظ†ظٹظˆ ظ…ط±طھط¨ط· ط¨ظˆطµظپط© طھط­ط³ط¨ ط§ظ„طھظƒظ„ظپط© ط§ظ„ط­ظ‚ظٹظ‚ظٹط© (BOM). ط³ط­ط¨ طھظ„ظ‚ط§ط¦ظٹ ظ…ظ† ط§ظ„ظ…ط®ط²ظˆظ†.' },
  { icon: <MessageCircle size={20}/>, title: 'ط¯ط¹ظ… ط§ظ„طھظˆطµظٹظ„ ظˆظˆط§طھط³ط§ط¨', desc: 'ط§ط³طھظ‚ط¨ط§ظ„ ط·ظ„ط¨ط§طھ ط§ظ„طھظˆطµظٹظ„ ظ…ط¹ طھط£ظƒظٹط¯ طھظ„ظ‚ط§ط¦ظٹ ط¹ط¨ط± ظˆط§طھط³ط§ط¨ ظˆطھطھط¨ط¹ ط­ط§ظ„ط© ط§ظ„ط·ظ„ط¨ ظ„ظ„ط¹ظ…ظٹظ„.' },
  { icon: <BarChart3 size={20}/>, title: 'طھظ‚ط§ط±ظٹط± ط§ظ„ط£ط¯ط§ط، ط§ظ„طھظپطµظٹظ„ظٹط©', desc: 'ط£ظƒط«ط± ط§ظ„ط£طµظ†ط§ظپ ظ…ط¨ظٹط¹ط§ظ‹طŒ ط³ط§ط¹ط§طھ ط§ظ„ط°ط±ظˆط©طŒ ظ…طھظˆط³ط· ط§ظ„ظپط§طھظˆط±ط©طŒ ظˆط£ط¯ط§ط، ظƒظ„ ظ…ظˆط¸ظپ ط¨ط´ظƒظ„ ظ…ظ†ظپطµظ„.' },
];

export default function RestaurantPage() {
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

      <div className="bg-gradient-to-br from-rose-900 via-pink-900 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-400/30 text-rose-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            ًںچ½ï¸ڈ ط§ظ„ظ…ط·ط§ط¹ظ… ظˆط§ظ„ظƒط§ظپظٹظ‡ط§طھ â€” Restaurant & Cafe Solutions
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            ظ†ط¸ظ‘ظ… ظ…ط·ط¹ظ…ظƒ ط¨ط°ظƒط§ط،
            <br/>
            <span className="text-rose-300 text-3xl md:text-4xl">ظ…ظ† ط§ظ„ط·ظ„ط¨ ط­طھظ‰ ط§ظ„طھظ‚ط¯ظٹظ…</span>
          </h1>
          <p className="text-rose-100 text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
            Next-Gen Restaurant Management. Table mapping, Digital Kitchen Display (KDS), and seamless order workflows.
          </p>
          <p className="text-slate-300 text-base mb-10 max-w-2xl mx-auto">
            طھط®ظ„طµ ظ…ظ† ظپظˆط¶ظ‰ ط§ظ„ط·ظ„ط¨ط§طھ ط§ظ„ظˆط±ظ‚ظٹط©. ظ†ط¸ط§ظ… ظ†ظ…ط§ ط¥ظ†ظپط³طھ ظٹظ†ط¸ظ… ط·ط§ظˆظ„ط§طھظƒطŒ ظٹط³ط±ط¹ ظ…ط·ط¨ط®ظƒطŒ ظˆظٹط²ظٹط¯ ظ…ظ† ط±ط¶ط§ ط¹ظ…ظ„ط§ط¦ظƒ.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/966531206628" target="_blank" className="px-7 py-3.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
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
          <h2 className="text-3xl font-black text-slate-900 mb-3">ظ…ظٹط²ط§طھ ظ…طµظ…ظ…ط© ظ„ظ†ط¬ط§ط­ ظ…ط·ط¹ظ…ظƒ</h2>
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
        <h2 className="text-3xl font-black mb-4">ط¬ط§ظ‡ط² ظ„طھط·ظˆظٹط± ظ…ط·ط¹ظ…ظƒطں</h2>
        <p className="text-rose-200 mb-8">طھظˆط§طµظ„ ظ…ط¹ظ†ط§ ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط¹ط±ط¶ طھظˆط¶ظٹط­ظٹ ظ…ط¬ط§ظ†ظٹ</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://wa.me/966531206628" target="_blank" className="px-8 py-4 bg-white text-rose-800 font-black rounded-xl hover:bg-rose-50 flex items-center gap-2 transition-all">
            <Phone size={18}/> طھظˆط§طµظ„ ط¹ط¨ط± ظˆط§طھط³ط§ط¨
          </a>
          <Link href="/" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
            ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط±ط¦ظٹط³ظٹط©
          </Link>
        </div>
      </div>
      <footer className="py-6 bg-slate-900 text-center text-slate-400 text-sm font-bold">
        آ© {new Date().getFullYear()} ظ†ظ…ط§ ط¥ظ†ظپط³طھ â€” Restaurant & Cafe ERP | <Link href="/" className="hover:text-white">namainvist.com</Link>
      </footer>
    </div>
  );
}

