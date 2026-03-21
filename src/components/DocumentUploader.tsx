'use client';

import React, { useState, useEffect, useRef } from 'react';

interface DocumentUploaderProps {
    documentType: string;
    documentId: number;
    title?: string;
}

export default function DocumentUploader({ documentType, documentId, title = 'المستندات المرفقة' }: DocumentUploaderProps) {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Upload form state
    const [docName, setDocName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`/api/documents?documentType=${documentType}&documentId=${documentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setDocs(await res.json());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (documentId) fetchDocs();
    }, [documentType, documentId]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileInputRef.current?.files?.[0]) return alert('الرجاء اختيار ملف');

        setUploading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const formData = new FormData();
            formData.append('documentType', documentType);
            formData.append('documentId', documentId.toString());
            formData.append('file', fileInputRef.current.files[0]);
            if (docName) formData.append('docName', docName);
            if (expiryDate) formData.append('expiryDate', expiryDate);

            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }, // don't set Content-Type for FormData
                body: formData
            });

            if (res.ok) {
                // reset form
                setDocName('');
                setExpiryDate('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchDocs();
            } else {
                alert('فشل الرفع');
            }
        } catch (err) {
            console.error(err);
        }
        setUploading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('الرجاء التأكيد على حذف المستند بشكل نهائي؟')) return;
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`/api/documents/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchDocs();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
                📎 {title}
            </h3>

            {/* List Attached Documents */}
            {loading ? <p>جاري تحميل المرفقات...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                    {docs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>لا توجد مستندات مرفقة.</p> : docs.map(doc => (
                        <div key={doc.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '15px', position: 'relative', background: 'var(--bg-lighter)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>{doc.docName}</h4>
                                <button onClick={() => handleDelete(doc.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '18px' }} title="حذف المستند">✕</button>
                            </div>
                            
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                                <p style={{ margin: '2px 0' }}>تاريخ الرفع: {new Date(doc.createdAt).toLocaleDateString()}</p>
                                {doc.expiryDate && (
                                    <p style={{ margin: '2px 0', color: new Date(doc.expiryDate) < new Date() ? 'red' : 'inherit' }}>
                                        تاريخ الانتهاء: {new Date(doc.expiryDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>

                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'block', textAlign: 'center', width: '100%', padding: '5px' }}>
                                👁️ عرض / تحميل
                            </a>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Form */}
            <form onSubmit={handleUpload} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <h4 style={{ margin: '0 0 15px 0' }}>إرفاق مستند جديد</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                        <label className="input-label">اسم المستند (وصف قصير)</label>
                        <input type="text" className="input" value={docName} onChange={e => setDocName(e.target.value)} placeholder="مثال: فاتورة المورد، بوليصة التأمين..." />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                        <label className="input-label">تاريخ الانتهاء (إن وجد)</label>
                        <input type="date" className="input" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                    </div>
                </div>

                <div className="input-group" style={{ margin: '0 0 15px 0' }}>
                    <label className="input-label">الملف المرفق *</label>
                    <input type="file" ref={fileInputRef} className="input" style={{ padding: '8px' }} required />
                </div>

                <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? 'جاري الرفع...' : '⬆️ رفع المرفق'}
                </button>
            </form>
        </div>
    );
}
