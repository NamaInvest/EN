'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function PrintTemplatesPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [model, setModel] = useState('SalesInvoice');
  const [fields, setFields] = useState<any[]>([]);
  const [template, setTemplate] = useState({ headerHtml: '', bodyHtml: '', footerHtml: '' });
  const [pageSize, setPageSize] = useState('A4');

  useEffect(() => {
    fetch(`/api/system/print-templates?model=${model}`).then(r => r.json()).then(d => {
      setFields(d.fields || []);
      if (d.defaultTemplate) setTemplate(d.defaultTemplate);
    }).catch(() => {});
  }, [model]);

  const insertField = (key: string) => {
    setTemplate(t => ({ ...t, bodyHtml: t.bodyHtml + key }));
  };

  const MODELS = [
    { key: 'SalesInvoice', label: isAr ? 'فاتورة مبيعات' : 'Sales Invoice' },
    { key: 'PurchaseOrder', label: isAr ? 'أمر شراء' : 'Purchase Order' },
    { key: 'PurchaseInvoice', label: isAr ? 'فاتورة مشتريات' : 'Purchase Invoice' },
  ];

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{isAr ? '🖨️ مصمم قوالب الطباعة' : '🖨️ Print Template Designer'}</h1>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select value={model} onChange={e => setModel(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}>
          {MODELS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
        <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}>
          <option value="A4">A4</option><option value="A5">A5</option><option value="THERMAL">80mm Thermal</option>
        </select>
        <button style={{ padding: '8px 24px', borderRadius: 8, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{isAr ? '💾 حفظ' : '💾 Save'}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: 16 }}>
        {/* Fields panel */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxHeight: 600, overflowY: 'auto' }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>{isAr ? 'الحقول المتاحة' : 'Available Fields'}</h3>
          {fields.map((f: any) => (
            <div key={f.key} onClick={() => insertField(f.key)} style={{ padding: '8px 10px', borderRadius: 6, marginBottom: 4, cursor: 'pointer', background: '#f5f5f5', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              title={f.key}>
              <span>{isAr ? f.labelAr : f.label}</span>
              <span style={{ color: '#999', fontSize: 10 }}>{f.type === 'currency' ? '💰' : f.type === 'date' ? '📅' : f.type === 'table' ? '📊' : f.type === 'qrcode' ? '📱' : f.type === 'image' ? '🖼️' : '📝'}</span>
            </div>
          ))}
        </div>

        {/* Template preview */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ background: '#f0f0f0', padding: '8px 16px', fontSize: 12, color: '#666' }}>{isAr ? 'رأس الصفحة' : 'Header'}</div>
          <textarea value={template.headerHtml} onChange={e => setTemplate({ ...template, headerHtml: e.target.value })} style={{ width: '100%', minHeight: 100, padding: 12, border: 'none', borderBottom: '1px solid #eee', fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
          
          <div style={{ background: '#f0f0f0', padding: '8px 16px', fontSize: 12, color: '#666' }}>{isAr ? 'المحتوى' : 'Body'}</div>
          <textarea value={template.bodyHtml} onChange={e => setTemplate({ ...template, bodyHtml: e.target.value })} style={{ width: '100%', minHeight: 200, padding: 12, border: 'none', borderBottom: '1px solid #eee', fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
          
          <div style={{ background: '#f0f0f0', padding: '8px 16px', fontSize: 12, color: '#666' }}>{isAr ? 'التذييل' : 'Footer'}</div>
          <textarea value={template.footerHtml} onChange={e => setTemplate({ ...template, footerHtml: e.target.value })} style={{ width: '100%', minHeight: 80, padding: 12, border: 'none', fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
        </div>

        {/* Settings panel */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>{isAr ? 'الإعدادات' : 'Settings'}</h3>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'الخط' : 'Font'}</label>
          <select style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginBottom: 12 }}>
            <option>{_t('Cairo', 'Cairo')}</option><option>{_t('Tajawal', 'Tajawal')}</option><option>{_t('Noto Sans Arabic', 'Noto Sans Arabic')}</option><option>{_t('Arial', 'Arial')}</option>
          </select>
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'حجم الخط' : 'Font Size'}</label>
          <input type="number" defaultValue={14} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginBottom: 12 }} />
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'اللون الرئيسي' : 'Primary Color'}</label>
          <input type="color" defaultValue="#333333" style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid #ddd', marginBottom: 12 }} />
          <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'الهوامش (mm)' : 'Margins (mm)'}</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <input type="number" defaultValue={20} placeholder={isAr ? 'أعلى' : 'Top'} style={{ padding: 6, borderRadius: 4, border: '1px solid #ddd', fontSize: 12 }} />
            <input type="number" defaultValue={20} placeholder={isAr ? 'أسفل' : 'Bottom'} style={{ padding: 6, borderRadius: 4, border: '1px solid #ddd', fontSize: 12 }} />
            <input type="number" defaultValue={15} placeholder={isAr ? 'يمين' : 'Right'} style={{ padding: 6, borderRadius: 4, border: '1px solid #ddd', fontSize: 12 }} />
            <input type="number" defaultValue={15} placeholder={isAr ? 'يسار' : 'Left'} style={{ padding: 6, borderRadius: 4, border: '1px solid #ddd', fontSize: 12 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
