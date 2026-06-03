'use client';

import Link from 'next/link';

export default function DPAPage() {
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
                    اتفاقية معالجة البيانات (DPA) 📜
                </h1>
                <p className="text-slate-600 text-center mb-12 text-lg">
                    تنظم هذه الاتفاقية العلاقة بين نما إنفست كمُعالج للبيانات وبين المنشأة المشتركة كمالك ومتحكم بالبيانات.
                </p>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-8 md:p-10 shadow-xs space-y-8 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">1. التعريفات ونطاق الاتفاقية</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            تُطبق هذه الاتفاقية على معالجة البيانات الشخصية والتجارية التي يتم توفيرها وحفظها بداخل خوادم نما إنفست من قبل المنشأة المشتركة. تعد المنشأة هي &quot;المتحكم بالبيانات&quot; وتعد المنصة هي &quot;معالج البيانات&quot; وفقاً لنظام حماية البيانات الشخصية (PDPL) في المملكة العربية السعودية.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">2. الغرض من المعالجة</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            يقوم المعالج بمعالجة البيانات فقط بناءً على التعليمات المكتوبة للمتحكم وبما تمليه أغراض تشغيل نظام ERP والمحاسبة والمبيعات والمزامنة المعتمدة، ولا يجوز معالجة البيانات لأي أغراض أخرى خارج نطاق تفعيل وترخيص النظام.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">3. التدابير الأمنية والفنية</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            يلتزم معالج البيانات بتطبيق معايير أمنية صارمة تشمل عزل قواعد البيانات بشكل كامل، وتشفير البيانات أثناء الحفظ والارسال، وإدارة سجلات التدقيق لمنع الوصول غير المصرح به أو التعديل العشوائي.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">4. الاستعانة بجهات معالجة فرعية</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            لا يستعين المعالج بأي معالجي بيانات فرعيين إلا بعد تقييمهم والتحقق من التزامهم الصارم بالأنظمة الأمنية لحماية البيانات. حالياً، يتم استضافة البيانات بداخل البنية التحتية للخوادم المعتمدة والمعزولة وفق شروط الاستخدام.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">5. حقوق أصحاب البيانات والتعاون</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            يلتزم المعالج بمساعدة المتحكم بالوسائل التقنية المناسبة لتلبية طلبات أصحاب البيانات (مثل الحذف أو التعديل أو الاسترجاع) وتقديم الدعم الكامل للتحقق من الالتزام بالقواعد والأنظمة الضريبية والحكومية.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">6. الإشعار بالانتهاكات الأمنية</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            يلتزم معالج البيانات بإشعار المنشأة المشتركة فوراً (وخلال مدة لا تتجاوز 72 ساعة) عند اكتشاف أي اختراق أو انتهاك أمني غير مصرح به يؤثر على قواعد البيانات التابعة لها لاتخاذ التدابير المشتركة اللازمة.
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
