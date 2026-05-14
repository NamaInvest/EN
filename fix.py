import re

def fix_page_tsx():
    filepath = 'd:/namasoft9-3-main/src/app/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the start of the return statement
    start_index = content.find('  return (\n    <div className="min-h-screen bg-[#fbf8fa] text-slate-800 font-sans')
    
    if start_index == -1:
        print("Could not find start index")
        return

    new_return = """  return (
    <div className="min-h-screen bg-[#fbf8fa] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900" dir="rtl">
      
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Kufi+Arabic:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Noto Kufi Arabic', 'Outfit', sans-serif !important; }

        @keyframes bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}} />

      {/* TopNavBar Shell */}
      <nav className="fixed top-8 inset-x-0 mx-auto w-[90%] max-w-7xl rounded-full border border-slate-200/60 bg-white/70 backdrop-blur-3xl shadow-sm flex justify-between items-center px-8 py-3 z-50 transition-all duration-500 hover:shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-slate-800 tracking-tighter">نما إنفست</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#platform" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">المنصة</Link>
          <Link href="#modules" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">الوحدات</Link>
          <Link href="#intelligence" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">الذكاء</Link>
          <Link href="/pricing" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">الأسعار</Link>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="hidden lg:block text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">تسجيل الدخول</Link>
          <Link href="/sign-up" className="bg-slate-800 text-white px-8 py-3 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-md">ابدأ مجاناً</Link>
        </div>
        {/* Mobile Toggle */}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6 pt-20">
          <Link href="#platform" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800">المنصة</Link>
          <Link href="#intelligence" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800">الذكاء الاصطناعي</Link>
          <Link href="#modules" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800">الوحدات البرمجية</Link>
          <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800">الأسعار</Link>
          <div className="w-16 h-px bg-slate-200 my-4"></div>
          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-slate-600">تسجيل الدخول</Link>
          <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold bg-slate-900 text-white px-8 py-4 rounded-full mt-4">ابدأ مجاناً</Link>
        </div>
      )}

      <main className="pt-20">
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-6 md:px-16 overflow-hidden flex flex-col items-center">
          <div className="w-full max-w-7xl mx-auto flex flex-col items-center text-center">
            <span className="inline-block px-5 py-2 rounded-full bg-slate-200/50 text-slate-700 text-xs font-bold mb-8">
              الإصدار الجديد 2.0 (متوافق مع ZATCA)
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl leading-[1.2] font-extrabold tracking-tight text-slate-800 mb-8 max-w-4xl mx-auto">
              البساطة تلتقي <span className="text-indigo-600">بالقوة</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-16 leading-relaxed font-medium">
              الجيل القادم من أنظمة إدارة الأعمال ERP. أدر عملياتك المعقدة بدقة متناهية من منصة سحابية واحدة مصممة لجميع القطاعات.
            </p>
            <div className="relative w-full max-w-5xl mx-auto flex justify-center" style={{ animation: 'bob 6s ease-in-out infinite' }}>
              <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-[100px] -z-10"></div>
              <img 
                alt="NamaInvest Dashboard Preview" 
                className="w-full rounded-3xl shadow-2xl border border-white/60 backdrop-blur-sm" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDetA7XFFV0AEGWaDfNxFYTCpvJky3yWsBc8h3_Oi5YPysNWxfkQOokhJE9xKpVkhoSQlOldeay-ig_sTc974dgOVx7pWzuZmEma4s-JtD12c-SDKDyp-mWppUNCCY_fsWoyWjrDOfglQ2vidJ2NR54UrZAqiOjCk9CpSCWrPUHBTepuyAY2elnsuGngE8fAB9WYFuNNCSZUe6L9qjtefdnWSaLIJ6gNeeyididKIza1UIQ-NIWI0j7kc17Ofxvub8YXrsg4XIPwEc" 
              />
            </div>
          </div>
        </section>

        {/* Feature 1: Intuitive Workflow */}
        <section id="platform" className="py-32 px-6 md:px-16 w-full flex flex-col items-center">
          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 md:gap-20">
            <div className="flex-1 w-full flex flex-col text-right order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">سير عمل بديهي</h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium">
                توقف عن محاربة أدواتك. يوفر نما إنفست بيئة خالية من الاحتكاك حيث تبدو كل خطوة طبيعية وكل نقرة مقصودة بدقة.
              </p>
              <ul className="space-y-5 flex flex-col text-right">
                <li className="flex items-center gap-4 self-start">
                  <CheckCircle className="text-indigo-600 w-6 h-6 shrink-0" />
                  <span className="text-lg font-bold text-slate-700">ترابط آلي بين كافة الوحدات (POS, ERP, HR)</span>
                </li>
                <li className="flex items-center gap-4 self-start">
                  <CheckCircle className="text-indigo-600 w-6 h-6 shrink-0" />
                  <span className="text-lg font-bold text-slate-700">اختصارات ذكية للوصول السريع للمهام</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full order-1 md:order-2">
              <div className="rounded-3xl overflow-hidden shadow-2xl aspect-square">
                <img 
                  alt="Workflow Graphics" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDD-K3QalGsP6Ws05rYapRN9D5M7DFfl_ZK0JrXhqQFUi09w-jMJeb5uRx9kbpS7lpVwsBcDsjoMdzPXQ3PnjHYXibex1NdRnMli1wyENg_GelbOJx9KCrQNyqvowl44goB0mYxp-jQ3-0b6vVOLKQHLFqvIJOIJh8iPlyFv24kWg6pjGLpyF63JmHpYvem9vVGgcqtzQOtFq_x0S8XIF4whndFHq8wq4D1RYwOxWaN2ovm8IkrUpHryRZbKGSPPSbqIF8h4zVHi3M" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: Deep Intelligence */}
        <section id="intelligence" className="py-32 px-6 md:px-16 bg-slate-200/30 w-full flex flex-col items-center">
          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 md:gap-20">
            <div className="flex-1 w-full">
              <div className="rounded-3xl overflow-hidden shadow-2xl aspect-square">
                <img 
                  alt="Intelligence Graphics" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVgJIJ94405PL6aatLlom1pVPRzZyFE6EsvjkppgBGgMDu2CJLRyJzrnWdeEvcZLaMU0DXs14Zo7aXnp86HRwddbxTOidt9hBxWz6W94vsWIlrTvmgZUrFWGxxkohO_Nv-Wh8BWrNGQQhTvF-sQQRCPL63pq9ilVbUnphTxNqmjBLBWfriohuDP7MO_orhnCUlR5B3CYcG4679rn40DbzkwPSOy5K5BXkqNUnhIrxSkm_RturAuyFek-CQF-3K29synNaW48c6bAo" 
                />
              </div>
            </div>
            <div className="flex-1 w-full flex flex-col text-right">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">ذكاء اصطناعي عميق</h2>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium">
                أكثر من مجرد مقاييس. يقوم محركنا بتحليل الأنماط عبر نظامك البيئي بأكمله لاستخراج الرؤى المالية والتنبؤ بالمبيعات قبل أن تطلبها.
              </p>
              <div className="grid grid-cols-2 gap-6 text-center">
                <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                  <span className="text-4xl md:text-5xl font-extrabold text-indigo-600 block mb-2">99%</span>
                  <span className="text-sm font-bold text-slate-500">دقة التحليل المالي</span>
                </div>
                <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                  <span className="text-4xl md:text-5xl font-extrabold text-indigo-600 block mb-2">2.4x</span>
                  <span className="text-sm font-bold text-slate-500">زيادة الكفاءة التشغيلية</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Directory */}
        <section id="modules" className="py-32 px-6 md:px-16 w-full flex flex-col items-center">
          <div className="w-full max-w-7xl mx-auto flex flex-col items-center text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-6">104+ وحدة برمجية متكاملة</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
              كل ما تحتاجه في مكان واحد. من المشتريات والمبيعات إلى نقاط البيع والمحاسبة المعقدة.
            </p>
          </div>
          
          <div className="w-full max-w-4xl mx-auto flex flex-wrap justify-center gap-3 mb-16">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveTab(cat.id)}
                className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab===cat.id 
                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-300' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredModules.slice(0, 16).map((m) => (
              <div key={m.title} className="group p-8 rounded-3xl bg-white border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors mb-6 shrink-0">
                  {m.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{m.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{m.desc}</p>
              </div>
            ))}
          </div>
          
          {filteredModules.length > 16 && (
            <div className="text-center mt-12 w-full flex justify-center">
              <button className="px-8 py-4 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">
                عرض المزيد من الوحدات
              </button>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 md:px-16 w-full flex flex-col items-center">
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
            <div className="w-full relative bg-white rounded-[3rem] p-12 md:p-32 text-center border border-slate-100 overflow-hidden shadow-2xl flex flex-col items-center">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] -z-10"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[120px] -z-10"></div>
              
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-8 leading-tight">جاهز لرفع مستوى عملك؟</h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-12 font-medium">
                انضم إلى أكثر من 500 شركة تعتمد على نما إنفست لإعادة تعريف الدقة التشغيلية والمالية.
              </p>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full md:w-auto">
                <Link href="/sign-up" className="bg-slate-800 text-white px-12 py-5 rounded-full text-lg font-bold shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all duration-400 w-full md:w-auto text-center">
                  ابدأ مجاناً الآن
                </Link>
                <Link href="/pricing" className="px-12 py-5 rounded-full text-lg font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-400 w-full md:w-auto text-center">
                  جدولة عرض توضيحي
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer Shell */}
      <footer className="w-full py-16 border-t border-slate-200/60 bg-transparent flex flex-col items-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-16 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-right">
          <div className="flex flex-col gap-2 items-center md:items-start">
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">نما إنفست</span>
            <p className="text-slate-400 text-sm font-bold">© {new Date().getFullYear()} NamaInvest. مبني من أجل الدقة والموثوقية.</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-8 text-sm font-bold text-slate-500">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">الخصوصية</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">الشروط</Link>
            <Link href="/security" className="hover:text-slate-900 transition-colors">الأمان</Link>
            <Link href="/status" className="hover:text-slate-900 transition-colors">حالة النظام</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
"""

    new_content = content[:start_index] + new_return
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == '__main__':
    fix_page_tsx()
