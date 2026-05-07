'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function DMSPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [folders, setFolders] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: number | null; name: string }[]>([{ id: null, name: isAr ? 'الرئيسية' : 'Root' }]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const url = currentFolder ? `/api/system/dms?folderId=${currentFolder}` : '/api/system/dms';
    fetch(url).then(r => r.json()).then(d => { setFolders(d.folders || []); setDocuments(d.documents || []); }).catch(() => {});
  }, [currentFolder]);

  const openFolder = (id: number, name: string) => {
    setCurrentFolder(id);
    setBreadcrumb(prev => [...prev, { id, name }]);
  };

  const goTo = (id: number | null, index: number) => {
    setCurrentFolder(id);
    setBreadcrumb(prev => prev.slice(0, index + 1));
  };

  const formatSize = (bytes: number) => bytes > 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : (bytes / 1024).toFixed(0) + ' KB';
  const fileIcon = (mime: string) => mime?.includes('pdf') ? '📄' : mime?.includes('image') ? '🖼️' : mime?.includes('sheet') || mime?.includes('excel') ? '📊' : mime?.includes('doc') ? '📝' : '📎';

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{isAr ? '📁 إدارة المستندات' : '📁 Document Management'}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={isAr ? 'بحث...' : 'Search...'} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', width: 200 }} />
          <button style={{ padding: '8px 16px', borderRadius: 8, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' }}>{isAr ? '📤 رفع ملف' : '📤 Upload'}</button>
          <button style={{ padding: '8px 16px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer' }}>{isAr ? '📁 مجلد جديد' : '📁 New Folder'}</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {breadcrumb.map((b, i) => (
          <span key={i}>
            <span onClick={() => goTo(b.id, i)} style={{ cursor: 'pointer', color: i === breadcrumb.length - 1 ? '#333' : '#2196F3', fontWeight: i === breadcrumb.length - 1 ? 700 : 400, fontSize: 13 }}>{b.name}</span>
            {i < breadcrumb.length - 1 && <span style={{ margin: '0 4px', color: '#ccc' }}>/</span>}
          </span>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 16 }}>
        {folders.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{isAr ? 'المجلدات' : 'Folders'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {folders.map((f: any) => (
                <div key={f.id} onClick={() => openFolder(f.id, f.name)} style={{ padding: 16, borderRadius: 8, border: '1px solid #e8e8e8', cursor: 'pointer', textAlign: 'center', transition: 'background 0.2s' }}>
                  <div style={{ fontSize: 32 }}>📁</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{f.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{isAr ? 'الملفات' : 'Files'}</div>
        {documents.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f9f9f9' }}>
              <th style={{ padding: 8, textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'الاسم' : 'Name'}</th>
              <th style={{ padding: 8 }}>{isAr ? 'الحجم' : 'Size'}</th>
              <th style={{ padding: 8 }}>{isAr ? 'النسخة' : 'Version'}</th>
              <th style={{ padding: 8 }}>{isAr ? 'التاريخ' : 'Date'}</th>
            </tr></thead>
            <tbody>
              {documents.map((d: any) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                  <td style={{ padding: 8 }}>{fileIcon(d.mimeType)} {d.name}</td>
                  <td style={{ padding: 8, textAlign: 'center', fontSize: 12, color: '#888' }}>{formatSize(d.size || 0)}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>v{d.version || 1}</td>
                  <td style={{ padding: 8, textAlign: 'center', fontSize: 12, color: '#888' }}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#ccc' }}>{isAr ? 'لا توجد ملفات' : 'No files'}</div>
        )}
      </div>
    </div>
  );
}
