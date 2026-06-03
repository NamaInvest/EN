'use client';

import Link from 'next/link';

export default function TermsPage() {
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

            <main className="pt-32 pb-24 px-6 md:px-16 max-w-4xl mx-auto relative z-10">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-8 tracking-tight text-center">
                    شروط الخدمة والاستخدام 📜
                </h1>
                <p className="text-slate-600 text-center mb-12 text-lg">
                    يرجى قراءة شروط الاستخدام بعناية قبل بدء تفعيل حسابك واستخدام نظام نما إنفست.
                </p>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-8 md:p-10 shadow-xs space-y-8 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">1. شروط الاستخدام</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            باستخدامك لمنصة نما إنفست، فإنك توافق على الالتزام الكامل بهذه الشروط والسياسات. تسري هذه الاتفاقية على جميع المستخدمين الذين يقومون بالتسجيل وتأسيس منشآت سحابية أو مكتبية.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">2. مسؤوليات المستخدم</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            أنت مسؤول بشكل كامل عن الحفاظ على سرية معلومات حسابك وكلمات المرور الخاصة بموظفيك. كما تتحمل المنشأة المسؤولية الكاملة عن صحة ودقة البيانات المحاسبية والضريبية المدخلة ومطابقتها للأنظمة المحلية.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">3. الاشتراكات والتجربة المجانية</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            نوفر للعملاء الجدد فترة تجريبية مجانية مدتها 7 أيام دون التزام بالسداد. بعد انتهاء الفترة التجريبية، يتطلب استمرار الخدمة الاشتراك في إحدى الخطط المتاحة وسداد الرسوم المقررة وفقاً لدورة الفوترة المختارة.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">4. الاستخدام المقبول</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            يجب استخدام النظام في الأغراض التجارية المشروعة فقط. يمنع منعاً باتاً محاولة اختراق البنية التحتية للمنصة، أو محاولة تعطيل خدمات المستأجرين الآخرين، أو استخدام النظام بطريقة تنتهك الأنظمة السائدة.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">5. حدود المسؤولية</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            يبذل فريق نما إنفست أقصى الجهود لضمان استقرار وتوفر النظام بنسبة 99.9%. المنصة غير مسؤولة عن أي خسائر مالية أو تجارية غير مباشرة ناتجة عن انقطاع الخدمة أو فقدان البيانات بسبب إهمال المستخدم أو الظروف الخارجة عن الإرادة.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">6. إنهاء الخدمة</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            نحتفظ بالحق في تعليق أو إنهاء حسابات المنشآت التي تنتهك هذه الشروط، أو تتخلف عن سداد مستحقات الاشتراك بعد التنبيه، أو تقوم بمحاولات تضر بأمن واستقرار النظام.
                        </p>
                    </section>
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
