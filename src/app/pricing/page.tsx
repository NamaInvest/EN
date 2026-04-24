'use client';

import Link from 'next/link';
import { useState } from 'react';

const plans = [
    {
        name: 'التجريبي',
        nameEn: 'Free Trial',
        priceMonthly: 'مجاني',
        priceYearly: 'مجاني',
        period: '7 أيام',
        color: 'from-slate-700 to-slate-900',
        badge: null,
        features: [
            { text: '30 فاتورة', included: true },
            { text: '1,000 صنف', included: true },
            { text: 'مستخدم واحد', included: true },
            { text: 'كل الأقسام مفتوحة للتقييم', included: true },
            { text: 'ZATCA Phase 1 (QR)', included: true },
            { text: 'ZATCA Phase 2', included: false },
            { text: 'دعم فني', included: false },
            { text: 'نسخ احتياطية يومية', included: false },
        ],
        cta: 'ابدأ مجاناً',
        ctaHref: '/sign-up',
        disabled: false,
    },
    {
        name: 'الأساسية',
        nameEn: 'Basic',
        priceMonthly: '99',
        priceYearly: '950',
        period: 'شهرياً',
        periodYearly: 'سنوياً',
        color: 'from-indigo-600 to-indigo-800',
        badge: '⭐ الأكثر شيوعاً',
        features: [
            { text: 'فواتير غير محدودة', included: true },
            { text: '19,900 صنف', included: true },
            { text: '3 مستخدمين', included: true },
            { text: 'تقارير متقدمة', included: true },
            { text: 'ZATCA Phase 1 (QR)', included: true },
            { text: 'ZATCA Phase 2', included: true },
            { text: 'دعم بريد إلكتروني', included: true },
            { text: 'نسخ احتياطية يومية', included: false },
        ],
        cta: 'اشترك الآن',
        ctaHref: 'https://wa.me/966531206628?text=أريد الاشتراك في الخطة الأساسية',
        disabled: false,
    },
    {
        name: 'الاحترافية',
        nameEn: 'Professional',
        priceMonthly: '299',
        priceYearly: '2,870',
        period: 'شهرياً',
        periodYearly: 'سنوياً',
        color: 'from-violet-600 to-purple-800',
        badge: '🚀 موصى به للشركات',
        features: [
            { text: 'فواتير غير محدودة', included: true },
            { text: 'أصناف غير محدودة', included: true },
            { text: '10 مستخدمين', included: true },
            { text: 'تقارير متقدمة + BI', included: true },
            { text: 'ZATCA Phase 1 (QR)', included: true },
            { text: 'ZATCA Phase 2 كاملة', included: true },
            { text: 'دعم أولوية 24/7', included: true },
            { text: 'نسخ احتياطية يومية', included: true },
        ],
        cta: 'اشترك الآن',
        ctaHref: 'https://wa.me/966531206628?text=أريد الاشتراك في الخطة الاحترافية',
        disabled: false,
    },
    {
        name: 'المؤسسات',
        nameEn: 'Enterprise',
        priceMonthly: 'تواصل معنا',
        priceYearly: 'تواصل معنا',
        period: '',
        color: 'from-amber-600 to-orange-700',
        badge: '🏢 للشركات الكبرى',
        features: [
            { text: 'كل شيء في الاحترافي', included: true },
            { text: 'مستخدمون غير محدودون', included: true },
            { text: 'فروع متعددة', included: true },
            { text: 'تكامل API مخصص', included: true },
            { text: 'SLA مضمون 99.9%', included: true },
            { text: 'تدريب وتأهيل الفريق', included: true },
            { text: 'مدير حساب مخصص', included: true },
            { text: 'تخصيص كامل للنظام', included: true },
        ],
        cta: 'تواصل معنا',
        ctaHref: 'https://wa.me/966531206628?text=أريد معرفة المزيد عن خطة المؤسسات',
        disabled: false,
    },
];

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <div
            dir="rtl"
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                fontFamily: "'Noto Sans Arabic', 'Segoe UI', sans-serif",
                padding: '40px 16px 80px',
            }}
        >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '10px',
                        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: '50px', padding: '6px 20px', marginBottom: '24px',
                        color: '#a5b4fc', fontSize: '14px', cursor: 'pointer',
                    }}>
                        ← العودة للرئيسية
                    </div>
                </Link>

                <h1 style={{
                    fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: '800',
                    color: 'white', margin: '0 0 16px',
                    background: 'linear-gradient(to right, #c7d2fe, #818cf8, #6366f1)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    خطط بسيطة وشفافة 💎
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '600px', margin: '0 auto 32px' }}>
                    ابدأ مجاناً لمدة 7 أيام مع كل الأقسام مفتوحة، ثم اختر الخطة التي تناسب نمو شركتك
                </p>

                {/* Monthly/Yearly Toggle */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50px', padding: '6px 8px',
                }}>
                    <button
                        onClick={() => setIsYearly(false)}
                        style={{
                            padding: '8px 24px', borderRadius: '40px',
                            background: !isYearly ? '#6366f1' : 'transparent',
                            color: !isYearly ? 'white' : '#94a3b8',
                            border: 'none', cursor: 'pointer',
                            fontWeight: '700', fontSize: '14px',
                            transition: 'all 0.3s',
                            fontFamily: "'Noto Sans Arabic', sans-serif",
                        }}
                    >
                        شهري
                    </button>
                    <button
                        onClick={() => setIsYearly(true)}
                        style={{
                            padding: '8px 24px', borderRadius: '40px',
                            background: isYearly ? '#6366f1' : 'transparent',
                            color: isYearly ? 'white' : '#94a3b8',
                            border: 'none', cursor: 'pointer',
                            fontWeight: '700', fontSize: '14px',
                            transition: 'all 0.3s',
                            fontFamily: "'Noto Sans Arabic', sans-serif",
                        }}
                    >
                        سنوي
                    </button>
                    {isYearly && (
                        <span style={{
                            background: 'rgba(34,197,94,0.2)', color: '#4ade80',
                            padding: '4px 12px', borderRadius: '20px',
                            fontSize: '12px', fontWeight: '700',
                        }}>
                            وفّر 20%
                        </span>
                    )}
                </div>
            </div>

            {/* Plans Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px',
                maxWidth: '1200px',
                margin: '0 auto',
            }}>
                {plans.map((plan) => {
                    const price = isYearly ? plan.priceYearly : plan.priceMonthly;
                    const isNumeric = !isNaN(Number(price.replace(/,/g, '')));
                    const period = isYearly ? (plan.periodYearly || plan.period) : plan.period;

                    return (
                        <div key={plan.name} style={{
                            background: plan.badge === '⭐ الأكثر شيوعاً'
                                ? 'rgba(99,102,241,0.08)'
                                : 'rgba(255,255,255,0.04)',
                            border: plan.badge === '⭐ الأكثر شيوعاً'
                                ? '2px solid #6366f1'
                                : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}>
                            {/* Badge */}
                            {plan.badge && (
                                <div style={{
                                    background: plan.badge.includes('الأكثر') ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                    color: 'white', textAlign: 'center',
                                    padding: '6px', fontSize: '12px', fontWeight: '700',
                                }}>
                                    {plan.badge}
                                </div>
                            )}

                            {/* Plan Header */}
                            <div style={{
                                background: `linear-gradient(135deg, ${plan.color})`,
                                padding: '28px 24px',
                            }}>
                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '4px' }}>
                                    {plan.nameEn}
                                </div>
                                <div style={{ color: 'white', fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>
                                    {plan.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                    {!isNumeric ? (
                                        <span style={{ color: 'white', fontSize: '28px', fontWeight: '800' }}>{price}</span>
                                    ) : (
                                        <>
                                            <span style={{ color: 'white', fontSize: '40px', fontWeight: '800' }}>{price}</span>
                                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>ر.س</span>
                                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>/ {period}</span>
                                        </>
                                    )}
                                    {plan.period === '7 أيام' && (
                                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>/ {plan.period}</span>
                                    )}
                                </div>
                                {isYearly && isNumeric && (
                                    <div style={{ marginTop: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textDecoration: 'line-through' }}>
                                        {plan.priceMonthly === '99' ? '1,188' : '3,588'} ر.س / سنوياً
                                    </div>
                                )}
                            </div>

                            {/* Features */}
                            <div style={{ padding: '24px', flex: 1 }}>
                                {plan.features.map((f, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 0',
                                        borderBottom: i < plan.features.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                        color: f.included ? '#e2e8f0' : '#475569',
                                        fontSize: '14px',
                                    }}>
                                        <span style={{ fontSize: '16px' }}>{f.included ? '✅' : '❌'}</span>
                                        <span style={{ textDecoration: f.included ? 'none' : 'line-through' }}>{f.text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <div style={{ padding: '20px 24px 28px' }}>
                                <a
                                    href={plan.ctaHref}
                                    style={{
                                        display: 'block', textAlign: 'center',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        background: plan.badge?.includes('الأكثر')
                                            ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                                            : plan.badge?.includes('موصى')
                                                ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                                                : 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: 'white',
                                        fontWeight: '700', fontSize: '15px',
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {plan.cta} 🚀
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FAQ / Bottom Note */}
            <div style={{
                maxWidth: '700px', margin: '60px auto 0',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', padding: '32px',
                textAlign: 'center',
            }}>
                <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
                    💬 هل تحتاج مساعدة في اختيار الخطة المناسبة؟
                    <br />
                    <a
                        href="https://wa.me/966531206628"
                        style={{ color: '#818cf8', textDecoration: 'none', fontWeight: '700', marginTop: '8px', display: 'inline-block' }}
                    >
                        تواصل معنا عبر واتساب ←
                    </a>
                </p>
            </div>

            <link
                href="https://fonts.googleapis.com/css2?family=Noto Sans Arabic:wght@400;600;700;800&display=swap"
                rel="stylesheet"
            />
        </div>
    );
}
