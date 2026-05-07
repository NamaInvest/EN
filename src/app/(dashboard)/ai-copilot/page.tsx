import { _t } from '@/lib/server-t';
'use client';
"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Bot, Send, Sparkles, TrendingUp, Search, AlertCircle, FileText, PieChart, MessageSquare, Plus, ExternalLink, Zap } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function AICopilot() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 const [query, setQuery] = useState('');
 const [chat, setChat] = useState<{role: 'user'|'ai', text: string, widget?: string}[]>([
 { role: 'ai', text: 'أهلاً بك في Nama Copilot ✨ أنا مساعدك الذكي المربوط بكافة بيانات النظام. كيف يمكنني مساعدتك اليوم؟' }
 ]);
 const [loading, setLoading] = useState(false);

 const handleSend = (e: React.FormEvent) => {
 e.preventDefault();
 if (!query.trim()) return;
 
 setChat([...chat, { role: 'user', text: query }]);
 setQuery('');
 setLoading(true);

 // Simulate AI response based on keywords
 setTimeout(() => {
 let reply = "بناءً على تحليلي لبيانات النظام...";
 let widget = undefined;

 if (chat.length === 1 || query.includes('مبيعات')) {
 reply = "لقد قمت بتحليل مبيعات هذا الأسبوع. لاحظت ارتفاعاً بنسبة 15% في فرع العليا مقارنة بالأسبوع الماضي. إليك تقرير المبيعات السريع:";
 widget = 'sales_chart';
 } else if (query.includes('مخزون') || query.includes('نواقص')) {
 reply = "يوجد 8 أصناف وصلت للحد الأدنى من المخزون في المستودع الرئيسي. هل ترغب في أن أقوم بإنشاء أوامر شراء آلية للموردين المعتمدين؟";
 widget = 'inventory_alert';
 } else {
 reply = "أقوم حالياً بتجهيز هذه البيانات لك. هل تحتاج إلى تصدير النتيجة كملف PDF أم إرسالها عبر البريد الإلكتروني للمدير التنفيذي؟";
 }

 setChat(prev => [...prev, { role: 'ai', text: reply, widget }]);
 setLoading(false);
 }, 1500);
 };

 return (
 <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#020617] overflow-hidden transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
 <style dangerouslySetInnerHTML={{ __html: fontImport }} />
 
 {/* Header */}
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shrink-0 z-10 shadow-sm">
 <div className="flex items-center space-x-4 space-x-reverse">
 <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl relative overflow-hidden group">
 <div className="absolute inset-0 bg-indigo-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
 <Bot className="w-8 h-8 text-indigo-600 dark:text-indigo-400 relative z-10" />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">{_t('Nama AI Copilot', 'Nama AI Copilot')}</h1>
 <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">مساعدك التنفيذي المدمج مع بيانات (ERP)</p>
 </div>
 </div>
 <div className="mt-4 md:mt-0 flex gap-3">
 <span className="flex items-center px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
 <div className="w-2 h-2 rounded-full bg-emerald-500 ml-2 animate-pulse"></div>
 متصل بقاعدة البيانات
 </span>
 </div>
 </div>

 <div className="flex-1 flex overflow-hidden">
 {/* Left Side: Prompt Suggestions (Hidden on small screens) */}
 <div className="hidden lg:flex w-80 bg-white dark:bg-[#0F172A] border-l border-slate-200 dark:border-slate-800 flex-col p-6 overflow-y-auto">
 <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-wider">اقتراحات سريعة</h2>
 
 <div className="space-y-3">
 <button onClick={() => setQuery('لخص لي مبيعات اليوم حسب الفروع')} className="w-full text-right p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group">
 <TrendingUp className="w-5 h-5 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
 <p className="text-sm font-medium text-slate-700 dark:text-slate-300">لخص لي مبيعات اليوم حسب الفروع</p>
 </button>
 
 <button onClick={() => setQuery('ما هي المنتجات التي وصلت للحد الأدنى من المخزون؟')} className="w-full text-right p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group">
 <AlertCircle className="w-5 h-5 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
 <p className="text-sm font-medium text-slate-700 dark:text-slate-300">الأصناف التي تحتاج إعادة طلب؟</p>
 </button>

 <button onClick={() => setQuery('أنشئ مسودة قيد يومية لرواتب هذا الشهر')} className="w-full text-right p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group">
 <FileText className="w-5 h-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
 <p className="text-sm font-medium text-slate-700 dark:text-slate-300">تجهيز قيد استحقاق الرواتب</p>
 </button>
 </div>

 <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
 <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-5 rounded-2xl text-white relative overflow-hidden shadow-lg">
 <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-br-full pointer-events-none"></div>
 <Sparkles className="w-6 h-6 mb-3 text-indigo-200" />
 <h3 className="font-bold mb-1">{_t('Nama AI Vision', 'Nama AI Vision')}</h3>
 <p className="text-xs text-indigo-100 opacity-90">يمكنك رفع صورة فاتورة وسأقوم باستخراج بياناتها وإنشاء قيد مالي تلقائياً.</p>
 </div>
 </div>
 </div>

 {/* Right Side: Chat Interface */}
 <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#020617] relative">
 {/* Background Pattern */}
 <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

 {/* Chat Area */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 pb-32 scroll-smooth">
 {chat.map((msg, idx) => (
 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
 <div className={`flex max-w-[85%] lg:max-w-[70%] ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
 {/* Avatar */}
 <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'ml-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'mr-3 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md'}`}>
 {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
 </div>
 
 {/* Bubble */}
 <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
 <div className={`p-4 rounded-2xl ${
 msg.role === 'user' 
 ? 'bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-sm shadow-sm' 
 : 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 text-indigo-900 dark:text-indigo-100 rounded-tl-sm shadow-sm'
 }`}>
 <p className="leading-relaxed">{msg.text}</p>
 </div>

 {/* Dynamic Widgets injected by AI */}
 {msg.widget === 'sales_chart' && (
 <div className="mt-3 p-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm w-full max-w-sm">
 <div className="flex justify-between items-center mb-4">
 <span className="font-bold text-sm ">مبيعات الأسبوع</span>
 <PieChart className="w-4 h-4 text-emerald-500" />
 </div>
 <div className="flex items-end gap-2 h-24 mt-2">
 {['20%', '40%', '30%', '60%', '80%', '50%', '90%'].map((h, i) => (
 <div key={i} className="flex-1 bg-indigo-100 dark:bg-indigo-900/50 rounded-t-md relative group">
 <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t-md transition-all duration-700" style={{ height: h }}></div>
 </div>
 ))}
 </div>
 <button className="w-full mt-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 transition-colors">
 فتح التقرير المفصل
 </button>
 </div>
 )}

 {msg.widget === 'inventory_alert' && (
 <div className="mt-3 p-4 bg-white dark:bg-[#0F172A] border border-red-200 dark:border-red-900/30 rounded-xl shadow-sm w-full max-w-sm">
 <div className="flex justify-between items-center mb-3">
 <span className="font-bold text-sm text-red-600 dark:text-red-400">تنبيه مخزون حرج</span>
 <AlertCircle className="w-4 h-4 text-red-500" />
 </div>
 <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4 font-[Fira_Code]">
 <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1"><span>ورق A4 (كرتون)</span> <span className="text-red-500 font-bold">2 متبقي</span></li>
 <li className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1"><span>حبر طابعة HP</span> <span className="text-red-500 font-bold">0 متبقي</span></li>
 </ul>
 <button className="w-full flex justify-center items-center py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
 <Zap className="w-3 h-3 ml-1" /> إنشاء أمر شراء آلي
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 ))}

 {loading && (
 <div className="flex justify-end animate-in fade-in duration-300">
 <div className="flex flex-row-reverse max-w-[70%]">
 <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mr-3 bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md">
 <Bot className="w-6 h-6 text-white" />
 </div>
 <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-tl-sm flex items-center space-x-1">
 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Input Area */}
 <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-[#020617] dark:via-[#020617] z-20 pt-10">
 <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
 <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
 <div className="relative flex items-center bg-white dark:bg-[#0F172A] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2">
 <button type="button" className="p-3 text-slate-400 hover:text-indigo-600 transition-colors">
 <Plus className="w-6 h-6" />
 </button>
 <input 
 type="text" 
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="اسأل النظام، اطلب تقريراً، أو أعطِ أمراً..."
 className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-100 text-lg px-4 outline-none placeholder-slate-400"
 disabled={loading}
 />
 <button 
 type="submit" 
 disabled={!query.trim() || loading}
 className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
 >
 <Send className="w-5 h-5 -ml-1" style={{ transform: 'rotate(180deg)' }} />
 </button>
 </div>
 <p className="text-center text-xs text-slate-400 mt-3 font-[Fira_Code]">{_t('Copilot can make mistakes. Consider verifying important financial data.', 'Copilot can make mistakes. Consider verifying important financial data.')}</p>
 </form>
 </div>
 </div>

 </div>
 </div>
 );
}

// Inline User Icon
function UserIcon(props: any) {
 return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
