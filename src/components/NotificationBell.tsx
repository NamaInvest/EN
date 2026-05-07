'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function NotificationBell() {
    const { lang } = useTranslation();
    const isAr = lang === 'ar';
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    const load = () => {
        fetch('/api/system/notifications').then(r=>r.json()).then(d => {
            setNotifications(d.notifications || []);
            setUnreadCount(d.unreadCount || 0);
        }).catch(()=>{});
    };

    useEffect(() => { load(); const interval = setInterval(load, 30000); return () => clearInterval(interval); }, []);
    useEffect(() => { const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, []);

    const markRead = (id: number) => {
        fetch('/api/system/notifications', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'mark_read', id }) })
            .then(()=>{ setNotifications(notifications.map(n=>n.id===id?{...n,isRead:true}:n)); setUnreadCount(Math.max(0,unreadCount-1)); });
    };
    const markAllRead = () => {
        fetch('/api/system/notifications', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'mark_all_read' }) })
            .then(()=>{ setNotifications(notifications.map(n=>({...n,isRead:true}))); setUnreadCount(0); });
    };

    const typeIcon: Record<string,string> = { APPROVAL:'✅', INVOICE_DUE:'🧾', LOW_STOCK:'📦', TASK:'📋', SYSTEM:'⚙️' };

    return (
        <div ref={ref} style={{ position:'relative' }}>
            <button onClick={()=>setOpen(!open)} style={{ position:'relative', background:'none', border:'none', cursor:'pointer', fontSize:22, padding:'4px 8px' }} title={isAr?'الإشعارات':'Notifications'}>
                🔔
                {unreadCount > 0 && <span style={{ position:'absolute', top:-2, insetInlineEnd:-2, background:'#F44336', color:'#fff', fontSize:10, fontWeight:700, borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {open && (
                <div style={{ position:'absolute', top:'100%', insetInlineEnd:0, width:360, maxHeight:420, overflowY:'auto', background:'var(--bg-primary,#fff)', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.15)', zIndex:9990, border:'1px solid #e0e0e0', direction:isAr?'rtl':'ltr' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #f0f0f0' }}>
                        <span style={{ fontWeight:700, fontSize:14 }}>{isAr?'الإشعارات':'Notifications'}</span>
                        {unreadCount > 0 && <button onClick={markAllRead} style={{ fontSize:11, color:'#2196F3', background:'none', border:'none', cursor:'pointer' }}>{isAr?'قراءة الكل':'Mark all read'}</button>}
                    </div>
                    {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} onClick={()=>!n.isRead && markRead(n.id)} style={{ display:'flex', gap:10, padding:'10px 16px', borderBottom:'1px solid #f8f8f8', cursor:'pointer', background:n.isRead?'transparent':'#F3F7FF' }}>
                            <span style={{ fontSize:18 }}>{typeIcon[n.type] || '📌'}</span>
                            <div style={{ flex:1 }}>
                                <div style={{ fontSize:13, fontWeight:n.isRead?400:600 }}>{n.title}</div>
                                {n.body && <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{n.body}</div>}
                                <div style={{ fontSize:10, color:'#bbb', marginTop:4 }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                            </div>
                            {!n.isRead && <div style={{ width:8, height:8, borderRadius:'50%', background:'#2196F3', marginTop:4 }} />}
                        </div>
                    )) : (
                        <div style={{ padding:40, textAlign:'center', color:'#ccc' }}>{isAr?'لا توجد إشعارات':'No notifications'}</div>
                    )}
                </div>
            )}
        </div>
    );
}
