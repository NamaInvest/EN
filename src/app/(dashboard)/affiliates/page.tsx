'use client';

import { useState, useEffect } from 'react';

export default function SaaS_Affiliate_Dashboard() {
    const [referralLink, setReferralLink] = useState('');
    const [stats, setStats] = useState({ clicks: 0, signups: 0, earnings: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch or simulate Affiliate Data binding
        setTimeout(() => {
            const mockUserId = "NAMA-POS-" + Math.floor(Math.random() * 9000 + 1000);
            setReferralLink(`https://n1.namainvist.com/onboarding/zatca?ref=${mockUserId}`);
            setStats({
                clicks: Math.floor(Math.random() * 150),
                signups: Math.floor(Math.random() * 12),
                earnings: Math.floor(Math.random() * 5000)
            });
            setLoading(false);
        }, 1200);
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        alert('✅ تم نسخ رابط الإحالة التسويقي بنجاح! شاركه مع أصدقائك الآن.');
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Cairo, sans-serif' }} dir="rtl">
            
            {/* Header Section */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', borderRadius: '24px', padding: '40px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 20px 40px rgba(59,130,246,0.3)' }}>
                <div>
                    <h1 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 16px 0' }}>برنامج "نما" لشركاء النجاح 🤝</h1>
                    <p style={{ fontSize: '18px', margin: 0, opacity: 0.9, maxWidth: '600px', lineHeight: 1.6 }}>
                        لا تدفع رسوم اشتراكك بعد اليوم! انسخ الرابط الخاص بك وشاركه مع أي منشأة تجارية.. ستحصل على عمولة نقدية (15%) أو باقة مجانية فور اشتراكهم في أقوى نظام لقطاع التجزئة و ZATCA!
                    </p>
                </div>
                <div style={{ fontSize: '80px', paddingLeft: '40px', opacity: 0.8 }}>💸</div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', fontSize: '20px', color: 'var(--text-muted)' }}>⏳ جاري تحميل لوحة التسويق...</div>
            ) : (
                <>
                    {/* Link Generator Bar */}
                    <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '20px', marginTop: '40px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                        <h2 style={{ fontSize: '20px', margin: '0 0 20px 0', color: 'var(--text-main)' }}>🔗 رابط المسوق (Affiliate Link) الخاص بك</h2>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <input 
                                type="text" 
                                readOnly 
                                value={referralLink} 
                                style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '2px dashed var(--primary)', fontSize: '16px', background: 'var(--bg-app)', color: 'var(--primary)', fontWeight: 'bold' }}
                            />
                            <button 
                                onClick={handleCopy}
                                style={{ padding: '0 32px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}
                                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                📋 نسخ الرابط
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '30px' }}>
                        
                        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px' }}>🖱️</div>
                            <div>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>إجمالي النقرات</div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>{stats.clicks}</div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px' }}>🏪</div>
                            <div>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>المشتركين الفعليين الجدد</div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>{stats.signups}</div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '20px', border: '2px solid #10b981', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 30px rgba(16,185,129,0.15)' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px' }}>💰</div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>أرباحك المتاحة (ر.س)</div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>{stats.earnings}</div>
                            </div>
                            <button 
                                onClick={() => alert('تم رفع طلب سحب الأرباح للإدارة بنجاح!')}
                                style={{ marginLeft: 'auto', padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                سحب
                            </button>
                        </div>

                    </div>
                    
                    {/* Guidelines */}
                    <div style={{ background: 'var(--bg-app)', padding: '30px', borderRadius: '20px', marginTop: '30px', fontSize: '14px', color: 'var(--text-muted)' }}>
                        <h3 style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>💡 نصيحة المبيعات الذكية:</h3>
                        قم بمشاركة الرابط الخاص بك في مجموعات الواتساب لتجار التجزئة، أو أرسله لأصدقائك الذين يحتاجون لربط نقاط البيع الخاصة بهم بمنصة (ZATCA Phase 2). بمجرد إكمال صديقك تأسيس شركته وتفعيل الباقة السحابية، سيتم رصد المكافأة في حسابك فوراً.
                    </div>
                </>
            )}
        </div>
    );
}
