'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Employee { id: number; name: string }
interface Vacation { id: number; type: string; dateFrom: string; dateTo: string; status: string; notes: string; employee: Employee }

export default function VacationsPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [vacations, setVacations] = useState<Vacation[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ employeeId: '', type: 'annual', dateFrom: '', dateTo: '', notes: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); loadEmployees(); }, []);
    async function load() { setLoading(true); try { const r = await fetch('/api/vacations'); if (r.ok) setVacations(await r.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); } setLoading(false); };
    async function loadEmployees() { try { const r = await fetch('/api/employees'); if (r.ok) setEmployees(await r.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); } };
    const handleSave = async () => { const r = await fetch('/api/vacations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (r.ok) { setShowAdd(false); setForm({ employeeId: '', type: 'annual', dateFrom: '', dateTo: '', notes: '' }); load(); } };
    const updateStatus = async (id: number, status: string) => { await fetch('/api/vacations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); load(); };

    const typeLabels: Record<string, string> = { annual: '🏖️ سنوية', sick: '🏥 مرضية', emergency: '🚨 طارئة', unpaid: '💤 بدون راتب' };
    const statusLabel: Record<string, string> = { approved: '✅ معتمدة', pending: '⏳ قيد المراجعة', rejected: '❌ مرفوضة' };
    const statusColor: Record<string, string> = { approved: '#22c55e', pending: '#f59e0b', rejected: '#ef4444' };

    const daysBetween = (from: string, to: string) => { if (!from || !to) return 0; return Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1; };

    return (<><div className="page-header"><h1 className="page-title">{t('sys.str_1494')}</h1></div>
        <div className="page-content animate-fade-in">
            <div className="toolbar"><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{vacations.length} {t('sys.str_1495')}</span><div className="toolbar-spacer" /><button className="btn btn-primary" onClick={() => setShowAdd(true)}>{t('sys.str_1496')}</button></div>
            {showAdd && <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <h3 style={{ marginBottom: '12px' }}>{t('sys.str_1497')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('sys.str_379')}</label><select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}><option value="">{t('sys.str_1498')}</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('fin.str_199')}</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}><option value="annual">{t('sys.str_1499')}</option><option value="sick">{t('sys.str_1500')}</option><option value="emergency">{t('sys.str_1501')}</option><option value="unpaid">{t('sys.str_1502')}</option></select></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('sys.str_885')}</label><input type="date" value={form.dateFrom} onChange={e => setForm({ ...form, dateFrom: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                    <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('sys.str_1068')}</label><input type="date" value={form.dateTo} onChange={e => setForm({ ...form, dateTo: e.target.value })} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                </div>
                {form.dateFrom && form.dateTo && <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>{t('sys.str_1503')}{daysBetween(form.dateFrom, form.dateTo)} {t('sys.str_1074')}</div>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}><button className="btn btn-sm" onClick={() => setShowAdd(false)}>{t('fin.str_206')}</button><button className="btn btn-primary btn-sm" onClick={handleSave}>{t('fin.str_205')}</button></div>
            </div>}
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div> :
                    vacations.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🏖️</div><div className="empty-state-text">{t('sys.str_1504')}</div></div> :
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}><th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_379')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_199')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_885')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_1068')}</th><th style={{ padding: '8px', textAlign: 'center' }}>{t('sys.str_1505')}</th><th style={{ padding: '8px', textAlign: 'center' }}>{t('fin.str_227')}</th><th style={{ padding: '8px' }}>{t('sys.str_410')}</th></tr></thead>
                            <tbody>{vacations.map(v => (
                                <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '8px' }}>{v.employee?.name}</td>
                                    <td style={{ padding: '8px', fontSize: '12px' }}>{typeLabels[v.type] || v.type}</td>
                                    <td style={{ padding: '8px', fontSize: '12px' }}>{v.dateFrom}</td>
                                    <td style={{ padding: '8px', fontSize: '12px' }}>{v.dateTo}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{daysBetween(v.dateFrom, v.dateTo)}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: (statusColor[v.status] || '#888') + '15', color: statusColor[v.status] || '#888' }}>{statusLabel[v.status] || v.status}</span></td>
                                    <td style={{ padding: '8px' }}>
                                        {v.status === 'pending' && <><button className="btn btn-sm" onClick={() => updateStatus(v.id, 'approved')} style={{ fontSize: '11px', marginLeft: '4px' }}>✅</button><button className="btn btn-sm" onClick={() => updateStatus(v.id, 'rejected')} style={{ fontSize: '11px' }}>❌</button></>}
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>}
            </div>
        </div></>);
}
