'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, ArrowRight, Search, FileText } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from "@/lib/i18n";

export default function JournalSearchPage() {
 const { t } = useTranslation();
 const searchParams = useSearchParams();
 const initialSearch = searchParams.get('search') || '';
 
 const [searchQuery, setSearchQuery] = useState(initialSearch);
 const [journals, setJournals] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 const fetchJournals = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/accounting/journal');
 if (res.ok) {
 const data = await res.json();
 setJournals(data);
 }
 } catch (e) {
 console.error('Failed to fetch journals', e);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchJournals();
 }, []);

 const filteredJournals = journals.filter(j => 
 !searchQuery || 
 j.entryNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
 (j.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
 (j.description || '').toLowerCase().includes(searchQuery.toLowerCase())
 );

 const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

 return (
 <div className="page-content" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
 <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
 <Link href="/accounting" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
 <ArrowRight size={20} /> العودة للمحاسبة
 </Link>
 <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
 <FileText size={24} color="var(--primary)" /> استعراض القيود المحاسبية
 </h1>
 <div style={{ flex: 1 }} />
 <button className="btn btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
 <Printer size={18} /> طباعة
 </button>
 </div>

 <div className="card no-print" style={{ marginBottom: '2rem' }}>
 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
 <Search size={20} color="var(--text-muted)" />
 <input 
 type="text" 
 className="input" 
 style={{ flex: 1 }} 
 placeholder="ابحث برقم القيد، المرجع، أو الوصف..." 
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 />
 </div>
 </div>

 {loading ? (
 <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</div>
 ) : filteredJournals.length === 0 ? (
 <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
 <FileText size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
 <p>لا يوجد قيود محاسبية مطابقة للبحث</p>
 </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
 {filteredJournals.map(j => (
 <div key={j.id} className="card print-break-inside-avoid" style={{ padding: '0', overflow: 'hidden' }}>
 <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
 <div>
 <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>رقم القيد</div>
 <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--primary)' }}>{j.entryNumber}</div>
 </div>
 <div>
 <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>التاريخ</div>
 <div style={{ fontWeight: 'bold' }}>{new Date(j.entryDate).toLocaleDateString('en-GB')}</div>
 </div>
 {j.reference && (
 <div>
 <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>المرجع</div>
 <div style={{ fontWeight: 'bold' }}>{j.reference}</div>
 </div>
 )}
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>البيان</div>
 <div style={{ fontWeight: 'bold' }}>{j.description}</div>
 </div>
 <div>
 <span style={{ 
 padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
 background: j.status === 'draft' ? '#f59e0b20' : j.status === 'posted' ? '#22c55e20' : '#ef444420',
 color: j.status === 'draft' ? '#f59e0b' : j.status === 'posted' ? '#22c55e' : '#ef4444'
 }}>
 {j.status === 'draft' ? 'مسودة' : j.status === 'posted' ? 'مُرحّل' : 'ملغي/معكوس'}
 </span>
 </div>
 </div>
 
 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
 <thead>
 <tr style={{ borderBottom: '2px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
 <th style={{ padding: '1rem', textAlign: 'right', width: '15%' }}>رقم الحساب</th>
 <th style={{ padding: '1rem', textAlign: 'right', width: '30%' }}>اسم الحساب</th>
 <th style={{ padding: '1rem', textAlign: 'right', width: '25%' }}>البيان</th>
 <th style={{ padding: '1rem', textAlign: 'right', width: '15%' }}>مدين</th>
 <th style={{ padding: '1rem', textAlign: 'right', width: '15%' }}>دائن</th>
 </tr>
 </thead>
 <tbody>
 {j.lines.map((l: any) => (
 <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
 <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{l.account?.code}</td>
 <td style={{ padding: '1rem', fontWeight: 'bold' }}>
 {l.account?.name}
 {l.costCenter && <span style={{ display: 'block', fontSize: '0.8rem', color: '#8b5cf6', marginTop: '0.25rem' }}>مركز تكلفة: {l.costCenter.name}</span>}
 </td>
 <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{l.description}</td>
 <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: l.debit > 0 ? '#22c55e' : 'inherit' }}>
 {l.debit > 0 ? fmt(l.debit) : '-'}
 </td>
 <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: l.credit > 0 ? '#ef4444' : 'inherit' }}>
 {l.credit > 0 ? fmt(l.credit) : '-'}
 </td>
 </tr>
 ))}
 </tbody>
 <tfoot>
 <tr style={{ background: 'var(--bg-secondary)' }}>
 <td colSpan={3} style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>الإجمالي</td>
 <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#22c55e' }}>{fmt(j.totalDebit)}</td>
 <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#ef4444' }}>{fmt(j.totalCredit)}</td>
 </tr>
 </tfoot>
 </table>
 </div>
 ))}
 </div>
 )}

 <style dangerouslySetInnerHTML={{__html: `
 @media print {
 .no-print { display: none !important; }
 body { background: white; }
 .page-content { padding: 0 !important; max-width: 100% !important; }
 .card { border: none !important; box-shadow: none !important; margin-bottom: 2rem !important; }
 table { border: 1px solid #ddd; }
 th, td { border: 1px solid #ddd; padding: 8px !important; }
 .print-break-inside-avoid { break-inside: avoid; }
 }
 `}} />
 </div>
 );
}
