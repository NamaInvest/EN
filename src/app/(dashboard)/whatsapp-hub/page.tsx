'use client';

import { useState, useEffect } from 'react';

interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface ChatSession {
    phone: string;
    history: ChatMessage[];
    updatedAt: number;
}

export default function WhatsAppHubPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activePhone, setActivePhone] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/crm/whatsapp/sessions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
        const intv = setInterval(fetchSessions, 5000); // Polling for live updates
        return () => clearInterval(intv);
    }, []);

    const activeSession = sessions.find(s => s.phone === activePhone);

    if (loading && sessions.length === 0) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ جاري تحميل المحادثات...</div>;
    }

    return (
        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', gap: '20px' }}>
            {/* Contacts Column */}
            <div className="card" style={{ width: '350px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px', background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>💬 محادثات العملاء (AI)</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>مراقبة حية لردود الذكاء الاصطناعي</p>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {sessions.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد محادثات حالياً</div>
                    ) : (
                        sessions.map(s => {
                            const lastMsgText = s.history[s.history.length - 1]?.parts[0]?.text || 'بدأت المحادثة...';
                            const preview = lastMsgText.length > 40 ? lastMsgText.substring(0, 40) + '...' : lastMsgText;
                            const isActive = activePhone === s.phone;
                            
                            return (
                                <div 
                                    key={s.phone} 
                                    onClick={() => setActivePhone(s.phone)}
                                    style={{
                                        padding: '16px', 
                                        borderBottom: '1px solid var(--border)',
                                        background: isActive ? 'var(--primary-light)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div style={{ fontWeight: '700', color: isActive ? '#fff' : 'inherit' }} dir="ltr">+{s.phone}</div>
                                        <div style={{ fontSize: '12px', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>مباشر 🟢</div>
                                    </div>
                                    <div style={{ fontSize: '13px', color: isActive ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)' }}>
                                        {preview}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat View Column */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', background: 'var(--bg-app)' }}>
                {activeSession ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ padding: '20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {activeSession.phone.substring(activeSession.phone.length - 2)}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: '700' }} dir="ltr">+{activeSession.phone}</h3>
                                <div style={{ fontSize: '12px', color: 'var(--success-light)' }}>متصل بـ Gemini AI</div>
                            </div>
                        </div>

                        {/* Chat Messages Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {activeSession.history.map((msg, idx) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <div key={idx} style={{
                                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                                        maxWidth: '70%',
                                        background: isUser ? 'var(--primary)' : 'var(--bg-card)',
                                        color: isUser ? '#fff' : 'inherit',
                                        padding: '12px 16px',
                                        borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
                                        boxShadow: 'var(--shadow-sm)',
                                        border: isUser ? 'none' : '1px solid var(--border)',
                                        lineHeight: '1.5',
                                        fontSize: '14px'
                                    }}>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', opacity: 0.7 }}>
                                            {isUser ? 'العميل' : '🤖 المساعد الذكي'}
                                        </div>
                                        {msg.parts[0].text.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                            <h2>اختر محادثة لعرض التفاصيل</h2>
                            <p>يتم إدارة هذه المحادثات تلقائياً بواسطة المبيعات الذكية.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
