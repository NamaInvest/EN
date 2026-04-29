'use client';
import { useState, useEffect } from 'react';

const MOCK_EVENTS = [
    { id: 1, time: '07:02:15', type: 'login_failed', user: 'unknown', ip: '185.220.101.5', msg: 'محاولة دخول فاشلة متكررة (5x) من IP خارجي', severity: 'critical' },
    { id: 2, time: '07:18:43', type: 'permission_change', user: 'admin', ip: '192.168.1.10', msg: 'تغيير صلاحيات مستخدم: محمد العمري → مدير مبيعات', severity: 'warning' },
    { id: 3, time: '08:05:11', type: 'bulk_export', user: 'sara@company.sa', ip: '192.168.1.22', msg: 'تصدير ملف CSV يحتوي 2,400 سجل عميل', severity: 'warning' },
    { id: 4, time: '08:30:00', type: 'login_ok', user: 'ahmed@company.sa', ip: '192.168.1.15', msg: 'تسجيل دخول ناجح', severity: 'info' },
    { id: 5, time: '09:14:52', type: 'delete', user: 'khalid@company.sa', ip: '192.168.1.18', msg: 'حذف 12 فاتورة — يجب التحقق', severity: 'critical' },
    { id: 6, time: '09:45:30', type: 'api_key', user: 'system', ip: '10.0.0.1', msg: 'تجديد مفتاح API الداخلي', severity: 'info' },
    { id: 7, time: '10:22:07', type: 'login_ok', user: 'nora@company.sa', ip: '192.168.1.31', msg: 'تسجيل دخول عبر 2FA ✅', severity: 'info' },
    { id: 8, time: '11:05:44', type: 'config_change', user: 'admin', ip: '192.168.1.10', msg: 'تعديل إعدادات ZATCA', severity: 'warning' },
];

const SEV_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: '🚨' },
    warning: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: '⚠️' },
    info: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: 'ℹ️' },
};

export default function SIEMPage() {
    const [filter, setFilter] = useState('all');
    const [live, setLive] = useState(true);
    const [events, setEvents] = useState(MOCK_EVENTS);

    // Simulate live events
    useEffect(() => {
        if (!live) return;
        const interval = setInterval(() => {
            const types = [
                { type: 'login_ok', msg: 'تسجيل دخول ناجح', severity: 'info', user: 'user@company.sa' },
                { type: 'api_call', msg: 'استدعاء API /api/sales', severity: 'info', user: 'system' },
            ];
            const t = types[Math.floor(Math.random() * types.length)];
            setEvents(prev => [{ id: prev.length + 1, time: new Date().toTimeString().slice(0,8), ip: '192.168.1.' + Math.floor(Math.random()*50+10), ...t }, ...prev.slice(0, 49)]);
        }, 8000);
        return () => clearInterval(interval);
    }, [live]);

    const filtered = filter === 'all' ? events : events.filter(e => e.severity === filter);
    const critical = events.filter(e => e.severity === 'critical').length;
    const warnings = events.filter(e => e.severity === 'warning').length;

    return (
        <div className="min-h-screen p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">🛡️ مركز الأمن (SIEM)</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">مراقبة الأحداث الأمنية وحماية بيانات المنشأة</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setLive(!live)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${live ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-[var(--text-muted)]'}`}>
                        <span className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span>
                        {live ? 'مباشر' : 'متوقف'}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'أحداث حرجة', value: critical, icon: '🚨', color: critical > 0 ? 'red' : 'emerald' },
                    { label: 'تحذيرات', value: warnings, icon: '⚠️', color: 'amber' },
                    { label: 'إجمالي الأحداث', value: events.length, icon: '📋', color: 'blue' },
                    { label: '2FA مفعّل', value: '89%', icon: '🔐', color: 'emerald' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${
                        k.color==='red'?'bg-red-500/10 border-red-500/20':
                        k.color==='amber'?'bg-amber-500/10 border-amber-500/20':
                        k.color==='blue'?'bg-blue-500/10 border-blue-500/20':
                        'bg-emerald-500/10 border-emerald-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-2xl font-bold text-[var(--text)]">{k.value}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Critical alerts */}
            {events.filter(e => e.severity === 'critical').map(e => (
                <div key={e.id} className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                    <span className="text-xl">🚨</span>
                    <div className="flex-1">
                        <p className="text-red-400 font-medium text-sm">{e.msg}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{e.time} • {e.ip} • {e.user}</p>
                    </div>
                    <button className="text-xs px-3 py-1.5 btn-danger rounded-lg transition-colors">تحقيق</button>
                </div>
            ))}

            {/* Filters */}
            <div className="flex gap-2 mb-4">
                {[['all','الكل'],['critical','حرج'],['warning','تحذير'],['info','معلومة']].map(([k,l]) => (
                    <button key={k} onClick={() => setFilter(k)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${filter===k?'btn-primary':'btn btn-ghost'}`}>{l}</button>
                ))}
            </div>

            {/* Event log */}
            <div className="card overflow-hidden">
                <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)] font-mono">سجل الأحداث الأمني</span>
                    {live && <span className="text-xs text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>تحديث تلقائي</span>}
                </div>
                <div className="overflow-auto max-h-96">
                    <table className="w-full text-xs font-mono">
                        <thead><tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                            <th className="text-right p-2">الوقت</th>
                            <th className="text-right p-2">المستخدم</th>
                            <th className="text-right p-2">IP</th>
                            <th className="text-right p-2">الحدث</th>
                            <th className="text-right p-2">الخطورة</th>
                        </tr></thead>
                        <tbody>
                            {filtered.map(e => (
                                <tr key={e.id} className="border-b border-[var(--border)]/30 hover:bg-[var(--bg-card-hover)]">
                                    <td className="p-2 text-[var(--text-secondary)]">{e.time}</td>
                                    <td className="p-2 text-[var(--text-muted)]">{e.user}</td>
                                    <td className="p-2 text-[var(--text-secondary)]">{e.ip}</td>
                                    <td className="p-2 text-[var(--text-secondary)] max-w-xs truncate">{e.msg}</td>
                                    <td className="p-2">
                                        <span className={`${SEV_CONFIG[e.severity]?.color}`}>{SEV_CONFIG[e.severity]?.icon}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

