'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, X, Send } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function AICopilotButton() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<{role:string, text:string}[]>([]);
    const router = useRouter();

    const askCopilot = async () => {
        if (!msg.trim()) return;
        
        const q = msg;
        setHistory(prev => [...prev, { role: 'user', text: q }]);
        setMsg('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: q })
            });
            const data = await res.json();
            
            setHistory(prev => [...prev, { role: 'ai', text: data.answer || data.error }]);
            
            if (data.action === 'NAVIGATE' && data.route) {
                setTimeout(() => router.push(data.route), 1500);
            }
        } catch {
            setHistory(prev => [...prev, { role: 'ai', text: 'حدث خطأ في الاتصال بالمساعد الذكي.' }]);
        }
        setLoading(false);
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed', bottom: '2rem', left: '2rem', zIndex: 50,
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 25px rgba(99,102,241,0.5)', border: 'none', cursor: 'pointer'
                }}
            >
                <Bot size={28} />
            </button>

            {isOpen && (
                <div dir="rtl" style={{
                    position: 'fixed', bottom: '6rem', left: '2rem', zIndex: 60,
                    width: '350px', height: '450px', background: '#111', border: '1px solid #333',
                    borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                }}>
                    <div style={{ padding: '1rem', background: '#1a1a1a', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: 'bold' }}>
                            <Bot size={20} color="#a855f7" /> {t('sys.str_35')}</div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {history.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
                                {t('sys.str_36')}</div>
                        )}
                        {history.map((h, i) => (
                            <div key={i} style={{
                                alignSelf: h.role === 'user' ? 'flex-start' : 'flex-end',
                                background: h.role === 'user' ? '#1f2937' : 'linear-gradient(135deg, #4f46e5, #7e22ce)',
                                color: 'white', padding: '0.75rem 1rem', borderRadius: '12px',
                                maxWidth: '85%', fontSize: '0.95rem', lineHeight: 1.5
                            }}>
                                {h.text}
                            </div>
                        ))}
                        {loading && <div style={{ color: '#a3a3a3', fontSize: '0.9rem', alignSelf: 'flex-end' }}>{t('sys.str_37')}</div>}
                    </div>

                    <div style={{ padding: '1rem', borderTop: '1px solid #333', display: 'flex', gap: '0.5rem' }}>
                        <input 
                            type="text" 
                            value={msg} 
                            onChange={e => setMsg(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && askCopilot()}
                            placeholder={t('sys.str_38')}
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: 'white', outline: 'none' }}
                        />
                        <button 
                            onClick={askCopilot} 
                            disabled={loading || !msg.trim()}
                            style={{ background: '#6366f1', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
