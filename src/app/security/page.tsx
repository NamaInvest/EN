'use client';

import Link from 'next/link';

export default function SecurityPage() {
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
                    الأمان وحماية المنظومة 🛡️
                </h1>
                <p className="text-slate-600 text-center mb-12 text-lg">
                    نضع أمن معلومات منشأتك وعملياتك في طليعة أولوياتنا اليومية عبر ممارسات أمنية رائدة.
                </p>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-8 md:p-10 shadow-xs space-y-8 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">1. عزل المستأجرين (Tenant Isolation)</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            يقوم النظام بفصل بيانات كل مستأجر (شركة) في قاعدة بيانات فيزيائية مستقلة تماماً عن بقية الشركات. هذا التصميم يضمن استحالة الوصول العشوائي أو التداخل بين بيانات المستأجرين المختلفة.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">2. المصادقة والتحقق (Authentication)</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            نعتمد على خدمات مصادقة متكاملة لإدارة جلسات أصحاب الحسابات والمالكين مع دعم التحقق الثنائي (2FA) لتعزيز الأمان. كما يتم فك شفرات الرموز عبر خوارزميات توقيع HMAC آمنة.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">3. حماية قواعد البيانات وتشفيرها</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            كافة قواعد البيانات مشفرة أثناء حفظها (At Rest) وأثناء انتقالها عبر الشبكة (In Transit) بتشفير SSL/TLS عالي القوة. نقوم بعمل جدران حماية معقدة لحظر الوصول الخارجي المباشر لخوادم قواعد البيانات.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">4. سجلات التدقيق والعمليات (Audit Logs)</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            يقوم النظام بتسجيل وتتبع العمليات الحساسة (مثل فك قفل القيود المالية أو الفترات الحسابية أو حركات المدراء والمشرفين). تتيح هذه السجلات مراجعة دقيقة ومستمرة لكافة الإجراءات المتخذة على النظام.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">5. النسخ الاحتياطي التلقائي</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            نقوم بجدولة نسخ احتياطي دوري لقواعد البيانات وتخزينها في مواقع معزولة جغرافياً لضمان تعافي البيانات السريع والكامل عند الطوارئ دون التأثير على عمليات المستأجرين.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">6. أفضل الممارسات الأمنية للمستخدمين</h2>
                        <p className="text-slate-600 text-sm md:text-base">
                            ننصح المشتركين دائماً باستخدام كلمات مرور معقدة وتفعيل التحقق الثنائي وعدم مشاركة الحسابات بين الموظفين، والحرص على تسجيل خروج المستخدمين من الأجهزة العامة والفرعية فور انتهاء العمل.
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
