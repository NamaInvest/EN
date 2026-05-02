'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function QualityControlPage() {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const [pending, setPending] = useState<any[]>([]);
    const [completed, setCompleted] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedIns, setSelectedIns] = useState<any>(null);
    const [notes, setNotes] = useState('');

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/inventory/quality-control', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json();
            if (res.ok) {
                setPending(d.pending || []);
                setCompleted(d.completed || []);
            } else {
                error(d.error || 'فشل في الجلب');
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    const processInspection = async (status: string) => {
        if (!selectedIns) return;
        
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/inventory/quality-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    id: selectedIns.id,
                    status,
                    notes
                })
            });
            const result = await res.json();
            if (res.ok) {
                success(status === 'PASSED' ? 'تم اجتياز الفحص' : (status === 'FAILED' ? 'تم تسجيل الفشل (NCR)' : 'مطلوب إعادة العمل'));
                setSelectedIns(null);
                setNotes('');
                loadData();
            } else {
                error(result.error || 'فشل في التحديث');
            }
        } catch (e) { console.error(e); }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">إدارة الجودة (Quality Control & NCR)</h1>
            </div>

            <div className="page-content animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
                <div>
                    <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', margin: '0 0 20px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                            الفحوصات المعلقة (Pending Inspections) <span className="badge badge-warning">{pending.length}</span>
                        </h2>
                        {pending.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>لا توجد فحوصات معلقة</div>
                        ) : (
                            <table className="table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>رقم المرجع (GRN/MO)</th>
                                        <th>تاريخ الطلب</th>
                                        <th>إجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pending.map(p => (
                                        <tr key={p.id} style={{ backgroundColor: selectedIns?.id === p.id ? '#f3f4f6' : 'transparent' }}>
                                            <td style={{ fontWeight: 'bold' }}>{p.referenceNumber}</td>
                                            <td>{new Date(p.createdAt).toLocaleDateString('ar-SA')}</td>
                                            <td>
                                                <button className="btn btn-outline" onClick={() => setSelectedIns(p)}>
                                                    معاينة وفحص
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="card" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '18px', margin: '0 0 20px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                            أحدث الفحوصات المنجزة
                        </h2>
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>رقم المرجع</th>
                                    <th>الحالة</th>
                                    <th>الملاحظات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completed.map(c => (
                                    <tr key={c.id}>
                                        <td>{c.referenceNumber}</td>
                                        <td>
                                            {c.status === 'PASSED' && <span className="badge badge-success">اجتاز</span>}
                                            {c.status === 'FAILED' && <span className="badge badge-error">فشل (NCR)</span>}
                                            {c.status === 'REWORK' && <span className="badge badge-warning">إعادة عمل</span>}
                                        </td>
                                        <td>{c.notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <div className="card" style={{ padding: '20px', position: 'sticky', top: '20px' }}>
                        <h2 style={{ fontSize: '18px', margin: '0 0 20px 0' }}>لوحة التحكم بالفحص</h2>
                        {!selectedIns ? (
                            <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>
                                الرجاء اختيار مستند من القائمة لإجراء الفحص
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>رقم المستند المرجعي</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedIns.referenceNumber}</div>
                                </div>
                                
                                <div className="input-group" style={{ margin: 0 }}>
                                    <label className="input-label">ملاحظات الفاحص (إلزامي في حال الرفض)</label>
                                    <textarea 
                                        className="input" 
                                        rows={4} 
                                        value={notes} 
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="اكتب أسباب الرفض أو القبول..."
                                    ></textarea>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginTop: '10px' }}>
                                    <button className="btn btn-success" onClick={() => processInspection('PASSED')} style={{ height: '45px' }}>
                                        <CheckCircle size={18} style={{display:'inline', marginRight:'8px'}}/> مطابقة للمواصفات (Pass)
                                    </button>
                                    <button className="btn btn-warning" onClick={() => processInspection('REWORK')} style={{ height: '45px' }}>
                                        <RefreshCw size={18} style={{display:'inline', marginRight:'8px'}}/> إرسال لإعادة العمل (Rework)
                                    </button>
                                    <button className="btn btn-error" onClick={() => {
                                        if (!notes) return error('يجب كتابة سبب الرفض في الملاحظات');
                                        processInspection('FAILED');
                                    }} style={{ height: '45px' }}>
                                        <XCircle size={18} style={{display:'inline', marginRight:'8px'}}/> إصدار تقرير عدم مطابقة (NCR)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
