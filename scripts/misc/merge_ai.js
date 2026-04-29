const fs = require('fs');
const path = 'c:/Users/1/Desktop/alfa/src/app/page.tsx';
let txt = fs.readFileSync(path, 'utf8');

// 1. Update React Imports
txt = txt.replace(
  `import React, { useState } from "react";`,
  `import React, { useState, useMemo } from "react";`
);

// 2. Add Search to lucide-react imports
txt = txt.replace(
  `ChevronDown, ChevronUp, ArrowLeft, Menu, X\n} from "lucide-react";`,
  `ChevronDown, ChevronUp, ArrowLeft, Menu, X, Search\n} from "lucide-react";`
);

// 3. Update Component States & useMemo
const newTop = `export default function NamaInvestLanding() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredModules = useMemo(() => {
    return modulesList.filter(m => {
      const matchesTab = activeTab === 'all' || m.cat === activeTab;
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);`;

txt = txt.replace(
  /export default function NamaInvestLanding\(\) \{[\s\S]*?const filtered.*?;/,
  newTop
);

// 4. Wrap Hero to Modules in <main> and change div to section
txt = txt.replace(
  /\{?\/\*\s*HERO\s*\*\/\s*\}?\s*<div className="bg-gradient-to-br/,
  `<main>\n      {/* HERO */}\n      <section className="bg-gradient-to-br`
);
txt = txt.replace(
  /<\/div>\s*\{?\/\*\s*── INDUSTRIES/g,
  `</section>\n\n      {/* ── INDUSTRIES`
);

// 5. Update Industries section wrapper
txt = txt.replace(
  /<section id="industries" className="max-w-7xl mx-auto w-full px-4 py-20">/g,
  `<section id="industries" className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center">`
);

// 6. Update Modules section wrapper and add Search Bar
const modulesHeaderOld = `<div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            🗂️ الموسوعة الكاملة — Complete Feature Matrix
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-3">104 وحدة برمجية متكاملة</h2>
          <p className="text-slate-500 text-lg">اضغط على أي قسم للتصفية</p>
        </div>`;

const modulesHeaderNew = `<div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            🗂️ الموسوعة الكاملة
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4">104 وحدة برمجية متكاملة</h2>
          
          {/* البحث الذكي الجديد */}
          <div className="relative max-w-md mx-auto mt-8 mb-12">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="ابحث عن ميزة، وحدة، أو وظيفة..." 
              className="w-full pr-12 pl-4 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>`;

txt = txt.replace(modulesHeaderOld, modulesHeaderNew);

// Change filtered to filteredModules in JSX
txt = txt.replace(/\{filtered\.map\(\(m\)/g, `{filteredModules.map((m)`);
txt = txt.replace(/filtered\.length/g, `filteredModules.length`);

txt = txt.replace(
  /<section id="modules" className="max-w-7xl mx-auto w-full px-4 py-20">/g,
  `<section id="modules" className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center">`
);

// End the main wrapper right before CTA
txt = txt.replace(
  /\{?\/\*\s*CTA\s*\*\/\}/,
  `</main>\n\n      {/* CTA */}`
);

// Semantic improvements on nav and footer centering
txt = txt.replace(
  /<footer className="py-8 bg-white border-t border-slate-200">/,
  `<footer className="py-12 bg-white border-t border-slate-200">`
);

// Make Modules mapping handle empty state
const emptyStateNew = `          {filteredModules.map((m) => (
            <div key={m.title} className="group bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-300">
              <div className="w-11 h-11 bg-indigo-50 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center text-indigo-600 group-hover:text-white mb-4 transition-all duration-300">{m.icon}</div>
              <h3 className="text-sm font-bold text-slate-800 mb-2 leading-tight group-hover:text-indigo-700 transition-colors">{m.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
        
        {filteredModules.length === 0 && (
          <div className="text-center py-20 w-full">
            <p className="text-slate-400 font-bold">لا توجد نتائج تطابق بحثك 🔍</p>
          </div>
        )}`;

txt = txt.replace(
  /\{filteredModules\.map\(\(m\)\s*=>\s*\([\s\S]*?<\/div>\s*\)\)\}\s*<\/div>/,
  emptyStateNew
);

fs.writeFileSync(path, txt, 'utf8');
console.log('Merge complete!');
