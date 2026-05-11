'use client';
import React, { useState, useEffect } from 'react';
import { Link, ShieldCheck, Database, Search } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function BlockchainTracePage() {
 const { lang } = useTranslation();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

 const [ledger, setLedger] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [searchOrder, setSearchOrder] = useState('');

 useEffect(() => {
 fetchLedger();
 }, []);

 const fetchLedger = async (orderId?: string) => {
 setLoading(true);
 try {
 const url = orderId ? `/api/manufacturing/blockchain-trace?orderId=${orderId}` : '/api/manufacturing/blockchain-trace';
 const res = await fetch(url);
 if (res.ok) setLedger(await res.json());
 } catch (error) {
 console.error('Error fetching ledger', error);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="p-6 max-w-7xl mx-auto space-y-6">
 <div className="flex items-center justify-between mb-8">
 <div className="flex items-center gap-3">
 <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Link className="w-8 h-8" /></div>
 <div>
 <h1 className="text-2xl font-bold text-slate-900">سجل المنشأ اللامركزي (Blockchain Traceability)</h1>
 <p className="text-slate-500 font-mono text-sm mt-1">Network: {ledger?.network || 'Loading...'} | Consensus: {ledger?.consensus || '...'}</p>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 <input 
 type="text" 
 placeholder="رقم الأمر (مثال: 12)" 
 className="border px-4 py-2 rounded-lg"
 value={searchOrder}
 onChange={e => setSearchOrder(e.target.value)}
 />
 <button onClick={() => fetchLedger(searchOrder)} className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700">
 <Search className="w-5 h-5" />
 </button>
 </div>
 </div>

 <div className="space-y-4">
 {loading ? <div className="text-center py-10">جاري مزامنة دفتر الأستاذ الموزع...</div> :
 ledger?.blocks?.length === 0 ? <div className="text-center py-10 text-slate-500">لا توجد كتل مسجلة</div> :
 ledger?.blocks?.map((block: any, i: number) => (
 <div key={block.blockId} className="bg-slate-900 text-slate-300 rounded-2xl p-6 shadow-xl border border-slate-700 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-10">
 <Database className="w-32 h-32" />
 </div>
 
 <div className="flex justify-between items-start mb-4 relative z-10">
 <div>
 <h3 className="text-xl font-bold text-white mb-1">Block #{block.blockId}</h3>
 <p className="text-emerald-400 font-mono text-xs mb-2">Timestamp: {new Date(block.timestamp).toISOString()}</p>
 </div>
 {block.isValid && <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-xs font-bold"><ShieldCheck className="w-4 h-4"/>{_t('تم التحقق منه', 'Verified')}</div>}
 </div>

 <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
 <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
 <p className="text-xs text-slate-500 mb-1">{_t('المنتج', 'Product')}</p>
 <p className="font-bold text-white">{block.productName || 'N/A'}</p>
 </div>
 <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
 <p className="text-xs text-slate-500 mb-1">Batch / Order</p>
 <p className="font-bold text-white">{block.batchNumber || 'N/A'}</p>
 </div>
 </div>

 <div className="space-y-2 relative z-10">
 <div className="bg-black/50 p-3 rounded-lg border border-slate-800">
 <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{_t('التجزئة السابقة', 'Previous Hash')}</p>
 <p className="font-mono text-xs text-slate-400 break-all">{block.previousHash}</p>
 </div>
 <div className="bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/30">
 <p className="text-[10px] text-emerald-500/70 uppercase tracking-wider mb-1">{_t('كتلة التجزئة (SHA-256)', 'Block Hash (SHA-256)')}</p>
 <p className="font-mono text-xs text-emerald-400 break-all">{block.hash}</p>
 </div>
 </div>
 
 {i !== ledger.blocks.length - 1 && (
 <div className="flex justify-center -mb-8 mt-4 relative z-0">
 <div className="h-8 w-1 bg-slate-700"></div>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 );
}
