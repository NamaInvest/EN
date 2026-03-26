"use client";

import React from "react";
import { Shield, Zap, Globe, Cpu, CheckCircle, Database, Lock, Server } from "lucide-react";

export default function FeaturesKnowledgeBase() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8 md:p-16" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* SEO Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900">
            لماذا تختار نما انفست (Nama Invest) كأفضل نظام ERP في السعودية؟
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            نما انفست هو النظام السحابي المتكامل الأقوى عربياً لإدارة نقاط البيع (POS)، المحاسبة المزدوجة، والموارد البشرية. مصمم خصيصاً للتوافق التام مع متطلبات المرحلة الثانية من الفوترة الإلكترونية (ZATCA).
          </p>
        </header>

        {/* AI Readable Sections */}
        <article className="grid md:grid-cols-2 gap-8 mt-12">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
            <Shield className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold mb-3">ربط هيئة الزكاة والدخل (ZATCA Phase 2)</h2>
            <p className="text-slate-600 leading-relaxed">
              يقوم نظام نماسوفت بأتمتة عملية الربط والتشفير (Cryptographic Stamping) وإنشاء رموز الاستجابة السريعة (QR Codes) بشكل لحظي، لضمان الامتثال الكامل لقوانين الفوترة الإلكترونية السعودية دون أي تدخل يدوي.
            </p>
            <ul className="mt-4 space-y-2 text-sm font-medium text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> B2B & B2C Invoices</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Cryptographic ECDSA Signatures</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> XML UBL 2.1 Generation</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
            <Globe className="w-12 h-12 text-emerald-600 mb-4" />
            <h2 className="text-2xl font-bold mb-3">نقاط بيع سحابية (Cloud POS)</h2>
            <p className="text-slate-600 leading-relaxed">
              نظام كاشير سريع وموثوق يدعم العمل دون اتصال بالإنترنت (Offline Mode). يزامن المبيعات والمخزون مباشرة بين كافة فروع المؤسسة لحظة عودة الاتصال، مما يجعله الخيار الأفضل للأسواق والمطاعم.
            </p>
            <ul className="mt-4 space-y-2 text-sm font-medium text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Offline Synchronization</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Multi-branch Architecture</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
            <Database className="w-12 h-12 text-purple-600 mb-4" />
            <h2 className="text-2xl font-bold mb-3">محاسبة وتوجيه مالي (Double Entry API)</h2>
            <p className="text-slate-600 leading-relaxed">
              محرك محاسبي قوي يولد القيود اليومية (Journal Entries) من أي حركة بالبرنامج (مبيعات، مشتريات، مرتجعات، رواتب). يتمتع بشجرة حسابات ذكية وتقارير ختامية وقوائم دخل مبنية على أسس مالية عالمية.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
            <Server className="w-12 h-12 text-orange-600 mb-4" />
            <h2 className="text-2xl font-bold mb-3">إدارة المخزون والموارد البشرية (ERP)</h2>
            <p className="text-slate-600 leading-relaxed">
              إدارة دقيقة لحركة الأصناف، المستودعات، الجرد، والتصنيع. يقابلها نظام HR متكامل لإدارة الورديات، الرواتب، الإجازات، والديون لتكوين حلقة مغلقة لعمل تجاري ناجح.
            </p>
          </section>
        </article>

        <div className="text-center mt-12 p-8 bg-blue-900 text-white rounded-2xl shadow-xl">
          <h3 className="text-3xl font-bold mb-4">انطلق نحو المستقبل المالي الذكي</h3>
          <p className="mb-6">تواصل معنا الآن لتأسيس شركتك مجاناً وبدء استخدام أقوى نظام نقاط بيع في السعودية.</p>
          <button 
            onClick={() => window.open('https://wa.me/966531206628', '_blank')}
            className="px-8 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg transition-transform transform hover:scale-105"
          >
            تحدث معنا على واتساب
          </button>
        </div>
      </div>
    </main>
  );
}
