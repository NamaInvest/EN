const fs = require('fs');

const files = [
  'src/app/design1/page.tsx',
  'src/app/design2/page.tsx',
  'src/app/design3/page.tsx',
  'src/app/design4/page.tsx',
];

const newSectionHtmlJsx = `
        {/* Value Proposition Floating Bar */}
        <section className="relative z-30 -mt-16 lg:-mt-24 mb-20 px-6 max-w-[100rem] mx-auto reveal-hidden">
          <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-8 lg:p-12 border border-slate-100">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              
              <div className="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300 border-b md:border-b-0 md:border-l border-slate-100/80">
                <div className="w-20 h-20 mx-auto bg-emerald-50/80 text-[#10b981] rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-[#10b981] group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[40px]" style={{fontFamily: 'Material Symbols Outlined'}}>query_stats</span>
                </div>
                <h3 className="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">ركّز على نمو أعمالك..<br/>ودع المحاسبة علينا</h3>
              </div>

              <div className="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300 border-b md:border-b-0 md:border-l border-slate-100/80">
                <div className="w-20 h-20 mx-auto bg-blue-50/80 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[40px]" style={{fontFamily: 'Material Symbols Outlined'}}>dashboard_customize</span>
                </div>
                <h3 className="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">تحكّم كامل في ماليتك<br/>من شاشة واحدة</h3>
              </div>

              <div className="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300 border-b md:border-b-0 md:border-l border-slate-100/80">
                <div className="w-20 h-20 mx-auto bg-purple-50/80 text-purple-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[40px]" style={{fontFamily: 'Material Symbols Outlined'}}>trending_up</span>
                </div>
                <h3 className="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">اتخذ قراراتك بناءً على<br/>أرقام دقيقة وفورية</h3>
              </div>

              <div className="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300">
                <div className="w-20 h-20 mx-auto bg-orange-50/80 text-orange-500 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[40px]" style={{fontFamily: 'Material Symbols Outlined'}}>corporate_fare</span>
                </div>
                <h3 className="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">من شركة ناشئة إلى كبرى..<br/>نظام واحد يكبر معك</h3>
              </div>

            </div>
          </div>
        </section>
`;

const newSectionHtmlRaw = `
<!-- Value Proposition Floating Bar -->
<section class="relative z-30 -mt-16 lg:-mt-24 mb-20 px-6 max-w-[100rem] mx-auto reveal-hidden">
  <div class="bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-8 lg:p-12 border border-slate-100">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
      
      <div class="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300 border-b md:border-b-0 md:border-l border-slate-100/80">
        <div class="w-20 h-20 mx-auto bg-emerald-50/80 text-[#10b981] rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-[#10b981] group-hover:text-white transition-all duration-300">
          <span class="material-symbols-outlined text-[40px]" style="font-family: 'Material Symbols Outlined';">query_stats</span>
        </div>
        <h3 class="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">ركّز على نمو أعمالك..<br/>ودع المحاسبة علينا</h3>
      </div>

      <div class="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300 border-b md:border-b-0 md:border-l border-slate-100/80">
        <div class="w-20 h-20 mx-auto bg-blue-50/80 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
          <span class="material-symbols-outlined text-[40px]" style="font-family: 'Material Symbols Outlined';">dashboard_customize</span>
        </div>
        <h3 class="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">تحكّم كامل في ماليتك<br/>من شاشة واحدة</h3>
      </div>

      <div class="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300 border-b md:border-b-0 md:border-l border-slate-100/80">
        <div class="w-20 h-20 mx-auto bg-purple-50/80 text-purple-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
          <span class="material-symbols-outlined text-[40px]" style="font-family: 'Material Symbols Outlined';">trending_up</span>
        </div>
        <h3 class="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">اتخذ قراراتك بناءً على<br/>أرقام دقيقة وفورية</h3>
      </div>

      <div class="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300">
        <div class="w-20 h-20 mx-auto bg-orange-50/80 text-orange-500 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
          <span class="material-symbols-outlined text-[40px]" style="font-family: 'Material Symbols Outlined';">corporate_fare</span>
        </div>
        <h3 class="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">من شركة ناشئة إلى كبرى..<br/>نظام واحد يكبر معك</h3>
      </div>

    </div>
  </div>
</section>
`;

const injectLinkJs = `
    // Inject Fonts dynamically to avoid Next.js stripping them
    if (!document.getElementById('fonts-css')) {
      const link1 = document.createElement('link');
      link1.id = 'fonts-css';
      link1.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap";
      link1.rel = "stylesheet";
      document.head.appendChild(link1);

      const link2 = document.createElement('link');
      link2.id = 'icons-css';
      link2.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
      link2.rel = "stylesheet";
      document.head.appendChild(link2);
    }
`;

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  let content = fs.readFileSync(file, 'utf8');

  // Fix grid stacking in design1 and update Value Proposition section
  if (file === 'src/app/design1/page.tsx') {
    // Replace old jsx section with new style-driven one
    content = content.replace(/{\/\* Value Proposition Floating Bar \*\/}[\s\S]*?(?={\/\* Industries \*\/})/g, newSectionHtmlJsx + '\\n        ');
  } else {
    // Inject in design 2, 3, 4
    if (!content.includes('Value Proposition Floating Bar')) {
      // Find <!-- Industries --> and inject before it
      content = content.replace(/(<\/section>\s*)(<!-- Industries -->)/g, '$1' + newSectionHtmlRaw + '\\n$2');
    }
  }

  // Inject font loader into useEffect
  if (!content.includes('fonts-css')) {
    content = content.replace(/(\/\/ Inject Tailwind CDN)/g, injectLinkJs + '\\n    $1');
  }

  // Remove the old <link> tags that were failing to hydrate or load correctly
  content = content.replace(/<link href="https:\/\/fonts.googleapis.com[^>]+>/g, '');

  fs.writeFileSync(file, content);
}

console.log('Applied fixes to all files (icons, grid layout, missing sections).');
