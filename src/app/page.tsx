"use client";

export const dynamic = "force-dynamic";

import React from "react";
import { 
  ShieldCheck, Bot, MessageCircle, ShoppingCart, 
  FileSpreadsheet, Building, Wallet, Users, 
  Fingerprint, Box, Database, Factory, 
  FileSignature, Cpu, TrendingUp, Truck, 
  Wrench, Home, Layers,
  Phone
} from "lucide-react";

// Hardcoded Arabic without translations
const modulesList = [
  { icon: <ShieldCheck size={20}/>, title: "فاتورة الزكاة", desc: "ربط B2C و B2B" },
  { icon: <Bot size={20}/>, title: "الذكاء الاصطناعي", desc: "قراءة فواتير المشتريات آلياً" },
  { icon: <MessageCircle size={20}/>, title: "بوت تليجرام", desc: "اعتمادات إدارية عبر البوت" },
  { icon: <MessageCircle size={20} color="#25D366"/>, title: "واتساب CRM", desc: "أتمتة المراسلات" },
  { icon: <ShoppingCart size={20}/>, title: "نقاط بيع سحابية", desc: "مزامنة تلقائية للأوفلاين" },
  { icon: <FileSpreadsheet size={20}/>, title: "محاسبة مالية", desc: "مرونة الدليل وشجرة حسابات" },
  { icon: <Building size={20}/>, title: "إدارة العقارات", desc: "إدارة الأملاك وعقود الإيجار" },
  { icon: <Wallet size={20}/>, title: "شئون الموظفين", desc: "إدارة الرواتب والسلف والاستقطاعات" },
  { icon: <Users size={20}/>, title: "تكامل التأمينات", desc: "تسجيل الموظفين والربط الحكومي" },
  { icon: <Fingerprint size={20}/>, title: "أجهزة البصمة", desc: "ربط الدوام الحضور والانصراف" },
  { icon: <Box size={20}/>, title: "تتبع الصلاحيات", desc: "نظام FEFO للمواد الاستهلاكية" },
  { icon: <Database size={20}/>, title: "نظام السريال", desc: "تتبع الأجهزة وضمان الصيانة" },
  { icon: <Factory size={20}/>, title: "أوامر التصنيع", desc: "معادلات التصنيع والتكاليف" },
  { icon: <FileSignature size={20}/>, title: "التوريد والمخازن", desc: "مذكرات الاستلام والتوزيع" },
  { icon: <Cpu size={20}/>, title: "Landed Costs", desc: "توزيع المصاريف والشحنات" },
  { icon: <TrendingUp size={20}/>, title: "تحليل الأداء", desc: "تتبع مؤشرات النمو والمبيعات" },
  { icon: <Truck size={20}/>, title: "إدارة الأسطول", desc: "خطوط السير وصيانة المركبات" },
  { icon: <Wrench size={20}/>, title: "مراكز صيانة", desc: "استقبال أجهزة وطلبات الفحص" },
  { icon: <Home size={20}/>, title: "المقاولات", desc: "إدارة المشاريع والمستخلصات" }
];

export default function Variant5Landing() {
  return (
    <div className="min-h-screen font-sans selection:bg-blue-200 overflow-x-hidden" dir="rtl" style={{ background: '#F8FAFC', color: '#0F172A' }}>
      {/* FORCE CAIRO FONT MINIMALLY */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Cairo', sans-serif !important; }
      `}} />

      {/* FIXED NAVBAR WITH NO SYS.STR */}
      <nav className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
           {/* Logo */}
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/20">
                 <Layers className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">نما إنفست</span>
           </div>
           
           {/* Center Links (REPLACED SYS.STR_9, 10, 11) */}
           <div className="hidden md:flex gap-8 font-bold text-slate-600 text-sm">
              <a href="#" className="hover:text-indigo-600">الرئيسية</a>
              <a href="#features" className="hover:text-indigo-600">مجموعة الأنظمة</a>
              <a href="#" className="hover:text-indigo-600">القطاعات المدعومة</a>
           </div>

           {/* CTA */}
           <div className="flex gap-4">
              <button onClick={() => window.location.href = 'https://n1.namainvist.com/login'} className="text-slate-600 font-bold text-sm hidden sm:block hover:text-indigo-600">تسجيل الدخول</button>
              <button onClick={() => window.location.href = 'https://n1.namainvist.com/login'} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md shadow-indigo-600/30 transition-all">الدخول للنظام</button>
           </div>
        </div>
      </nav>

      {/* MASSIVE 73-MODULE VARIANT 5 GRID */}
      <div style={{ padding: '60px', minHeight: 'calc(100vh - 80px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '50px' }}>
          
          {/* HEADER SECTION */}
          <div style={{ flex: '1 1 40%', minWidth: '300px' }}>
            <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, marginBottom: '20px' }}>
              نظام مؤسسي متكامل <br/>
              <span style={{ color: '#4F46E5', fontSize: 'clamp(24px, 3vw, 40px)' }}>(73 قسم برمجي في بيئة موحدة)</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#475569', marginBottom: '40px', lineHeight: 1.6 }}>
              من نقاط البيع وإدارة المخزون المتقدمة إلى المحاسبة المالية الدقيقة وعقود الإيجار. نظام نما إنفست السحابي يدمج أعمالك المبعثرة تحت لوحة تحكم مركزية. متوافق 100% مع هيئة الزكاة.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-6">
                <button onClick={() => window.location.href = 'https://n1.namainvist.com/login'} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-lg">
                  جرب النظام مجاناً الآن
                </button>
                <button onClick={() => window.open('https://wa.me/966531206628', '_blank')} className="px-8 py-4 bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-lg">
                  <Phone className="w-5 h-5" /> تواصل معنا
                </button>
             </div>
          </div>

          {/* GRID SECTION */}
          <div style={{ flex: '1 1 50%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            {modulesList.map((f, i) => (
              <div key={i} className="hover:-translate-y-1 transition-all duration-300" style={{ background: '#FFFFFF', padding: '20px', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ color: '#4F46E5', marginBottom: '10px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F172A', marginBottom: '5px' }}>{f.title}</h3>
                <p style={{ color: '#64748B', fontSize: '12px', lineHeight: '1.4' }}>{f.desc}</p>
              </div>
            ))}
          </div>
          
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-12 bg-white border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-slate-500 font-bold text-sm">© {new Date().getFullYear()} جميع الحقوق محفوظة لشركة نما إنفست</div>
           <div className="flex gap-6 text-sm font-bold text-slate-400">
             <span className="hover:text-indigo-600 cursor-pointer transition-colors">الشروط والأحكام</span>
             <span className="hover:text-indigo-600 cursor-pointer transition-colors">سياسة الخصوصية</span>
           </div>
        </div>
      </footer>
    </div>
  );
}
