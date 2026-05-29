const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = '46.4.188.170';

// Read the full 104-module report page to extract MODULES_DATA
const reportPage = fs.readFileSync('src/app/(dashboard)/reports/73-modules/page.tsx', 'utf8');

// Extract MODULES_DATA array
const modulesMatch = reportPage.match(/const MODULES_DATA = \[([\s\S]*?)\];\s*\ninterface/);
const modulesDataStr = modulesMatch ? `const MODULES_DATA = [${modulesMatch[1]}];` : 'const MODULES_DATA = [];';

// Build the complete _landing.tsx with all 104 modules
const landingContent = `"use client";
// v${Date.now()} - 104 modules marketing landing page

import React, { useState } from 'react';

${modulesDataStr}

const CATEGORIES = [
  { id: 'all', label: 'جميع الوحدات', emoji: '🧩' },
  { id: 'finance', label: 'المالية والمحاسبة', emoji: '💰' },
  { id: 'sales', label: 'المبيعات', emoji: '🛒' },
  { id: 'purchases', label: 'المشتريات', emoji: '📦' },
  { id: 'stock', label: 'المخزون', emoji: '🏭' },
  { id: 'hr', label: 'الموارد البشرية', emoji: '👥' },
  { id: 'crm', label: 'العملاء والتسويق', emoji: '🎁' },
  { id: 'ai', label: 'الذكاء الاصطناعي', emoji: '🧠' },
  { id: 'enterprise', label: 'قطاعات متخصصة', emoji: '🏢' },
  { id: 'admin', label: 'الإدارة والأمن', emoji: '⚙️' },
];

const CAT_COLORS: Record<string,string> = {
  finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sales: 'bg-blue-50 text-blue-700 border-blue-200',
  purchases: 'bg-orange-50 text-orange-700 border-orange-200',
  stock: 'bg-purple-50 text-purple-700 border-purple-200',
  hr: 'bg-pink-50 text-pink-700 border-pink-200',
  crm: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ai: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  enterprise: 'bg-teal-50 text-teal-700 border-teal-200',
  admin: 'bg-slate-50 text-slate-700 border-slate-200',
};

const CAT_LABELS: Record<string,string> = {
  finance: 'المالية', sales: 'المبيعات', purchases: 'المشتريات',
  stock: 'المخزون', hr: 'الموارد البشرية', crm: 'التسويق',
  ai: 'الذكاء الاصطناعي', enterprise: 'قطاعات متخصصة', admin: 'الإدارة',
};

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('all');

  const modulesList = activeTab === 'all'
    ? MODULES_DATA
    : MODULES_DATA.filter((m) => m.cat === activeTab);

  return (
    <div dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif" }}
      className="min-h-screen bg-white">

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow">
              <span className="text-white font-black text-sm">ن</span>
            </div>
            <span className="font-black text-slate-800 text-lg">نما إنفست</span>
          </div>
          <a href="/sign-in"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow hover:shadow-indigo-300/50 hover:-translate-y-0.5">
            دخول النظام ←
          </a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white py-20 px-4">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}/>
        <div className="absolute -top-40 right-10 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl"/>
        <div className="absolute -bottom-40 left-10 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl"/>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-4 py-1.5 rounded-full text-indigo-200 text-sm font-bold mb-8">
            <span>🚀</span> نظام ERP السعودي الأكثر شموليةً
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            نظام <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-400">نما إنفست</span>
            <br/>
            <span className="text-4xl md:text-5xl text-slate-200">لإدارة أعمالك بالكامل</span>
          </h1>

          <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
            منصة متكاملة تضم <span className="text-white font-black">104 وحدة برمجية</span> تغطي كل ما تحتاجه — من المحاسبة والمبيعات والمخزون إلى الذكاء الاصطناعي والقطاعات المتخصصة
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              { num: '104+', label: 'وحدة برمجية' },
              { num: 'ZATCA', label: 'مرحلة ثانية' },
              { num: 'AI', label: 'ذكاء اصطناعي' },
              { num: '24/7', label: 'دعم فني' },
            ].map(({ num, label }) => (
              <div key={num} className="bg-white/10 border border-white/20 backdrop-blur rounded-2xl px-6 py-4 text-center min-w-[110px]">
                <div className="text-2xl font-black text-white">{num}</div>
                <div className="text-xs text-slate-300 mt-1 font-semibold">{label}</div>
              </div>
            ))}
          </div>

          <a href="#modules"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-black px-8 py-4 rounded-2xl shadow-xl hover:shadow-white/20 hover:-translate-y-1 transition-all text-lg">
            استعرض الـ 104 وحدة ↓
          </a>
        </div>
      </section>

      {/* ── MODULES ──────────────────────────────────────────────── */}
      <section id="modules" className="py-16 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-3">موسوعة أنظمة نما إنفست</h2>
            <p className="text-slate-500 text-lg">104 وحدة برمجية متكاملة — اضغط على أي قسم للتصفية</p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={\`px-4 py-2 rounded-xl font-bold text-sm border transition-all \${
                  activeTab === cat.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }\`}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          <p className="text-center text-slate-400 text-sm mb-6 font-semibold">
            عرض {modulesList.length} من {MODULES_DATA.length} وحدة • {activeTab === 'all' ? 'جميع الأقسام' : CATEGORIES.find(c=>c.id===activeTab)?.label}
          </p>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {modulesList.map((mod, i) => (
              <div key={i}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-default">
                <div className="flex items-start justify-between mb-3">
                  <div className={\`px-2.5 py-1 rounded-lg text-xs font-bold border \${CAT_COLORS[mod.cat] || 'bg-slate-50 text-slate-600 border-slate-200'}\`}>
                    {CAT_LABELS[mod.cat] || mod.cat}
                  </div>
                </div>
                <h3 className="font-black text-slate-800 text-sm mb-2 leading-snug">{mod.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-900 to-blue-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black mb-4">جاهز لتحويل عملك رقمياً؟</h2>
          <p className="text-indigo-200 text-lg mb-8">انضم لمئات الشركات السعودية التي تثق في نما إنفست</p>
          <a href="/sign-in"
            className="inline-flex items-center gap-3 bg-white text-indigo-700 font-black px-10 py-5 rounded-2xl shadow-xl hover:shadow-white/30 hover:-translate-y-1 transition-all text-xl">
            ابدأ الآن — مجاناً ←
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="py-8 px-4 bg-slate-900 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} نما إنفست — نظام ERP متوافق مع ZATCA المرحلة الثانية</p>
      </footer>
    </div>
  );
}
`;

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { c.end(); return r(false); }
        const ws = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
        ws.on('close', () => { c.end(); r(true); });
        ws.on('error', () => { c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', () => r(false))
      .connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

function ssh(cmd, print = true) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => { out += d; if (print) process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => { out += d; });
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: SERVER, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
  });
}

// Save locally too
fs.writeFileSync('src/app/_landing.tsx', landingContent);

const moduleCount = (landingContent.match(/\{ cat:/g) || []).length;
console.log(`✅ _landing.tsx prepared: ${landingContent.length} bytes, ${moduleCount} modules`);

(async () => {
  console.log('\n=== Uploading new _landing.tsx ===');
  const ok = await writeFile('/www/wwwroot/namainvist.com/src/app/_landing.tsx', landingContent);
  console.log(ok ? '[✓] Uploaded successfully' : '[✗] Upload failed');

  console.log('\n=== Clean rebuild namainvist.com ===');
  await ssh('rm -rf /www/wwwroot/namainvist.com/.next /www/wwwroot/namainvist.com/node_modules/.cache 2>/dev/null && echo "Caches cleared"');
  await ssh('cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -8');
  await ssh('pm2 restart main-site 2>&1 | grep -E "✓|online|main-site"');
  await ssh('sleep 3');
  
  console.log('\n=== Verify: checking for "73" in live HTML ===');
  const check73 = await ssh('curl -s http://localhost:2999/ 2>/dev/null | grep -c "73"', false);
  const check104 = await ssh('curl -s http://localhost:2999/ 2>/dev/null | grep -c "104"', false);
  console.log(`"73" count in HTML: ${check73} (expected: 0)`);
  console.log(`"104" count in HTML: ${check104} (expected: >5)`);

  console.log('\n✅ Done! https://namainvist.com should now show 104 units');
})();
