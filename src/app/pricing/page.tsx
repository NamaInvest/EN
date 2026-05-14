'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, XCircle, Verified } from 'lucide-react';

const plans = [
    {
        name: 'التجريبي',
        nameEn: 'Free Trial',
        priceMonthly: 'مجاني',
        priceYearly: 'مجاني',
        period: '7 أيام',
        isFree: true,
        badge: null,
        features: [
            { text: '30 فاتورة', included: true },
            { text: '1,000 صنف', included: true },
            { text: 'مستخدم واحد', included: true },
            { text: 'كل الأقسام مفتوحة للتقييم', included: true },
            { text: 'ZATCA Phase 1 (QR)', included: true },
            { text: 'ZATCA Phase 2', included: false },
        ],
        cta: 'ابدأ مجاناً 🚀',
        ctaHref: '/sign-up',
    },
    {
        name: 'الأساسية',
        nameEn: 'Basic',
        priceMonthly: '99',
        priceYearly: '950',
        period: 'شهرياً',
        periodYearly: 'سنوياً',
        isMostPopular: true,
        badge: 'الأكثر شيوعاً ⭐',
        features: [
            { text: 'فواتير غير محدودة', included: true },
            { text: '19,900 صنف', included: true },
            { text: '3 مستخدمين', included: true },
            { text: 'تقارير متقدمة', included: true },
            { text: 'ZATCA Phase 1 & 2', included: true },
        ],
        cta: 'اشترك الآن 🚀',
        ctaHref: 'https://wa.me/966531206628?text=أريد الاشتراك في الخطة الأساسية',
    },
    {
        name: 'الاحترافية',
        nameEn: 'Professional',
        priceMonthly: '299',
        priceYearly: '2,870',
        period: 'شهرياً',
        periodYearly: 'سنوياً',
        isPremium: true,
        badge: 'موصى به للشركات 🚀',
        features: [
            { text: 'أصناف وفواتير غير محدودة', included: true },
            { text: '10 مستخدمين', included: true },
            { text: 'تقارير متقدمة + BI', included: true },
            { text: 'ZATCA Phase 2 كاملة', included: true },
            { text: 'دعم أولوية 24/7', included: true },
            { text: 'نسخ احتياطية يومية', included: true },
        ],
        cta: 'اشترك الآن 🚀',
        ctaHref: 'https://wa.me/966531206628?text=أريد الاشتراك في الخطة الاحترافية',
    },
    {
        name: 'المؤسسات',
        nameEn: 'Enterprise',
        priceMonthly: 'تواصل معنا',
        priceYearly: 'تواصل معنا',
        period: '',
        isEnterprise: true,
        badge: 'للشركات الكبرى 🏢',
        features: [
            { text: 'كل شيء في الاحترافي', included: true },
            { text: 'مستخدمون غير محدودون', included: true },
            { text: 'فروع متعددة', included: true },
            { text: 'تكامل API مخصص', included: true },
            { text: 'SLA مضمون 99.9%', included: true },
        ],
        cta: 'تواصل معنا 🚀',
        ctaHref: 'https://wa.me/966531206628?text=أريد معرفة المزيد عن خطة المؤسسات',
    },
];

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 antialiased font-sans relative overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: `
                .w-full { width: 100% !important; }
                .min-h-screen { min-height: 100vh !important; }
                .overflow-x-hidden { overflow-x: hidden !important; }
                .flex { display: flex !important; }
                .flex-col { flex-direction: column !important; }
                .flex-wrap { flex-wrap: wrap !important; }
                .items-center { align-items: center !important; }
                .items-start { align-items: flex-start !important; }
                .justify-between { justify-content: space-between !important; }
                .justify-center { justify-content: center !important; }
                .gap-2 { gap: 0.5rem !important; }
                .gap-3 { gap: 0.75rem !important; }
                .gap-4 { gap: 1rem !important; }
                .gap-6 { gap: 1.5rem !important; }
                .grid { display: grid !important; }
                .mx-auto { margin-left: auto !important; margin-right: auto !important; }
                .text-center { text-align: center !important; }
                .max-w-7xl { max-width: 80rem !important; }
                .max-w-3xl { max-width: 48rem !important; }
                .max-w-2xl { max-width: 42rem !important; }
                .max-w-xl  { max-width: 36rem !important; }
                .max-w-md  { max-width: 28rem !important; }
                .hidden { display: none !important; }
                @media (min-width: 768px) { 
                    .md\\:flex { display: flex !important; } 
                    .md\\:hidden { display: none !important; } 
                    .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; } 
                }
                @media (max-width: 767px) { .md\\:hidden { display: block; } }
                .sticky { position: sticky !important; }
                .top-0 { top: 0 !important; }
                .z-50 { z-index: 50 !important; }
                .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
                @media (min-width: 640px) {
                    .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                    .sm\\:flex-row { flex-direction: row !important; }
                }
                @media (min-width: 1024px) {
                    .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                    .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
                    .lg\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
                    .lg\\:flex-row { flex-direction: row !important; }
                    .lg\\:justify-start { justify-content: flex-start !important; }
                    .lg\\:text-right { text-align: right !important; }
                    .lg\\:w-1\\/2 { width: 50% !important; }
                }
                @media (min-width: 1280px) {
                    .xl\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
                    .xl\\:grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)) !important; }
                }
                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                section { width: 100%; }
                .max-w-7xl.mx-auto { margin-left: auto !important; margin-right: auto !important; max-width: 80rem !important; }
                .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
                .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
                .px-8 { padding-left: 2rem !important; padding-right: 2rem !important; }
                .py-24 { padding-top: 6rem !important; padding-bottom: 6rem !important; }
                .py-20 { padding-top: 5rem !important; padding-bottom: 5rem !important; }
                .py-12 { padding-top: 3rem !important; padding-bottom: 3rem !important; }
                .py-5 { padding-top: 1.25rem !important; padding-bottom: 1.25rem !important; }
                .py-3 { padding-top: 0.75rem !important; padding-bottom: 0.75rem !important; }
                .pt-40 { padding-top: 10rem !important; }
                .pb-20 { padding-bottom: 5rem !important; }
                @media (min-width: 1024px) {
                    .lg\\:pt-52 { padding-top: 13rem !important; }
                    .lg\\:pb-32 { padding-bottom: 8rem !important; }
                }
                .relative { position: relative !important; }
                .absolute { position: absolute !important; }
                .inset-0 { top: 0; left: 0; right: 0; bottom: 0; }
                .z-10 { z-index: 10 !important; }
                .inline-flex { display: inline-flex !important; }
                nav .max-w-7xl { padding-left: 1rem; padding-right: 1rem; }
            `}} />
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-3xl border-b border-slate-200/50 shadow-sm px-6 md:px-16 py-4 flex justify-between items-center">
                <div className="flex items-center gap-8 max-w-7xl mx-auto w-full">
                    <Link href="/" className="text-2xl font-bold text-slate-900 tracking-tight">
                        نما إنفست
                    </Link>
                    <div className="hidden md:flex items-center gap-6">
                        <Link className="text-slate-600 hover:text-blue-600 transition-colors font-medium" href="/">الرئيسية</Link>
                        <Link className="text-blue-700 font-bold bg-blue-50 rounded-full px-4 py-1" href="/pricing">الأسعار</Link>
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

            <main className="pt-32 pb-24 px-6 md:px-16 max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <header className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                        خطط بسيطة وشفافة 💎
                    </h1>
                    <p className="text-lg text-slate-600">
                        ابدأ مجاناً لمدة 7 أيام مع كل الأقسام مفتوحة، ثم اختر الخطة التي تناسب نمو شركتك
                    </p>

                    {/* Billing Toggle */}
                    <div className="mt-12 flex items-center justify-center gap-4">
                        <span className={`text-base font-medium ${!isYearly ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>شهري</span>
                        <div 
                            className="w-14 h-7 bg-blue-100 rounded-full p-1 flex items-center cursor-pointer transition-colors"
                            onClick={() => setIsYearly(!isYearly)}
                        >
                            <div className={`bg-blue-600 w-5 h-5 rounded-full shadow-sm transition-transform duration-300 ${isYearly ? '-translate-x-7' : 'translate-x-0'}`}></div>
                        </div>
                        <span className={`text-base font-medium ${isYearly ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>سنوي</span>
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">وفر 20%</span>
                    </div>
                </header>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan, idx) => {
                        const price = isYearly ? plan.priceYearly : plan.priceMonthly;
                        const isNumeric = !isNaN(Number(price.replace(/,/g, '')));
                        const period = isYearly && plan.periodYearly ? plan.periodYearly : plan.period;

                        return (
                            <div 
                                key={idx} 
                                className={`
                                    flex flex-col relative rounded-2xl transition-all duration-300
                                    ${plan.isPremium 
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-105 border border-blue-500 z-10' 
                                        : 'bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-sm hover:scale-[1.02] hover:shadow-md'
                                    }
                                    p-8
                                `}
                            >
                                {/* Badge */}
                                {plan.badge && (
                                    <span className={`absolute -top-3.5 right-6 px-4 py-1 rounded-full text-xs font-bold shadow-sm ${
                                        plan.isMostPopular ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                                        plan.isPremium ? 'bg-white text-blue-700 shadow-lg' :
                                        'bg-slate-800 text-white'
                                    }`}>
                                        {plan.badge}
                                    </span>
                                )}

                                {/* Plan Header */}
                                <div className="mb-8">
                                    <h3 className={`text-xl font-bold mb-2 ${plan.isPremium ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-4xl font-extrabold ${plan.isPremium ? 'text-white' : 'text-slate-900'}`}>{price}</span>
                                        {isNumeric && (
                                            <span className={`text-sm ${plan.isPremium ? 'text-blue-200' : 'text-slate-500'}`}>ر.س/ {period}</span>
                                        )}
                                        {plan.isFree && (
                                            <span className={`text-sm ${plan.isPremium ? 'text-blue-200' : 'text-slate-500'}`}>/ {plan.period}</span>
                                        )}
                                    </div>
                                    {isYearly && isNumeric && (
                                        <div className={`mt-2 text-xs line-through ${plan.isPremium ? 'text-blue-300' : 'text-slate-400'}`}>
                                            {plan.priceMonthly === '99' ? '1,188' : '3,588'} ر.س / سنوياً
                                        </div>
                                    )}
                                </div>

                                {/* Features */}
                                <div className="space-y-4 mb-8 grow">
                                    {plan.features.map((feature, fIdx) => (
                                        <div key={fIdx} className={`flex items-start gap-3 ${!feature.included && 'opacity-50'}`}>
                                            {feature.included ? (
                                                plan.isPremium ? (
                                                    <Verified className="w-5 h-5 text-white shrink-0 fill-white/20" />
                                                ) : (
                                                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                                                )
                                            ) : (
                                                <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
                                            )}
                                            <span className={`text-sm font-medium ${
                                                !feature.included ? 'text-slate-500 line-through' :
                                                plan.isPremium ? 'text-white' : 'text-slate-700'
                                            }`}>
                                                {feature.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                <a 
                                    href={plan.ctaHref} 
                                    className={`
                                        w-full py-3.5 rounded-full text-center font-bold text-sm transition-all duration-300
                                        ${plan.isPremium 
                                            ? 'bg-white text-blue-600 hover:scale-[1.03] shadow-md' 
                                            : plan.isMostPopular
                                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-lg'
                                                : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                                        }
                                    `}
                                >
                                    {plan.cta}
                                </a>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ CTA */}
                <section className="mt-32 text-center p-12 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">هل لديك استفسارات إضافية؟</h2>
                    <p className="text-slate-600 mb-8">نحن هنا لمساعدتك في العثور على الحل الأمثل لعملك</p>
                    <a 
                        href="https://wa.me/966531206628" 
                        className="inline-flex items-center gap-2 text-blue-600 font-bold hover:gap-4 transition-all duration-300"
                    >
                        تواصل معنا عبر واتساب
                        <span>&larr;</span>
                    </a>
                </section>
            </main>

            {/* Floating Background Decor */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-100/50 blur-[100px] rounded-full"></div>
            </div>
        </div>
    );
}
