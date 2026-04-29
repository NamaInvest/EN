'use client';
import { useState } from 'react';

const MOCK_TICKETS = [
    { id: 1, title: 'مشكلة في طابعة الفاتورة', dept: 'POS', priority: 'high', status: 'open', created: '2026-04-29', assignee: 'أحمد' },
    { id: 2, title: 'خطأ في حساب الضريبة', dept: 'محاسبة', priority: 'critical', status: 'in_progress', created: '2026-04-28', assignee: 'سارة' },
    { id: 3, title: 'تسجيل موظف جديد', dept: 'HR', priority: 'low', status: 'resolved', created: '2026-04-27', assignee: 'محمد' },
    { id: 4, title: 'عدم ظهور المخزون في التقرير', dept: 'مستودع', priority: 'medium', status: 'open', created: '2026-04-29', assignee: null },
    { id: 5, title: 'استفسار عن حد الائتمان', dept: 'مبيعات', priority: 'low', status: 'open', created: '2026-04-29', assignee: null },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    critical: { label: '🔴 حرج', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    high: { label: '🟠 عالي', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    medium: { label: '🟡 متوسط', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    low: { label: '🟢 منخفض', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    open: { label: 'مفتوح', color: 'bg-blue-500/20 text-blue-400' },
    in_progress: { label: 'قيد التنفيذ', color: 'bg-amber-500/20 text-amber-400' },
    resolved: { label: 'محلول', color: 'bg-emerald-500/20 text-emerald-400' },
    closed: { label: 'مغلق', color: 'bg-gray-500/20 text-gray-400' },
};

export default function HelpDeskPage() {
    const [tickets, setTickets] = useState(MOCK_TICKETS);
    const [filter, setFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', dept: '', priority: 'medium', description: '' });

    const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

    const counts = {
        all: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
    };

    const addTicket = () => {
        if (!form.title) return;
        setTickets(prev => [...prev, {
            id: prev.length + 1, ...form, status: 'open',
            created: new Date().toISOString().split('T')[0], assignee: null,
        }]);
        setForm({ title: '', dept: '', priority: 'medium', description: '' });
        setShowForm(false);
    };

    const updateStatus = (id: number, status: string) => {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">🎫 نظام الدعم الفني (Help Desk)</h1>
                    <p className="text-gray-400 text-sm mt-1">متابعة شكاوى وطلبات الدعم الداخلي</p>
                </div>
                <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium text-sm transition-colors">
                    + تذكرة جديدة
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5">
                {[['all','الكل'],['open','مفتوح'],['in_progress','قيد التنفيذ'],['resolved','محلول']].map(([k,l]) => (
                    <button key={k} onClick={() => setFilter(k)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${filter === k ? 'bg-blue-500 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'}`}>
                        {l} <span className="ml-1 opacity-60">({counts[k as keyof typeof counts] ?? 0})</span>
                    </button>
                ))}
            </div>

            {/* Tickets */}
            <div className="space-y-3">
                {filtered.map(ticket => (
                    <div key={ticket.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 hover:border-gray-700 transition-all">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-gray-500 font-mono text-xs">#TKT-{String(ticket.id).padStart(4,'0')}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_CONFIG[ticket.priority]?.color}`}>
                                        {PRIORITY_CONFIG[ticket.priority]?.label}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[ticket.status]?.color}`}>
                                        {STATUS_CONFIG[ticket.status]?.label}
                                    </span>
                                    {ticket.dept && <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{ticket.dept}</span>}
                                </div>
                                <h3 className="font-medium text-white">{ticket.title}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {ticket.created} {ticket.assignee && `• مُسند إلى: ${ticket.assignee}`}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {ticket.status === 'open' && (
                                    <button onClick={() => updateStatus(ticket.id, 'in_progress')}
                                        className="text-xs px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors">
                                        بدء التنفيذ
                                    </button>
                                )}
                                {ticket.status === 'in_progress' && (
                                    <button onClick={() => updateStatus(ticket.id, 'resolved')}
                                        className="text-xs px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">
                                        تم الحل
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* New ticket modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg p-6">
                        <h2 className="text-lg font-bold mb-5">🎫 تذكرة دعم جديدة</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">عنوان المشكلة</label>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="صِف المشكلة..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">القسم</label>
                                    <input value={form.dept} onChange={e => setForm(p => ({ ...p, dept: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="مثال: POS" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">الأولوية</label>
                                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                                        <option value="low">منخفض</option>
                                        <option value="medium">متوسط</option>
                                        <option value="high">عالي</option>
                                        <option value="critical">حرج</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">التفاصيل</label>
                                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm h-24 resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={addTicket} className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-medium transition-colors">إرسال التذكرة</button>
                            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
