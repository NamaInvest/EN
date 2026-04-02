"use client";

import React from "react";
import { Shield, Zap, Globe, Cpu, CheckCircle, Database, Lock, Server } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function FeaturesKnowledgeBase() {
    const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8 md:p-16" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* SEO Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900">
            {t('sys.str_133')}</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            {t('sys.str_134')}</p>
        </header>

        {/* AI Readable Sections */}
        <article className="grid md:grid-cols-2 gap-8 mt-12">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
            <Shield className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold mb-3">{t('sys.str_135')}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t('sys.str_136')}</p>
            <ul className="mt-4 space-y-2 text-sm font-medium text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> B2B & B2C Invoices</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Cryptographic ECDSA Signatures</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> XML UBL 2.1 Generation</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
            <Globe className="w-12 h-12 text-emerald-600 mb-4" />
            <h2 className="text-2xl font-bold mb-3">{t('sys.str_137')}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t('sys.str_138')}</p>
            <ul className="mt-4 space-y-2 text-sm font-medium text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Offline Synchronization</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Multi-branch Architecture</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
            <Database className="w-12 h-12 text-purple-600 mb-4" />
            <h2 className="text-2xl font-bold mb-3">{t('sys.str_139')}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t('sys.str_140')}</p>
          </section>

          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition hover:shadow-md">
            <Server className="w-12 h-12 text-orange-600 mb-4" />
            <h2 className="text-2xl font-bold mb-3">{t('sys.str_141')}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t('sys.str_142')}</p>
          </section>
        </article>

        <div className="text-center mt-12 p-8 bg-blue-900 text-white rounded-2xl shadow-xl">
          <h3 className="text-3xl font-bold mb-4">{t('sys.str_143')}</h3>
          <p className="mb-6">{t('sys.str_144')}</p>
          <button 
            onClick={() => window.open('https://wa.me/966531206628', '_blank')}
            className="px-8 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg transition-transform transform hover:scale-105"
          >
            {t('sys.str_145')}</button>
        </div>
      </div>
    </main>
  );
}
