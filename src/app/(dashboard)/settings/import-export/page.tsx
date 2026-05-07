'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';

const MODELS = [
  { key: 'Product', label: 'Products', labelAr: 'المنتجات' },
  { key: 'Customer', label: 'Customers', labelAr: 'العملاء' },
  { key: 'Supplier', label: 'Suppliers', labelAr: 'الموردين' },
  { key: 'Account', label: 'Accounts', labelAr: 'الحسابات' },
  { key: 'Employee', label: 'Employees', labelAr: 'الموظفين' },
];

export default function ImportExportPage() {
  const { t, lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [tab, setTab] = useState<'import' | 'export'>('import');
  const [step, setStep] = useState(1);
  const [model, setModel] = useState('Product');
  const [csvText, setCsvText] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [sample, setSample] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exportFields, setExportFields] = useState<string[]>([]);

  const detect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/import-export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detect', csv: csvText, model }),
      });
      const data = await res.json();
      setColumns(data.columns || []);
      setSample(data.sampleData || []);
      setTotalRows(data.totalRows || 0);
      setMapping(data.autoMapping || {});
      setStep(2);
    } catch { } finally { setLoading(false); }
  };

  const doImport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/import-export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', csv: csvText, model, mapping }),
      });
      setResult(await res.json());
      setStep(4);
    } catch { } finally { setLoading(false); }
  };

  const doExport = async () => {
    window.open(`/api/system/import-export?model=${model}`, '_blank');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target?.result as string || '');
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        {isAr ? '📥 استيراد / تصدير البيانات' : '📥 Import / Export Data'}
      </h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('import')} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: tab === 'import' ? '#2196F3' : '#e0e0e0', color: tab === 'import' ? '#fff' : '#333', cursor: 'pointer', fontWeight: 600 }}>
          {isAr ? 'استيراد' : 'Import'}
        </button>
        <button onClick={() => setTab('export')} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: tab === 'export' ? '#4CAF50' : '#e0e0e0', color: tab === 'export' ? '#fff' : '#333', cursor: 'pointer', fontWeight: 600 }}>
          {isAr ? 'تصدير' : 'Export'}
        </button>
      </div>

      {tab === 'import' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {/* Steps indicator */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            {[1, 2, 3, 4].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= s ? '#2196F3' : '#e0e0e0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{s}</div>
                <span style={{ fontSize: 13, color: step >= s ? '#333' : '#999' }}>
                  {s === 1 ? (isAr ? 'رفع الملف' : 'Upload') : s === 2 ? (isAr ? 'ربط الأعمدة' : 'Mapping') : s === 3 ? (isAr ? 'معاينة' : 'Preview') : (isAr ? 'النتيجة' : 'Result')}
                </span>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>{isAr ? 'اختر النوع:' : 'Select type:'}</label>
              <select value={model} onChange={e => setModel(e.target.value)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 16, fontSize: 14 }}>
                {MODELS.map(m => <option key={m.key} value={m.key}>{isAr ? m.labelAr : m.label}</option>)}
              </select>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>{isAr ? 'ارفع ملف CSV:' : 'Upload CSV file:'}</label>
              <input type="file" accept=".csv,.txt" onChange={handleFile} style={{ marginBottom: 16 }} />
              {csvText && <p style={{ color: '#4CAF50' }}>✅ {isAr ? 'تم تحميل الملف' : 'File loaded'}</p>}
              <br />
              <button onClick={detect} disabled={!csvText || loading} style={{ padding: '10px 32px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: loading ? 0.5 : 1 }}>
                {loading ? '...' : isAr ? 'التالي ←' : 'Next →'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ marginBottom: 12, color: '#666' }}>{isAr ? `تم اكتشاف ${columns.length} عمود و ${totalRows} صف` : `Detected ${columns.length} columns, ${totalRows} rows`}</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead><tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: 8, border: '1px solid #ddd', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'عمود الملف' : 'File Column'}</th>
                  <th style={{ padding: 8, border: '1px solid #ddd', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'حقل النظام' : 'System Field'}</th>
                  <th style={{ padding: 8, border: '1px solid #ddd', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'عينة' : 'Sample'}</th>
                </tr></thead>
                <tbody>
                  {columns.map(col => (
                    <tr key={col}>
                      <td style={{ padding: 8, border: '1px solid #ddd', fontWeight: 600 }}>{col}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>
                        <select value={mapping[col] || ''} onChange={e => setMapping({ ...mapping, [col]: e.target.value })} style={{ padding: 4, borderRadius: 4, border: '1px solid #ddd', width: '100%' }}>
                          <option value="">— {isAr ? 'تجاهل' : 'Skip'} —</option>
                          <option value="name">{isAr ? 'الاسم' : 'Name'}</option>
                          <option value="barcode">{isAr ? 'الباركود' : 'Barcode'}</option>
                          <option value="salePrice">{isAr ? 'سعر البيع' : 'Sale Price'}</option>
                          <option value="costPrice">{isAr ? 'التكلفة' : 'Cost Price'}</option>
                          <option value="email">{isAr ? 'البريد' : 'Email'}</option>
                          <option value="phone">{isAr ? 'الهاتف' : 'Phone'}</option>
                          <option value="address">{isAr ? 'العنوان' : 'Address'}</option>
                          <option value="taxNumber">{isAr ? 'الرقم الضريبي' : 'Tax Number'}</option>
                          <option value="description">{isAr ? 'الوصف' : 'Description'}</option>
                          <option value="stockQuantity">{isAr ? 'الكمية' : 'Quantity'}</option>
                        </select>
                      </td>
                      <td style={{ padding: 8, border: '1px solid #ddd', color: '#888', fontSize: 12 }}>{sample[0]?.[col] || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(1)} style={{ padding: '8px 24px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>{isAr ? '← رجوع' : '← Back'}</button>
                <button onClick={() => setStep(3)} style={{ padding: '8px 24px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{isAr ? 'معاينة ←' : 'Preview →'}</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3>{isAr ? 'معاينة أول 5 صفوف:' : 'Preview first 5 rows:'}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead><tr style={{ background: '#f5f5f5' }}>
                  {Object.values(mapping).filter(Boolean).map(f => <th key={f} style={{ padding: 8, border: '1px solid #ddd' }}>{f}</th>)}
                </tr></thead>
                <tbody>
                  {sample.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {Object.entries(mapping).filter(([, v]) => v).map(([col]) => (
                        <td key={col} style={{ padding: 8, border: '1px solid #ddd' }}>{row[col] || ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: '#666', marginBottom: 16 }}>{isAr ? `سيتم استيراد ${totalRows} صف` : `Will import ${totalRows} rows`}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={{ padding: '8px 24px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>{isAr ? '← رجوع' : '← Back'}</button>
                <button onClick={doImport} disabled={loading} style={{ padding: '10px 32px', borderRadius: 8, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, opacity: loading ? 0.5 : 1 }}>
                  {loading ? (isAr ? 'جاري الاستيراد...' : 'Importing...') : (isAr ? '🚀 بدء الاستيراد' : '🚀 Start Import')}
                </button>
              </div>
            </div>
          )}

          {step === 4 && result && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{result.errors?.length > 0 ? '⚠️' : '✅'}</div>
              <h2>{isAr ? 'اكتمل الاستيراد' : 'Import Complete'}</h2>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', margin: '24px 0' }}>
                <div style={{ background: '#E8F5E9', borderRadius: 12, padding: '16px 32px' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#4CAF50' }}>{result.success}</div>
                  <div style={{ color: '#666' }}>{isAr ? 'نجاح' : 'Success'}</div>
                </div>
                <div style={{ background: '#FFEBEE', borderRadius: 12, padding: '16px 32px' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#F44336' }}>{result.errors?.length || 0}</div>
                  <div style={{ color: '#666' }}>{isAr ? 'أخطاء' : 'Errors'}</div>
                </div>
              </div>
              <button onClick={() => { setStep(1); setResult(null); setCsvText(''); }} style={{ padding: '10px 32px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer' }}>
                {isAr ? 'استيراد جديد' : 'New Import'}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'export' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>{isAr ? 'اختر النوع:' : 'Select type:'}</label>
          <select value={model} onChange={e => setModel(e.target.value)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 16 }}>
            {MODELS.map(m => <option key={m.key} value={m.key}>{isAr ? m.labelAr : m.label}</option>)}
          </select>
          <br />
          <button onClick={doExport} style={{ padding: '10px 32px', borderRadius: 8, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {isAr ? '📤 تصدير CSV' : '📤 Export CSV'}
          </button>
        </div>
      )}
    </div>
  );
}
