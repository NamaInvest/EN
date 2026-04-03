'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

interface Alert {
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
}

interface FraudInsights {
    securityScore: number;
    status: 'Safe' | 'Warning' | 'Critical';
    alerts: Alert[];
    recommendation: string;
}

export default function FraudMonitoringPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState<FraudInsights | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/ai/fraud-monitoring', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setInsights(data.insights);
            } else {
                setError(data.error || 'حدث خطأ غير متوقع في محرك الذكاء الاصطناعي');
            }
        } catch (e: any) {
            setError('خطأ في الاتصال بمحرك التحليل');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'Safe') return '#2ecc71';
        if (status === 'Warning') return '#f39c12';
        return '#e74c3c';
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                 <div>
                    <h1 style={{ fontSize: '28px', color: '#2c3e50', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        🕵️ محرك كشف التلاعب المالي (Fraud AI)
                    </h1>
                    <p style={{ color: '#7f8c8d', marginTop: '5px' }}>تحليل السلوكيات المريبة مثل حذف الفواتير للسرقة، صرف نقد مجهول، والخصومات الشاذة</p>
                 </div>
                 <button onClick={fetchInsights} disabled={loading} style={{ padding: '12px 25px', background: '#34495e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
                     {loading ? 'الذكاء الاصطناعي يحلل...' : 'تحديث التحليل التقني'}
                     {!loading && '🔄'}
                 </button>
            </div>

            {error && (
                <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', width: '60px', height: '60px', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                    <div style={{ fontSize: '18px', color: '#7f8c8d', fontWeight: 'bold' }}>جاري المسح الأمني للبيانات التاريخية بواسطة Google Gemini...</div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            ) : insights ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '30px', alignItems: 'start' }}>
                    
                    {/* Left: Alerts & Findings */}
                    <div>
                        <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ fontSize: '22px', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '25px' }}>🔴 الشبهات الأمنية المكتشفة</h2>
                            
                            {insights.alerts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#2ecc71', fontWeight: 'bold', fontSize: '18px', background: '#eafaf1', borderRadius: '10px' }}>
                                    ✨ لا توجد أي سلوكيات مريبة. الأمن المالي مستقر تماماً.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {insights.alerts.map((alert, idx) => (
                                        <div key={idx} style={{ 
                                            padding: '20px', borderRadius: '10px', 
                                            background: alert.severity === 'high' ? '#fdedec' : alert.severity === 'medium' ? '#fdf2e9' : '#eafaf1',
                                            borderLeft: `5px solid ${alert.severity === 'high' ? '#e74c3c' : alert.severity === 'medium' ? '#e67e22' : '#2ecc71'}`,
                                            display: 'flex', flexDirection: 'column', gap: '10px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <h3 style={{ margin: 0, fontSize: '18px', color: '#2c3e50' }}>{alert.title}</h3>
                                                <span style={{ 
                                                    padding: '3px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', color: 'white',
                                                    background: alert.severity === 'high' ? '#e74c3c' : alert.severity === 'medium' ? '#e67e22' : '#2ecc71'
                                                }}>
                                                    {alert.severity === 'high' ? 'حرج 🔴' : alert.severity === 'medium' ? 'متوسط ⚠️' : 'منخفض ℹ️'}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '15px', color: '#555', lineHeight: '1.6' }}>{alert.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: '40px', background: '#ecf0f1', padding: '20px', borderRadius: '10px' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#2980b9' }}>💡 توصية المحرك الأمني:</h4>
                                <p style={{ margin: 0, color: '#34495e', lineHeight: '1.6', fontSize: '15px', fontWeight: 'bold' }}>{insights.recommendation}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Security Dashboard Widget */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', padding: '30px', borderRadius: '15px', color: 'white', textAlign: 'center', boxShadow: '0 15px 35px rgba(30, 60, 114, 0.3)', position: 'relative', overflow: 'hidden' }}>
                            <h2 style={{ fontSize: '18px', opacity: 0.9, marginTop: 0 }}>مؤشر الأمان المالي</h2>
                            <div style={{ fontSize: '70px', fontWeight: '900', margin: '20px 0', textShadow: '0 5px 15px rgba(0,0,0,0.2)', color: getStatusColor(insights.status) }}>
                                {insights.securityScore}%
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', backdropFilter: 'blur(5px)' }}>
                                {insights.status === 'Safe' ? 'آمن وموثوق ✅' : insights.status === 'Warning' ? 'يحتاج مراقبة ⚠️' : 'خطر حرج 🚫'}
                            </div>
                        </div>

                        <div style={{ background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#7f8c8d' }}>📊 إحصائيات سريعة للنموذج</h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '10px' }}>
                                    <span style={{ color: '#555' }}>حالات شديدة الخطورة</span>
                                    <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>{insights.alerts.filter(a => a.severity === 'high').length}</span>
                                </li>
                                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '10px' }}>
                                    <span style={{ color: '#555' }}>حالات متوسطة الأهمية</span>
                                    <span style={{ fontWeight: 'bold', color: '#e67e22' }}>{insights.alerts.filter(a => a.severity === 'medium').length}</span>
                                </li>
                                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#555' }}>زمن الاستجابة</span>
                                    <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>~ 1.2s</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            ) : null}
        </div>
    );
}
