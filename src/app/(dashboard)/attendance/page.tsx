'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

interface Employee { id: number; name: string }
interface Record { id: number; date: string; checkIn: string; checkOut: string; notes: string; employee: Employee }

export default function AttendancePage() {
    const { t } = useTranslation();
    const [records, setRecords] = useState<Record[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); loadEmployees(); }, []);
    async function load() { setLoading(true); try { const r = await fetch('/api/attendance'); if (r.ok) setRecords(await r.json()); } catch (e) { console.error(e); } setLoading(false); };
    async function loadEmployees() { try { const r = await fetch('/api/employees'); if (r.ok) setEmployees(await r.json()); } catch (e) { console.error(e); } };

    const checkIn = async (employeeId: number) => {
        const res = await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employeeId }) });
        if (res.ok) load();
    };
    const checkOut = async (id: number) => {
        const res = await fetch('/api/attendance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        if (res.ok) load();
    };

    return (<><div className="page-header"><h1 className="page-title">{t('sys.str_375')}</h1></div>
        <div className="page-content animate-fade-in">
            <div className="card" style={{ marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '12px' }}>{t('sys.str_376')}</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {employees.map(e => (<button key={e.id} className="btn btn-sm" onClick={() => checkIn(e.id)} style={{ minWidth: '120px' }}>✅ {e.name}</button>))}
                    {employees.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t('sys.str_377')}</span>}
                </div>
            </div>
            <div className="card">
                {loading ? <div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div> :
                    records.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-text">{t('sys.str_378')}</div></div> :
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}><th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_379')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_232')}</th><th style={{ padding: '8px', textAlign: 'center' }}>{t('sys.str_380')}</th><th style={{ padding: '8px', textAlign: 'center' }}>{t('sys.str_381')}</th><th style={{ padding: '8px' }}></th></tr></thead>
                            <tbody>{records.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '8px' }}>{r.employee?.name}</td>
                                    <td style={{ padding: '8px', fontSize: '12px' }}>{r.date}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: '#22c55e', fontFamily: 'monospace' }}>{r.checkIn || '-'}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', color: '#ef4444', fontFamily: 'monospace' }}>{r.checkOut || '-'}</td>
                                    <td style={{ padding: '8px' }}>{!r.checkOut && <button className="btn btn-sm" onClick={() => checkOut(r.id)} style={{ fontSize: '11px' }}>{t('sys.str_382')}</button>}</td>
                                </tr>
                            ))}</tbody>
                        </table>}
            </div>
        </div></>);
}
