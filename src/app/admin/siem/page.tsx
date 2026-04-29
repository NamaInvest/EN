'use client';
import { useState, useEffect } from 'react';

const MOCK_EVENTS = [
    { id: 1, time: '07:02:15', type: 'login_failed', user: 'unknown', ip: '185.220.101.5', msg: 'ظ…ط­ط§ظˆظ„ط© ط¯ط®ظˆظ„ ظپط§ط´ظ„ط© ظ…طھظƒط±ط±ط© (5x) ظ…ظ† IP ط®ط§ط±ط¬ظٹ', severity: 'critical' },
    { id: 2, time: '07:18:43', type: 'permission_change', user: 'admin', ip: '192.168.1.10', msg: 'طھط؛ظٹظٹط± طµظ„ط§ط­ظٹط§طھ ظ…ط³طھط®ط¯ظ…: ظ…ط­ظ…ط¯ ط§ظ„ط¹ظ…ط±ظٹ â†’ ظ…ط¯ظٹط± ظ…ط¨ظٹط¹ط§طھ', severity: 'warning' },
    { id: 3, time: '08:05:11', type: 'bulk_export', user: 'sara@company.sa', ip: '192.168.1.22', msg: 'طھطµط¯ظٹط± ظ…ظ„ظپ CSV ظٹط­طھظˆظٹ 2,400 ط³ط¬ظ„ ط¹ظ…ظٹظ„', severity: 'warning' },
    { id: 4, time: '08:30:00', type: 'login_ok', user: 'ahmed@company.sa', ip: '192.168.1.15', msg: 'طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„ ظ†ط§ط¬ط­', severity: 'info' },
    { id: 5, time: '09:14:52', type: 'delete', user: 'khalid@company.sa', ip: '192.168.1.18', msg: 'ط­ط°ظپ 12 ظپط§طھظˆط±ط© â€” ظٹط¬ط¨ ط§ظ„طھط­ظ‚ظ‚', severity: 'critical' },
    { id: 6, time: '09:45:30', type: 'api_key', user: 'system', ip: '10.0.0.1', msg: 'طھط¬ط¯ظٹط¯ ظ…ظپطھط§ط­ API ط§ظ„ط¯ط§ط®ظ„ظٹ', severity: 'info' },
    { id: 7, time: '10:22:07', type: 'login_ok', user: 'nora@company.sa', ip: '192.168.1.31', msg: 'طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„ ط¹ط¨ط± 2FA âœ…', severity: 'info' },
    { id: 8, time: '11:05:44', type: 'config_change', user: 'admin', ip: '192.168.1.10', msg: 'طھط¹ط¯ظٹظ„ ط¥ط¹ط¯ط§ط¯ط§طھ ZATCA', severity: 'warning' },
];

const SEV_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: 'ًںڑ¨' },
    warning: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: 'âڑ ï¸ڈ' },
    info: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: 'â„¹ï¸ڈ' },
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
                { type: 'login_ok', msg: 'طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„ ظ†ط§ط¬ط­', severity: 'info', user: 'user@company.sa' },
                { type: 'api_call', msg: 'ط§ط³طھط¯ط¹ط§ط، API /api/sales', severity: 'info', user: 'system' },
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
                    <h1 className="text-2xl font-bold">ًں›،ï¸ڈ ظ…ط±ظƒط² ط§ظ„ط£ظ…ظ† (SIEM)</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">ظ…ط±ط§ظ‚ط¨ط© ط§ظ„ط£ط­ط¯ط§ط« ط§ظ„ط£ظ…ظ†ظٹط© ظˆط­ظ…ط§ظٹط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظ†ط´ط£ط©</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setLive(!live)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${live ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-[var(--text-muted)]'}`}>
                        <span className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span>
                        {live ? 'ظ…ط¨ط§ط´ط±' : 'ظ…طھظˆظ‚ظپ'}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'ط£ط­ط¯ط§ط« ط­ط±ط¬ط©', value: critical, icon: 'ًںڑ¨', color: critical > 0 ? 'red' : 'emerald' },
                    { label: 'طھط­ط°ظٹط±ط§طھ', value: warnings, icon: 'âڑ ï¸ڈ', color: 'amber' },
                    { label: 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط£ط­ط¯ط§ط«', value: events.length, icon: 'ًں“‹', color: 'blue' },
                    { label: '2FA ظ…ظپط¹ظ‘ظ„', value: '89%', icon: 'ًں”گ', color: 'emerald' },
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
                    <span className="text-xl">ًںڑ¨</span>
                    <div className="flex-1">
                        <p className="text-red-400 font-medium text-sm">{e.msg}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{e.time} â€¢ {e.ip} â€¢ {e.user}</p>
                    </div>
                    <button className="text-xs px-3 py-1.5 btn-danger rounded-lg transition-colors">طھط­ظ‚ظٹظ‚</button>
                </div>
            ))}

            {/* Filters */}
            <div className="flex gap-2 mb-4">
                {[['all','ط§ظ„ظƒظ„'],['critical','ط­ط±ط¬'],['warning','طھط­ط°ظٹط±'],['info','ظ…ط¹ظ„ظˆظ…ط©']].map(([k,l]) => (
                    <button key={k} onClick={() => setFilter(k)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${filter===k?'btn-primary':'btn btn-ghost'}`}>{l}</button>
                ))}
            </div>

            {/* Event log */}
            <div className="card overflow-hidden">
                <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)] font-mono">ط³ط¬ظ„ ط§ظ„ط£ط­ط¯ط§ط« ط§ظ„ط£ظ…ظ†ظٹ</span>
                    {live && <span className="text-xs text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>طھط­ط¯ظٹط« طھظ„ظ‚ط§ط¦ظٹ</span>}
                </div>
                <div className="overflow-auto max-h-96">
                    <table className="w-full text-xs font-mono">
                        <thead><tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                            <th className="text-right p-2">ط§ظ„ظˆظ‚طھ</th>
                            <th className="text-right p-2">ط§ظ„ظ…ط³طھط®ط¯ظ…</th>
                            <th className="text-right p-2">IP</th>
                            <th className="text-right p-2">ط§ظ„ط­ط¯ط«</th>
                            <th className="text-right p-2">ط§ظ„ط®ط·ظˆط±ط©</th>
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

