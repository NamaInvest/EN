import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, Factory, ArrowRight, BookOpen, Cpu, DollarSign, Layers, Activity, Package, GitMerge, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ظ†ط¸ط§ظ… ط¥ط¯ط§ط±ط© ط§ظ„ظ…طµط§ظ†ط¹ ظˆط§ظ„طھطµظ†ظٹط¹ | ظ†ظ…ط§ ط¥ظ†ظپط³طھ â€” Manufacturing ERP System',
  description: 'ظ†ط¸ط§ظ… طھط®ط·ظٹط· ظ…ظˆط§ط±ط¯ ط§ظ„ظ…طµط§ظ†ط¹: ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط§ط¯ BOMطŒ طھطھط¨ط¹ ط®ط·ظˆط· ط§ظ„ط¥ظ†طھط§ط¬طŒ ط­ط³ط§ط¨ طھظƒظ„ظپط© ط§ظ„طھطµظ†ظٹط¹طŒ MRPطŒ ظˆط¥ط¯ط§ط±ط© ط§ظ„ظ‡ط§ظ„ظƒ. Advanced manufacturing ERP for Saudi factories.',
  keywords: 'ظ†ط¸ط§ظ… ظ…طµظ†ط¹, ط¥ط¯ط§ط±ط© ط¥ظ†طھط§ط¬, BOM, MRP, طھظƒظ„ظپط© طھطµظ†ظٹط¹, manufacturing ERP, production management Saudi Arabia, factory management system, ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط§ط¯',
};

const features = [
  { icon: <BookOpen size={20}/>, title: 'ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط§ط¯ (BOM)', desc: 'طھط­ط¯ظٹط¯ ط¯ظ‚ظٹظ‚ ظ„ظƒظ„ ظ…ظƒظˆظ†ط§طھ ط§ظ„ظ…ظ†طھط¬ ط¨ط§ظ„ظƒظ…ظٹط§طھ ط§ظ„ط¯ظ‚ظٹظ‚ط©. طھط¯ط§ط®ظ„ BOM ظ…طھط¹ط¯ط¯ط© ط§ظ„ظ…ط³طھظˆظٹط§طھ ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„طھط¬ظ…ظٹط¹ ط§ظ„ظ…ط¹ظ‚ط¯ط©.' },
  { icon: <Activity size={20}/>, title: 'طھطھط¨ط¹ ظ…ط±ط§ط­ظ„ ط§ظ„ط¥ظ†طھط§ط¬', desc: 'ظ…ط±ط§ظ‚ط¨ط© ط§ظ„ظ…ظ†طھط¬ ط¹ط¨ط± ظƒظ„ ظ…ط±ط§ط­ظ„ ط§ظ„طھطµظ†ظٹط¹: ط§ظ„ظ…ظˆط§ط¯ ط§ظ„ط®ط§ظ…طŒ ظ…ط¹ط§ظ„ط¬ط©طŒ طھط¬ظ…ظٹط¹طŒ ظپط­طµطŒ ظˆطھط؛ظ„ظٹظپ â€” ظپظٹ ط§ظ„ظˆظ‚طھ ط§ظ„ظپط¹ظ„ظٹ.' },
  { icon: <DollarSign size={20}/>, title: 'ط­ط³ط§ط¨ طھظƒظ„ظپط© ط§ظ„طھطµظ†ظٹط¹', desc: 'ط§ظ„طھظƒظ„ظپط© ط§ظ„ط­ظ‚ظٹظ‚ظٹط© = ظ…ظˆط§ط¯ ط®ط§ظ… + ط¹ظ…ط§ظ„ط© ظ…ط¨ط§ط´ط±ط© + طھظƒط§ظ„ظٹظپ طھط´ط؛ظٹظ„. ط¯ظ‚ط© ظ…طھظ†ط§ظ‡ظٹط© ظ„ظƒظ„ ظˆط­ط¯ط© ظ…ظ†طھط¬ط©.' },
  { icon: <Cpu size={20}/>, title: 'طھط®ط·ظٹط· ط§ظ„ظ…ظˆط§ط±ط¯ MRP', desc: 'ط­ط³ط§ط¨ ط§ظ„ط§ط­طھظٹط§ط¬ ظ…ظ† ط§ظ„ظ…ظˆط§ط¯ ط§ظ„ط®ط§ظ… ط¢ظ„ظٹط§ظ‹ ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ط·ظ„ط¨ط§طھ ط§ظ„ط¥ظ†طھط§ط¬ ظˆطھظˆظ„ظٹط¯ ط·ظ„ط¨ط§طھ ط§ظ„ط´ط±ط§ط، طھظ„ظ‚ط§ط¦ظٹط§ظ‹.' },
  { icon: <Package size={20}/>, title: 'ط¥ط¯ط§ط±ط© ط§ظ„ظ‡ط§ظ„ظƒ ظˆط§ظ„ظ…ط®ظ„ظپط§طھ', desc: 'طھطھط¨ط¹ ط§ظ„ظƒظ…ظٹط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط© ظپظٹ ظƒظ„ ظ…ط±ط­ظ„ط© ط¥ظ†طھط§ط¬. طھط­ظ„ظٹظ„ ظ…ط¹ط¯ظ„ ط§ظ„ظ‡ط§ظ„ظƒ ظˆطھظ‚ط§ط±ظٹط± ط§ظ„طھط­ط³ظٹظ† ط§ظ„ظ…ط³طھظ…ط±.' },
  { icon: <GitMerge size={20}/>, title: 'ط§ظ„طھط­ظˆظٹظ„ط§طھ ط¨ظٹظ† ط§ظ„ظ…ط³طھظˆط¯ط¹ط§طھ', desc: 'ط­ط±ظƒط© ط§ظ„ظ…ظˆط§ط¯ ط§ظ„ط®ط§ظ… ظ…ظ† ط§ظ„ظ…ط³طھظˆط¯ط¹ ظ„ظ„ط¥ظ†طھط§ط¬ ظˆط­ط±ظƒط© ط§ظ„ظ…ظ†طھط¬ ط§ظ„طھط§ظ… ظ„ظ„ظ…ط³طھظˆط¯ط¹ ط§ظ„ط±ط¦ظٹط³ظٹ ط¢ظ„ظٹط§ظ‹ ظˆظ…ظڈط­ط§ط³ط¨ظٹط§ظ‹.' },
  { icon: <Factory size={20}/>, title: 'ط£ظˆط§ظ…ط± ط§ظ„طھط´ط؛ظٹظ„', desc: 'ط¥طµط¯ط§ط± ط£ظ…ط± طھط´ط؛ظٹظ„ ط±ظ‚ظ…ظٹ ظٹط­ط¬ط² ط§ظ„ظ…ظˆط§ط¯ ط§ظ„ط®ط§ظ… ظˆظٹط·ظ„ظ‚ ط¹ظ…ظ„ظٹط© ط§ظ„ط¥ظ†طھط§ط¬ ظ…ط¹ طھطھط¨ط¹ ظƒط§ظ…ظ„ ظ„ط­ط§ظ„ط© ط§ظ„طھظ†ظپظٹط°.' },
  { icon: <BarChart3 size={20}/>, title: 'طھظ‚ط§ط±ظٹط± ط§ظ„ظƒظپط§ط،ط© ط§ظ„ط¥ظ†طھط§ط¬ظٹط©', desc: 'ظƒظپط§ط،ط© ط®ط· ط§ظ„ط¥ظ†طھط§ط¬طŒ ظ…ط¹ط¯ظ„ ط§ظ„ط¹ظٹظˆط¨طŒ طھظƒظ„ظپط© ط§ظ„ظˆط­ط¯ط©طŒ ظˆطھط­ظ„ظٹظ„ ط§ظ„ظپط¬ظˆط© ط¨ظٹظ† ط§ظ„ظ…ط®ط·ط· ظˆط§ظ„ظپط¹ظ„ظٹ.' },
];

export default function FactoryPage() {
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

      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            ًںڈ­ ط§ظ„ظ…طµط§ظ†ط¹ ظˆط§ظ„ط¥ظ†طھط§ط¬ â€” Manufacturing & Factory Solutions
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            ط­ظˆظ‘ظ„ ظ…طµظ†ط¹ظƒ ط¥ظ„ظ‰ ظ…ظ†ط¸ظˆظ…ط©
            <br/>
            <span className="text-blue-300 text-3xl md:text-4xl">ط±ظ‚ظ…ظٹط© ظپط§ط¦ظ‚ط© ط§ظ„ظƒظپط§ط،ط©</span>
          </h1>
          <p className="text-blue-100 text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
            Advanced Industrial ERP. Bill of Materials (BOM), production stage tracking, and precision costing for manufacturing plants.
          </p>
          <p className="text-slate-300 text-base mb-10 max-w-2xl mx-auto">
            ظ…ظ† ط§ظ„ظ…ط§ط¯ط© ط§ظ„ط®ط§ظ… ط¥ظ„ظ‰ ط§ظ„ظ…ظ†طھط¬ ط§ظ„ظ†ظ‡ط§ط¦ظٹ â€” طھطھط¨ط¹ ظƒظ„ ظ…ط±ط­ظ„ط© ظپظٹ ط®ط· ط§ظ„ط¥ظ†طھط§ط¬ ظˆط§ط­ط³ط¨ طھظƒط§ظ„ظٹظپظƒ ط¨ط¯ظ‚ط© ظ…طھظ†ط§ظ‡ظٹط©.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/966531206628" target="_blank" className="px-7 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
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
          <h2 className="text-3xl font-black text-slate-900 mb-3">ظ…ظٹط²ط§طھ ظ…طµظ…ظ…ط© ظ„ظ„ظ…طµط§ظ†ط¹ ظˆط§ظ„ط¥ظ†طھط§ط¬</h2>
          <p className="text-slate-500 text-lg">From raw materials to finished goods â€” full manufacturing lifecycle management</p>
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
        <h2 className="text-3xl font-black mb-4">ط¬ط§ظ‡ط² ظ„طھط·ظˆظٹط± ظ…طµظ†ط¹ظƒطں</h2>
        <p className="text-blue-200 mb-8">طھظˆط§طµظ„ ظ…ط¹ظ†ط§ ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط¹ط±ط¶ طھظˆط¶ظٹط­ظٹ ظ…ط¬ط§ظ†ظٹ</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://wa.me/966531206628" target="_blank" className="px-8 py-4 bg-white text-blue-800 font-black rounded-xl hover:bg-blue-50 flex items-center gap-2 transition-all">
            <Phone size={18}/> طھظˆط§طµظ„ ط¹ط¨ط± ظˆط§طھط³ط§ط¨
          </a>
          <Link href="/" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all">
            ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط±ط¦ظٹط³ظٹط©
          </Link>
        </div>
      </div>
      <footer className="py-6 bg-slate-900 text-center text-slate-400 text-sm font-bold">
        آ© {new Date().getFullYear()} ظ†ظ…ط§ ط¥ظ†ظپط³طھ â€” Manufacturing ERP | <Link href="/" className="hover:text-white">namainvist.com</Link>
      </footer>
    </div>
  );
}

