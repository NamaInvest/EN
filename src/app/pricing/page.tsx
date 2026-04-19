import Link from 'next/link';

export const metadata = {
    title: 'ط®ط·ط· ط§ظ„ط£ط³ط¹ط§ط± â€” ظ†ظ…ط§ ط§ظ†ظپط³طھ',
    description: 'ط§ط®طھط± ط§ظ„ط®ط·ط© ط§ظ„ظ…ظ†ط§ط³ط¨ط© ظ„ط´ط±ظƒطھظƒ. ظ…ظ† ط§ظ„ظ…ط¬ط§ظ†ظٹ ط¥ظ„ظ‰ ط§ظ„ط§ط­طھط±ط§ظپظٹ ظ…ط¹ ط¯ط¹ظ… ظƒط§ظ…ظ„ ظ„ظ€ ZATCA.',
};

const plans = [
    {
        name: 'ط§ظ„طھط¬ط±ظٹط¨ظٹ',
        nameEn: 'Free Trial',
        price: 'ظ…ط¬ط§ظ†ظٹ',
        period: '7 ط£ظٹط§ظ…',
        color: 'from-slate-700 to-slate-900',
        badge: null,
        features: [
            { text: '30 ظپط§طھظˆط±ط©', included: true },
            { text: '1,000 طµظ†ظپ', included: true },
            { text: 'ظ…ط³طھط®ط¯ظ… ظˆط§ط­ط¯', included: true },
            { text: 'طھظ‚ط§ط±ظٹط± ط£ط³ط§ط³ظٹط©', included: true },
            { text: 'ZATCA Phase 1 (QR)', included: true },
            { text: 'ZATCA Phase 2', included: false },
            { text: 'ط¯ط¹ظ… ظپظ†ظٹ', included: false },
            { text: 'ظ†ط³ط® ط§ط­طھظٹط§ط·ظٹط© ظٹظˆظ…ظٹط©', included: false },
        ],
        cta: 'ط§ظ„ط®ط·ط© ط§ظ„ط­ط§ظ„ظٹط©',
        ctaHref: '/dashboard',
        disabled: true,
    },
    {
        name: 'ط§ظ„ط£ط³ط§ط³ظٹط©',
        nameEn: 'Basic',
        price: '99',
        period: 'ط´ظ‡ط±ظٹط§ظ‹',
        color: 'from-indigo-600 to-indigo-800',
        badge: 'ط§ظ„ط£ظƒط«ط± ط´ظٹظˆط¹ط§ظ‹',
        features: [
            { text: 'ظپظˆط§طھظٹط± ط؛ظٹط± ظ…ط­ط¯ظˆط¯ط©', included: true },
            { text: '5,000 طµظ†ظپ', included: true },
            { text: '3 ظ…ط³طھط®ط¯ظ…ظٹظ†', included: true },
            { text: 'طھظ‚ط§ط±ظٹط± ظ…طھظ‚ط¯ظ…ط©', included: true },
            { text: 'ZATCA Phase 1 (QR)', included: true },
            { text: 'ZATCA Phase 2', included: true },
            { text: 'ط¯ط¹ظ… ط¨ط±ظٹط¯ ط¥ظ„ظƒطھط±ظˆظ†ظٹ', included: true },
            { text: 'ظ†ط³ط® ط§ط­طھظٹط§ط·ظٹط© ظٹظˆظ…ظٹط©', included: false },
        ],
        cta: 'ط§ط´طھط±ظƒ ط§ظ„ط¢ظ†',
        ctaHref: 'https://wa.me/966500000000?text=ط£ط±ظٹط¯ ط§ظ„ط§ط´طھط±ط§ظƒ ظپظٹ ط§ظ„ط®ط·ط© ط§ظ„ط£ط³ط§ط³ظٹط©',
        disabled: false,
    },
    {
        name: 'ط§ظ„ط§ط­طھط±ط§ظپظٹط©',
        nameEn: 'Professional',
        price: '299',
        period: 'ط´ظ‡ط±ظٹط§ظ‹',
        color: 'from-violet-600 to-purple-800',
        badge: 'ظ…ظˆطµظ‰ ط¨ظ‡ ظ„ظ„ط´ط±ظƒط§طھ',
        features: [
            { text: 'ظپظˆط§طھظٹط± ط؛ظٹط± ظ…ط­ط¯ظˆط¯ط©', included: true },
            { text: 'ط£طµظ†ط§ظپ ط؛ظٹط± ظ…ط­ط¯ظˆط¯ط©', included: true },
            { text: '10 ظ…ط³طھط®ط¯ظ…ظٹظ†', included: true },
            { text: 'طھظ‚ط§ط±ظٹط± ظ…طھظ‚ط¯ظ…ط© + BI', included: true },
            { text: 'ZATCA Phase 1 (QR)', included: true },
            { text: 'ZATCA Phase 2 ظƒط§ظ…ظ„ط©', included: true },
            { text: 'ط¯ط¹ظ… ط£ظˆظ„ظˆظٹط© 24/7', included: true },
            { text: 'ظ†ط³ط® ط§ط­طھظٹط§ط·ظٹط© ظٹظˆظ…ظٹط©', included: true },
        ],
        cta: 'ط§ط´طھط±ظƒ ط§ظ„ط¢ظ†',
        ctaHref: 'https://wa.me/966500000000?text=ط£ط±ظٹط¯ ط§ظ„ط§ط´طھط±ط§ظƒ ظپظٹ ط§ظ„ط®ط·ط© ط§ظ„ط§ط­طھط±ط§ظپظٹط©',
        disabled: false,
    },
    {
        name: 'ط§ظ„ظ…ط¤ط³ط³ط§طھ',
        nameEn: 'Enterprise',
        price: 'طھظˆط§طµظ„ ظ…ط¹ظ†ط§',
        period: '',
        color: 'from-amber-600 to-orange-700',
        badge: 'ظ„ظ„ط´ط±ظƒط§طھ ط§ظ„ظƒط¨ط±ظ‰',
        features: [
            { text: 'ظƒظ„ ط´ظٹط، ظپظٹ ط§ظ„ط§ط­طھط±ط§ظپظٹ', included: true },
            { text: 'ظ…ط³طھط®ط¯ظ…ظˆظ† ط؛ظٹط± ظ…ط­ط¯ظˆط¯ظˆظ†', included: true },
            { text: 'ظپط±ظˆط¹ ظ…طھط¹ط¯ط¯ط©', included: true },
            { text: 'طھظƒط§ظ…ظ„ API ظ…ط®طµطµ', included: true },
            { text: 'SLA ظ…ط¶ظ…ظˆظ† 99.9%', included: true },
            { text: 'طھط¯ط±ظٹط¨ ظˆطھط£ظ‡ظٹظ„ ط§ظ„ظپط±ظٹظ‚', included: true },
            { text: 'ظ…ط¯ظٹط± ط­ط³ط§ط¨ ظ…ط®طµطµ', included: true },
            { text: 'طھط®طµظٹطµ ظƒط§ظ…ظ„ ظ„ظ„ظ†ط¸ط§ظ…', included: true },
        ],
        cta: 'طھظˆط§طµظ„ ظ…ط¹ظ†ط§',
        ctaHref: 'https://wa.me/966500000000?text=ط£ط±ظٹط¯ ظ…ط¹ط±ظپط© ط§ظ„ظ…ط²ظٹط¯ ط¹ظ† ط®ط·ط© ط§ظ„ظ…ط¤ط³ط³ط§طھ',
        disabled: false,
    },
];

export default function PricingPage() {
    return (
        <div
            dir="rtl"
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                fontFamily: "'Lateef', 'Segoe UI', sans-serif",
                padding: '40px 16px 80px',
            }}
        >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '10px',
                        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: '50px', padding: '6px 20px', marginBottom: '24px',
                        color: '#a5b4fc', fontSize: '14px', cursor: 'pointer',
                    }}>
                        â†گ ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط±ط¦ظٹط³ظٹط©
                    </div>
                </Link>

                <h1 style={{
                    fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: '800',
                    color: 'white', margin: '0 0 16px',
                    background: 'linear-gradient(to right, #c7d2fe, #818cf8, #6366f1)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    ط®ط·ط· ط¨ط³ظٹط·ط© ظˆط´ظپط§ظپط© ًں’ژ
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                    ط§ط¨ط¯ط£ ظ…ط¬ط§ظ†ط§ظ‹ ظ„ظ…ط¯ط© 7 ط£ظٹط§ظ…طŒ ط«ظ… ط§ط®طھط± ط§ظ„ط®ط·ط© ط§ظ„طھظٹ طھظ†ط§ط³ط¨ ظ†ظ…ظˆ ط´ط±ظƒطھظƒ
                </p>
            </div>

            {/* Plans Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px',
                maxWidth: '1200px',
                margin: '0 auto',
            }}>
                {plans.map((plan) => (
                    <div key={plan.name} style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: plan.badge === 'ط§ظ„ط£ظƒط«ط± ط´ظٹظˆط¹ط§ظ‹'
                            ? '2px solid #6366f1'
                            : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        transition: 'transform 0.2s',
                    }}>
                        {/* Badge */}
                        {plan.badge && (
                            <div style={{
                                background: plan.badge === 'ط§ظ„ط£ظƒط«ط± ط´ظٹظˆط¹ط§ظ‹' ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                color: 'white', textAlign: 'center',
                                padding: '6px', fontSize: '12px', fontWeight: '700',
                            }}>
                                â­گ {plan.badge}
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
                                {plan.price === 'ظ…ط¬ط§ظ†ظٹ' || plan.price === 'طھظˆط§طµظ„ ظ…ط¹ظ†ط§' ? (
                                    <span style={{ color: 'white', fontSize: '28px', fontWeight: '800' }}>{plan.price}</span>
                                ) : (
                                    <>
                                        <span style={{ color: 'white', fontSize: '40px', fontWeight: '800' }}>{plan.price}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>ط±.ط³</span>
                                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>/ {plan.period}</span>
                                    </>
                                )}
                                {plan.period === '7 ط£ظٹط§ظ…' && (
                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>/ {plan.period}</span>
                                )}
                            </div>
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
                                    <span style={{ fontSize: '16px' }}>{f.included ? 'âœ…' : 'â‌Œ'}</span>
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
                                    background: plan.disabled
                                        ? 'rgba(255,255,255,0.05)'
                                        : plan.badge === 'ط§ظ„ط£ظƒط«ط± ط´ظٹظˆط¹ط§ظ‹'
                                            ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                                            : 'rgba(255,255,255,0.1)',
                                    border: plan.disabled ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)',
                                    color: plan.disabled ? '#64748b' : 'white',
                                    fontWeight: '700', fontSize: '15px',
                                    textDecoration: 'none',
                                    cursor: plan.disabled ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    pointerEvents: plan.disabled ? 'none' : 'auto',
                                }}
                            >
                                {plan.cta} {!plan.disabled && 'ًںڑ€'}
                            </a>
                        </div>
                    </div>
                ))}
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
                    ًں’¬ ظ‡ظ„ طھط­طھط§ط¬ ظ…ط³ط§ط¹ط¯ط© ظپظٹ ط§ط®طھظٹط§ط± ط§ظ„ط®ط·ط© ط§ظ„ظ…ظ†ط§ط³ط¨ط©طں
                    <br />
                    <a
                        href="https://wa.me/966500000000"
                        style={{ color: '#818cf8', textDecoration: 'none', fontWeight: '700', marginTop: '8px', display: 'inline-block' }}
                    >
                        طھظˆط§طµظ„ ظ…ط¹ظ†ط§ ط¹ط¨ط± ظˆط§طھط³ط§ط¨ â†گ
                    </a>
                </p>
            </div>

            <link
                href="https://fonts.googleapis.com/css2?family=Lateef:wght@400;600;700;800&display=swap"
                rel="stylesheet"
            />
        </div>
    );
}

