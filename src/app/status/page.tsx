'use client';

import Link from 'next/link';

export default function StatusPage() {
    const services = [
        { name: 'المنصة الرئيسية (Main Platform)', status: 'يعمل (Operational)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { name: 'لوحات العناوين الفرعية (Tenant Dashboards)', status: 'يعمل (Operational)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { name: 'بوابة تسجيل الدخول والمصادقة (Authentication)', status: 'يعمل (Operational)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { name: 'محرك التأسيس الآلي (Provisioning Engine)', status: 'يعمل (Operational)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { name: 'أنظمة الدعم الفني والمزامنة (Support & Sync)', status: 'يعمل (Operational)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    ];

    return (
        <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 antialiased font-sans relative overflow-hidden">
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-3xl border-b border-slate-200/50 shadow-sm px-6 md:px-16 py-4 flex justify-between items-center">
                <div className="flex items-center gap-8 max-w-7xl mx-auto w-full">
                    <Link href="/" className="text-2xl font-bold text-slate-900 tracking-tight">
                        نما إنفست
                    </Link>
                    <div className="hidden md:flex items-center gap-6">
                        <Link className="text-slate-600 hover:text-blue-600 transition-colors font-medium" href="/">الرئيسية</Link>
                        <Link className="text-slate-600 hover:text-blue-600 transition-colors font-medium" href="/pricing">الأسعار</Link>
                    </div>
                    <div className="flex items-center gap-4 mr-auto">
                        <Link href="/sign-in" className="text-slate-600 hover:text-blue-600 transition-colors font-semibold text-sm">
                            تسجيل الدخول
                        </Link>
                        <Link href="/sign-up" className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold text-sm hover:scale-105 transition-transform duration-300 active:scale-95 shadow-md shadow-blue-600/20">
                            ابدأ الآن
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-6 md:px-16 max-w-3xl mx-auto relative z-10">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight text-center">
                    حالة النظام والخدمات 🟢
                </h1>
                <p className="text-slate-600 text-center mb-12 text-lg">
                    متابعة كفاءة التشغيل وتواجد الخدمات السحابية لمنصة نما إنفست.
                </p>

                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
                    <div className="flex items-center justify-between p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <span className="w-4.5 h-4.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></span>
                            <span className="font-bold text-slate-800 text-lg">جميع الخدمات تعمل بكفاءة تامة</span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">محدث منذ دقائق</span>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">كفاءة الخدمات الأساسية</h2>
                        {services.map((service, idx) => (
                            <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-b-0">
                                <span className="text-slate-700 font-medium text-sm md:text-base">{service.name}</span>
                                <span className={`px-4 py-1 text-xs rounded-full border font-bold ${service.color}`}>{service.status}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-slate-500 text-xs leading-relaxed text-center font-medium">
                        ⚠️ **تنبيه**: هذه لوحة حالة خدمات عامة. سيتم ربط لوحة المراقبة الحية الكاملة بنظم SIEM وخوادم الإنتاج لاحقاً بشكل مستقل.
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-8 border-t border-slate-200 bg-transparent text-center text-slate-400 text-xs font-bold">
                <div className="max-w-7xl mx-auto px-6">
                    © {new Date().getFullYear()} نما إنفست. جميع الحقوق محفوظة.
                </div>
            </footer>
        </div>
    );
}
