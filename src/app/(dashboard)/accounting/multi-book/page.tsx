'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { BookOpen, GitCompare, Plus, Save, ArrowLeftRight } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function MultiBookPage() {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const [books, setBooks] = useState<any[]>([]);
    const [mappings, setMappings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'books' | 'mappings' | 'reconcile'>('books');
    const [showAddBook, setShowAddBook] = useState(false);
    const [bookForm, setBookForm] = useState({ code: '', baseCurrency: 'SAR', isPrimary: false });
    const [reconResult, setReconResult] = useState<any>(null);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/accounting/multi-book', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json();
            if (res.ok) {
                setBooks(d.books || []);
                setMappings(d.mappings || []);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    async function addBook() {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/accounting/multi-book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: 'add_book', ...bookForm })
            });
            if (res.ok) {
                success('تم إضافة الدفتر المحاسبي بنجاح');
                setShowAddBook(false);
                setBookForm({ code: '', baseCurrency: 'SAR', isPrimary: false });
                loadData();
            } else {
                const d = await res.json();
                error(d.error || 'فشل');
            }
        } catch (e) { console.error(e); }
    }

    async function runReconciliation() {
        if (books.length < 2) { error('يجب وجود دفترين على الأقل لإجراء التسوية'); return; }
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/accounting/multi-book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: 'reconcile', sourceBookId: books[0]?.id, targetBookId: books[1]?.id })
            });
            const d = await res.json();
            if (res.ok) {
                setReconResult(d);
                success('تم إنجاز تقرير التسوية');
            }
        } catch (e) { console.error(e); }
    }

    const bookLabel = (code: string) => {
        switch (code) {
            case 'IFRS': return 'المعايير الدولية (IFRS)';
            case 'TAX': return 'الدفتر الضريبي';
            case 'ZAKAT': return 'دفتر الزكاة';
            case 'MGMT': return 'الدفتر الإداري';
            default: return code;
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">الدفاتر المحاسبية المتعددة (Multi-Book / Multi-GAAP)</h1>
            </div>

            <div className="page-content animate-fade-in">
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                    <button className={`btn ${activeTab === 'books' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('books')}>
                        <BookOpen size={16} style={{ marginLeft: '5px' }} /> الدفاتر
                    </button>
                    <button className={`btn ${activeTab === 'mappings' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('mappings')}>
                        <ArrowLeftRight size={16} style={{ marginLeft: '5px' }} /> خرائط الحسابات
                    </button>
                    <button className={`btn ${activeTab === 'reconcile' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('reconcile')}>
                        <GitCompare size={16} style={{ marginLeft: '5px' }} /> تسوية الدفاتر
                    </button>
                </div>

                {/* Books Tab */}
                {activeTab === 'books' && (
                    <div className="card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '18px', margin: 0 }}>الدفاتر المحاسبية النشطة</h2>
                            <button className="btn btn-primary" onClick={() => setShowAddBook(!showAddBook)}>
                                <Plus size={16} style={{ marginLeft: '5px' }} /> إضافة دفتر
                            </button>
                        </div>

                        {showAddBook && (
                            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>رمز الدفتر</label>
                                    <select className="form-select" value={bookForm.code} onChange={e => setBookForm({ ...bookForm, code: e.target.value })}>
                                        <option value="">اختر...</option>
                                        <option value="IFRS">IFRS (المعايير الدولية)</option>
                                        <option value="TAX">TAX (ضريبي)</option>
                                        <option value="ZAKAT">ZAKAT (زكاة)</option>
                                        <option value="MGMT">MGMT (إداري)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>العملة الأساسية</label>
                                    <input className="form-input" value={bookForm.baseCurrency} onChange={e => setBookForm({ ...bookForm, baseCurrency: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="checkbox" checked={bookForm.isPrimary} onChange={e => setBookForm({ ...bookForm, isPrimary: e.target.checked })} />
                                        دفتر أساسي
                                    </label>
                                </div>
                                <div style={{ gridColumn: '1 / -1', textAlign: 'left' }}>
                                    <button className="btn btn-primary" onClick={addBook}><Save size={16} style={{ marginLeft: '5px' }} /> حفظ</button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                            {books.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', gridColumn: '1 / -1' }}>
                                    <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                    <p>لا توجد دفاتر محاسبية بعد</p>
                                </div>
                            ) : books.map((b: any) => (
                                <div key={b.id} className="card" style={{ padding: '20px', borderLeft: `4px solid ${b.isPrimary ? '#6366f1' : '#e5e7eb'}`, position: 'relative' }}>
                                    {b.isPrimary && <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#6366f1', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>أساسي</span>}
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{b.code}</div>
                                    <div style={{ color: '#6b7280', fontSize: '14px' }}>{bookLabel(b.code)}</div>
                                    <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '8px' }}>العملة: {b.baseCurrency}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mappings Tab */}
                {activeTab === 'mappings' && (
                    <div className="card" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>خرائط توجيه الحسابات بين الدفاتر</h2>
                        {mappings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                <ArrowLeftRight size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                <p>لا توجد خرائط حسابات. سيتم إنشاؤها عند ربط حسابات الدفتر الأساسي مع الدفاتر الأخرى</p>
                            </div>
                        ) : (
                            <table className="table" style={{ width: '100%' }}>
                                <thead><tr><th>من الدفتر</th><th>الحساب المصدر</th><th>إلى الدفتر</th><th>الحساب الهدف</th><th>قاعدة التحويل</th></tr></thead>
                                <tbody>
                                    {mappings.map((m: any) => (
                                        <tr key={m.id}>
                                            <td><span className="badge badge-outline">{m.sourceBookCode}</span></td>
                                            <td>{m.sourceAccountName || m.sourceAccountId}</td>
                                            <td><span className="badge badge-outline">{m.targetBookCode}</span></td>
                                            <td>{m.targetAccountName || m.targetAccountId}</td>
                                            <td>{m.transformRule || 'مباشر (1:1)'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Reconciliation Tab */}
                {activeTab === 'reconcile' && (
                    <div className="card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '18px', margin: 0 }}>تسوية الفروقات بين الدفاتر</h2>
                            <button className="btn btn-primary" onClick={runReconciliation}>
                                <GitCompare size={16} style={{ marginLeft: '5px' }} /> تشغيل التسوية
                            </button>
                        </div>

                        {reconResult ? (
                            <>
                                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <strong>المقارنة بين:</strong> {reconResult.sourceBook} ↔ {reconResult.targetBook}
                                </div>
                                <table className="table" style={{ width: '100%' }}>
                                    <thead><tr><th>الحساب</th><th>رصيد الدفتر الأول</th><th>رصيد الدفتر الثاني</th><th>الفرق</th><th>السبب</th></tr></thead>
                                    <tbody>
                                        {(reconResult.differences || []).map((d: any, i: number) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: '500' }}>{d.accountName}</td>
                                                <td>{d.sourceBalance.toLocaleString()}</td>
                                                <td>{d.targetBalance.toLocaleString()}</td>
                                                <td style={{ fontWeight: 'bold', color: d.variance !== 0 ? '#ef4444' : '#10b981' }}>
                                                    {d.variance.toLocaleString()}
                                                </td>
                                                <td style={{ color: '#6b7280', fontSize: '13px' }}>{d.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                <GitCompare size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                <p>اضغط &ldquo;تشغيل التسوية&rdquo; لمقارنة أرصدة الحسابات بين الدفاتر المختلفة</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
