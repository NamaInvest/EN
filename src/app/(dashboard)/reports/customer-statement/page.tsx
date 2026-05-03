'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { Search, Printer, FileText } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function CustomerStatementPage() {
 const { t } = useTranslation();
 const { error } = useToast();
 const [customers, setCustomers] = useState<any[]>([]);
 const [selectedCustomer, setSelectedCustomer] = useState<string>('');
 const [dateFrom, setDateFrom] = useState('');
 const [dateTo, setDateTo] = useState('');
 
 const [statement, setStatement] = useState<any>(null);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 // Fetch customers list
 fetch('/api/customers', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
 .then(res => res.json())
 .then(data => {
 if (Array.isArray(data)) setCustomers(data);
 else if (data.data) setCustomers(data.data);
 })
 .catch(e => console.error(e));
 }, []);

 async function loadData() {
 if (!selectedCustomer) {
 error('الرجاء اختيار عميل');
 return;
 }

 setLoading(true);
 try {
 const token = localStorage.getItem('token') || '';
 const query = new URLSearchParams({ customerId: selectedCustomer });
 if (dateFrom) query.append('from', dateFrom);
 if (dateTo) query.append('to', dateTo);

 const res = await fetch(`/api/reports/customer-statement?${query.toString()}`, {
 headers: { Authorization: `Bearer ${token}` }
 });
 const data = await res.json();
 if (res.ok) {
 setStatement(data);
 } else {
 error(data.error || 'فشل الجلب');
 }
 } catch (e) { console.error(e); }
 setLoading(false);
 }

 const printStatement = () => {
 window.print();
 };

 return (
 <>
 <div className="page-header print-hide">
 <h1 className="page-title">كشف حساب عميل (Customer Statement)</h1>
 </div>

 <div className="page-content animate-fade-in">
 {/* Filters */}
 <div className="card print-hide" style={{ marginBottom: '20px' }}>
 <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
 <div className="input-group" style={{ margin: 0, minWidth: '250px', flex: 1 }}>
 <label className="input-label">العميل</label>
 <select className="input" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
 <option value="">-- اختر العميل --</option>
 {customers.map(c => (
 <option key={c.id} value={c.id}>{c.name} {c.taxNumber ? '(' + c.taxNumber + ')' : ''}</option>
 ))}
 </select>
 </div>
 <div className="input-group" style={{ margin: 0, width: '180px' }}>
 <label className="input-label">من تاريخ</label>
 <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
 </div>
 <div className="input-group" style={{ margin: 0, width: '180px' }}>
 <label className="input-label">إلى تاريخ</label>
 <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
 </div>
 <button className="btn btn-primary" onClick={loadData} disabled={loading} style={{ height: '42px' }}>
 <Search size={16} style={{ display: 'inline', marginRight: '5px' }} /> {loading ? 'جاري التحميل...' : 'توليد الكشف'}
 </button>
 </div>
 </div>

 {statement && (
 <div className="card" style={{ padding: '40px', backgroundColor: '#fff' }} id="printable-area">
 {/* Header for print */}
 <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #374151', paddingBottom: '20px', marginBottom: '30px' }}>
 <div>
 <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#111827' }}>كشف حساب عميل</h2>
 <p style={{ margin: '5px 0', color: '#4b5563' }}><strong>اسم العميل:</strong> {statement.customer.name}</p>
 {statement.customer.taxNumber && <p style={{ margin: '5px 0', color: '#4b5563' }}><strong>الرقم الضريبي:</strong> {statement.customer.taxNumber}</p>}
 {statement.customer.phone && <p style={{ margin: '5px 0', color: '#4b5563' }}><strong>الجوال:</strong> {statement.customer.phone}</p>}
 </div>
 <div style={{ textAlign: 'left' }}>
 <div className="print-hide">
 <button className="btn btn-outline" onClick={printStatement} style={{ marginBottom: '15px' }}>
 <Printer size={16} style={{display:'inline', marginRight:'5px'}}/> طباعة PDF
 </button>
 </div>
 <p style={{ margin: '5px 0', color: '#4b5563' }}><strong>التاريخ:</strong> {new Date().toLocaleDateString('ar-SA')}</p>
 <p style={{ margin: '5px 0', color: '#4b5563' }}><strong>الفترة من:</strong> {dateFrom || 'البداية'} <strong>إلى:</strong> {dateTo || 'الآن'}</p>
 </div>
 </div>

 {/* Statement Table */}
 <table className="table" style={{ width: '100%', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
 <thead style={{ backgroundColor: '#f9fafb' }}>
 <tr>
 <th>التاريخ</th>
 <th>المستند</th>
 <th>البيان</th>
 <th>مدين (لكم)</th>
 <th>دائن (عليكم)</th>
 <th>الرصيد</th>
 </tr>
 </thead>
 <tbody>
 <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>
 <td colSpan={3}>الرصيد الافتتاحي (Opening Balance)</td>
 <td>{statement.openingBalance > 0 ? statement.openingBalance.toFixed(2) : '-'}</td>
 <td>{statement.openingBalance < 0 ? Math.abs(statement.openingBalance).toFixed(2) : '-'}</td>
 <td style={{ color: statement.openingBalance > 0 ? '#ef4444' : '#10b981' }}>{statement.openingBalance.toFixed(2)}</td>
 </tr>
 {statement.transactions.map((t: any, idx: number) => (
 <tr key={idx}>
 <td>{new Date(t.date).toLocaleDateString('ar-SA')}</td>
 <td>{t.ref}</td>
 <td>{t.description}</td>
 <td>{t.debit > 0 ? t.debit.toFixed(2) : '-'}</td>
 <td>{t.credit > 0 ? t.credit.toFixed(2) : '-'}</td>
 <td style={{ fontWeight: 'bold', color: t.balance > 0 ? '#ef4444' : '#10b981' }}>{t.balance.toFixed(2)}</td>
 </tr>
 ))}
 <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold', fontSize: '16px' }}>
 <td colSpan={3} style={{ textAlign: 'left' }}>الرصيد الختامي (Closing Balance)</td>
 <td colSpan={2}></td>
 <td style={{ color: statement.closingBalance > 0 ? '#ef4444' : '#10b981' }}>{statement.closingBalance.toFixed(2)}</td>
 </tr>
 </tbody>
 </table>

 {/* Aging Summary */}
 <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
 <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#374151' }}>تحليل أعمار الديون (AR Aging Summary)</h3>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', textAlign: 'center' }}>
 <div>
 <div style={{ color: '#6b7280', fontSize: '12px' }}>جاري (لم يستحق)</div>
 <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{statement.aging.current.toFixed(2)}</div>
 </div>
 <div>
 <div style={{ color: '#6b7280', fontSize: '12px' }}>1-30 يوم</div>
 <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{statement.aging['1-30'].toFixed(2)}</div>
 </div>
 <div>
 <div style={{ color: '#f59e0b', fontSize: '12px' }}>31-60 يوم</div>
 <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#f59e0b' }}>{statement.aging['31-60'].toFixed(2)}</div>
 </div>
 <div>
 <div style={{ color: '#ea580c', fontSize: '12px' }}>61-90 يوم</div>
 <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#ea580c' }}>{statement.aging['61-90'].toFixed(2)}</div>
 </div>
 <div>
 <div style={{ color: '#ef4444', fontSize: '12px' }}>+90 يوم</div>
 <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#ef4444' }}>{statement.aging['90+'].toFixed(2)}</div>
 </div>
 </div>
 </div>

 </div>
 )}
 </div>
 <style dangerouslySetInnerHTML={{__html: `
 @media print {
 .print-hide { display: none !important; }
 body { background: white; margin: 0; padding: 0; }
 .main-content { margin: 0 !important; padding: 0 !important; }
 #printable-area { border: none !important; box-shadow: none !important; padding: 0 !important; }
 .table { border-collapse: collapse; }
 .table th, .table td { border: 1px solid #000; padding: 8px; }
 }
 `}} />
 </>
 );
}
