'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

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
 const { t } = useTranslation();
 const { error: toastError, success: toastSuccess } = useToast();
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
 } catch (e: any) { toastError(e?.message || 'حدث خطأ'); } finally {
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
 return <div style={{ padding: '40px', textAlign: 'center' }}>{t('sys.str_1510')}</div>;
 }

 return (
 <div style={{ height: 'calc(100vh - 120px)', display: 'flex', gap: '20px' }}>
 {/* Contacts Column */}
 <div className="card" style={{ width: '350px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
 <div style={{ padding: '20px', background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border)' }}>
 <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{t('sys.str_1511')}</h2>
 <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{t('sys.str_1512')}</p>
 </div>
 <div style={{ flex: 1, overflowY: 'auto' }}>
 {sessions.length === 0 ? (
 <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('sys.str_1513')}</div>
 ) : (
 sessions.map(s => {
 const lastMsgText = s.history[s.history.length - 1]?.parts[0]?.text || t('sys.str_1521');
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
 <div style={{ fontSize: '12px', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>{t('sys.str_1514')}</div>
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
 <div style={{ fontSize: '12px', color: 'var(--success-light)' }}>{t('sys.str_1515')}</div>
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
 {isUser ? t('sys.str_460') : t('sys.str_1522')}
 </div>
 {msg.parts[0].text.split('\n').map((line, i) => <div key={i}>{line}</div>)}
 </div>
 );
 })}
 </div>
 </>
 ) : (
 <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
 <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
 <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📢</div>
 <div>
 <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>{t('sys.str_1516')}</h2>
 <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{t('sys.str_1517')}</p>
 </div>
 </div>
 
 <div style={{ marginBottom: '20px' }}>
 <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-secondary)' }}>{t('sys.str_1518')}</label>
 <textarea 
 id="broadcastMessage"
 placeholder={t('sys.str_1523')}
 style={{ width: '100%', minHeight: '150px', padding: '16px', borderRadius: '12px', border: '2px solid var(--border)', fontSize: '15px', resize: 'vertical', fontFamily: 'inherit' }}
 />
 </div>
 
 <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
 <span>ℹ️</span>
 <div>{t('sys.str_1519')}</div>
 </div>

 <button 
 onClick={async (e) => {
 const btn = e.currentTarget;
 const msg = (document.getElementById('broadcastMessage') as HTMLTextAreaElement).value;
 if(!msg) return alert(t('sys.str_1524'));
 
 btn.innerText = t('sys.str_1525');
 btn.style.opacity = '0.7';
 btn.disabled = true;

 try {
 const res = await fetch('/api/crm/whatsapp/broadcast', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ message: msg })
 });
 const data = await res.json();
 if (data.success) {
 alert(`✅ اكتملت الحملة!\nتم الإرسال بنجاح إلى: ${data.stats.success} عميل\nفشل الإرسال إلى: ${data.stats.failed} عميل`);
 (document.getElementById('broadcastMessage') as HTMLTextAreaElement).value = '';
 } else {
 alert(t('sys.str_1526') + (data.error || t('sys.str_1527')));
 }
 } catch (err) {
 alert(t('sys.str_1528'));
 } finally {
 btn.innerText = t('sys.str_1520');
 btn.style.opacity = '1';
 btn.disabled = false;
 }
 }}
 style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}
 onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
 onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
 >
 {t('sys.str_1520')}</button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
