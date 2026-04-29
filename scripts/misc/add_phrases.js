const fs = require('fs');
let content = fs.readFileSync('src/app/design1/page.tsx', 'utf8');

// Widen the layout
content = content.replace(/max-w-\[90rem\]/g, 'max-w-[100rem]');
content = content.replace(/px-10/g, 'px-6');

// The new section to inject
const newSection = `
        {/* Value Proposition Floating Bar */}
        <section className="relative z-30 -mt-16 lg:-mt-24 mb-20 px-6 max-w-[100rem] mx-auto reveal-hidden">
          <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-8 lg:p-12 border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100/80">
              
              <div className="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300">
                <div className="w-20 h-20 mx-auto bg-emerald-50/80 text-[#10b981] rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-[#10b981] group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[40px]">query_stats</span>
                </div>
                <h3 className="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">ركّز على نمو أعمالك..<br/>ودع المحاسبة علينا</h3>
              </div>

              <div className="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300">
                <div className="w-20 h-20 mx-auto bg-blue-50/80 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[40px]">dashboard_customize</span>
                </div>
                <h3 className="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">تحكّم كامل في ماليتك<br/>من شاشة واحدة</h3>
              </div>

              <div className="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300">
                <div className="w-20 h-20 mx-auto bg-purple-50/80 text-purple-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[40px]">trending_up</span>
                </div>
                <h3 className="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">اتخذ قراراتك بناءً على<br/>أرقام دقيقة وفورية</h3>
              </div>

              <div className="px-4 py-6 md:py-2 text-center group cursor-default hover:-translate-y-2 transition-all duration-300">
                <div className="w-20 h-20 mx-auto bg-orange-50/80 text-orange-500 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[40px]">corporate_fare</span>
                </div>
                <h3 className="text-[1.35rem] font-extrabold text-[#0f172a] leading-relaxed tracking-tight">من شركة ناشئة إلى كبرى..<br/>نظام واحد يكبر معك</h3>
              </div>

            </div>
          </div>
        </section>
`;

// Insert after the end of Hero Section (which ends with </section> before {/* Industries */})
content = content.replace(/(<\/section>\s*)({\/\* Industries \*\/})/g, '$1' + newSection + '\n        $2');

fs.writeFileSync('src/app/design1/page.tsx', content);
console.log('Value proposition added and layout widened.');
