'use client';

import Link from 'next/link';

export default function PrivacyPage() {
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
                    سياسة الخصوصية وحماية البيانات 🛡️
                </h1>
                <p className="text-slate-600 text-center mb-12 text-lg">
                    تلتزم منصة نما إنفست بحماية خصوصية بيانات منشأتك وعملائك بالكامل وفق الأنظمة المعيارية.
                </p>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-8 md:p-10 shadow-xs space-y-8 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">1. حماية بيانات الشركات</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            نحن ندرك تماماً حساسية البيانات التجارية والمالية الخاصة بمنشأتك. يتم عزل كافة قواعد البيانات الخاصة بالمستأجرين فيزيائياً لتجنب أي تداخل أو تسريب للبيانات. بياناتك مشفرة بالكامل أثناء الانتقال والراحة.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">2. بيانات الحساب</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            عند تسجيل حساب جديد، نقوم بجمع المعلومات الأساسية مثل اسم المستخدم، البريد الإلكتروني، ورقم الهاتف لتهيئة المنظومة السحابية وتسهيل عمليات المصادقة والدعم الفني.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">3. بيانات الفواتير والاشتراك</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            نحتفظ بالمعلومات الخاصة بخطة اشتراكك وتاريخ البدء والانتهاء وإعدادات الترخيص المكتبي والضريبي لضمان سير الخدمة والامتثال الكامل لمتطلبات هيئة الزكاة والضريبة والجمارك (ZATCA).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">4. بيانات الاستخدام</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            نقوم بجمع بيانات إحصائية مجهولة المصدر حول تشغيل النظام لتحسين الأداء وحل المشاكل البرمجية وتطوير واجهات المستخدم دون تتبع تفاصيل المعاملات المالية الفعلية للشركات.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">5. التزام عدم بيع أو مشاركة البيانات</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            تحت أي ظرف من الظروف، لا نقوم ببيع أو مشاركة أو تأجير أي بيانات تخص منشأتك أو عملائك لأي جهات خارجية. البيانات ملك خالص لك ومحفوظة بالكامل تحت سيادتك.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">6. التواصل معنا</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            إذا كان لديك أي استفسار بخصوص سياسة الخصوصية أو حماية البيانات، يسعدنا تواصلك مع فريق الأمن السيبراني لدينا عبر قنوات الدعم الفني المخصصة.
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
