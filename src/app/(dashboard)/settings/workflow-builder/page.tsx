'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

type WFState = { id: string; name: string; nameAr: string; color: string; x: number; y: number; isFinal: boolean };
type WFTransition = { id: string; from: string; to: string; label: string; labelAr: string; conditions: any[]; actions: any[]; requiredRole?: string };

const MODELS = [
  { key: 'SalesInvoice', label: 'Sales Invoice', labelAr: 'فاتورة مبيعات' },
  { key: 'PurchaseInvoice', label: 'Purchase Invoice', labelAr: 'فاتورة مشتريات' },
  { key: 'PurchaseOrder', label: 'Purchase Order', labelAr: 'أمر شراء' },
  { key: 'SalesOrder', label: 'Sales Order', labelAr: 'أمر بيع' },
  { key: 'Expense', label: 'Expense', labelAr: 'مصروفات' },
  { key: 'Vacation', label: 'Leave Request', labelAr: 'طلب إجازة' },
];

const COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#795548', '#607D8B'];

export default function WorkflowBuilderPage() {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [model, setModel] = useState('PurchaseInvoice');
  const [states, setStates] = useState<WFState[]>([
    { id: 's1', name: 'Draft', nameAr: 'مسودة', color: '#607D8B', x: 50, y: 120, isFinal: false },
    { id: 's2', name: 'Review', nameAr: 'مراجعة', color: '#FF9800', x: 250, y: 120, isFinal: false },
    { id: 's3', name: 'Approved', nameAr: 'معتمد', color: '#4CAF50', x: 450, y: 120, isFinal: true },
  ]);
  const [transitions, setTransitions] = useState<WFTransition[]>([
    { id: 't1', from: 's1', to: 's2', label: 'Submit', labelAr: 'إرسال', conditions: [], actions: [] },
    { id: 't2', from: 's2', to: 's3', label: 'Approve', labelAr: 'اعتماد', conditions: [], actions: [] },
    { id: 't3', from: 's2', to: 's1', label: 'Reject', labelAr: 'رفض', conditions: [], actions: [] },
  ]);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addState = () => {
    const id = 's' + (states.length + 1);
    setStates([...states, { id, name: 'New State', nameAr: 'مرحلة جديدة', color: COLORS[states.length % COLORS.length], x: 100 + states.length * 80, y: 250, isFinal: false }]);
  };

  const addTransition = () => {
    if (states.length < 2) return;
    const id = 't' + (transitions.length + 1);
    setTransitions([...transitions, { id, from: states[0].id, to: states[1].id, label: 'Action', labelAr: 'إجراء', conditions: [], actions: [] }]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/system/workflow', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', definition: { name: model + ' Workflow', targetModel: model, states, transitions } }),
      });
      toastSuccess(isAr ? 'تم الحفظ ✅' : 'Saved ✅');
    } catch { } finally { setSaving(false); }
  };

  const selectedState = states.find(s => s.id === selected);
  const selectedTrans = transitions.find(t => t.id === selected);

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{isAr ? '⚙️ مصمم سير العمل' : '⚙️ Workflow Builder'}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={model} onChange={e => setModel(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}>
            {MODELS.map(m => <option key={m.key} value={m.key}>{isAr ? m.labelAr : m.label}</option>)}
          </select>
          <button onClick={save} disabled={saving} style={{ padding: '8px 24px', borderRadius: 8, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {saving ? '...' : isAr ? '💾 حفظ' : '💾 Save'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Canvas */}
        <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 16, minHeight: 400, position: 'relative', border: '2px dashed #e0e0e0' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={addState} style={{ padding: '6px 16px', borderRadius: 6, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>+ {isAr ? 'مرحلة' : 'State'}</button>
            <button onClick={addTransition} style={{ padding: '6px 16px', borderRadius: 6, background: '#FF9800', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>+ {isAr ? 'انتقال' : 'Transition'}</button>
          </div>

          {/* Draw transitions as lines */}
          <svg style={{ position: 'absolute', top: 60, left: 0, width: '100%', height: 340, pointerEvents: 'none' }}>
            {transitions.map(t => {
              const from = states.find(s => s.id === t.from);
              const to = states.find(s => s.id === t.to);
              if (!from || !to) return null;
              const fx = from.x + 60, fy = from.y + 20, tx = to.x + 60, ty = to.y + 20;
              return (
                <g key={t.id}>
                  <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={selected === t.id ? '#2196F3' : '#999'} strokeWidth={selected === t.id ? 3 : 1.5} markerEnd="url(#arrow)" />
                  <text x={(fx + tx) / 2} y={(fy + ty) / 2 - 8} fontSize={11} fill="#666" textAnchor="middle">{isAr ? t.labelAr : t.label}</text>
                </g>
              );
            })}
            <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#999" /></marker></defs>
          </svg>

          {/* States as boxes */}
          {states.map(s => (
            <div key={s.id} onClick={() => setSelected(s.id)}
              style={{ position: 'absolute', left: s.x, top: s.y + 60, width: 120, padding: '12px 8px', background: '#fff', borderRadius: 10, textAlign: 'center', cursor: 'pointer', boxShadow: selected === s.id ? `0 0 0 3px ${s.color}` : '0 2px 6px rgba(0,0,0,0.1)', borderTop: `3px solid ${s.color}`, zIndex: 2, transition: 'box-shadow 0.2s' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{isAr ? s.nameAr : s.name}</div>
              {s.isFinal && <div style={{ fontSize: 10, color: '#4CAF50', marginTop: 2 }}>✅ {isAr ? 'نهائي' : 'Final'}</div>}
            </div>
          ))}

          {/* Clickable transition zones */}
          {transitions.map(t => {
            const from = states.find(s => s.id === t.from);
            const to = states.find(s => s.id === t.to);
            if (!from || !to) return null;
            return <div key={'click-' + t.id} onClick={() => setSelected(t.id)} style={{ position: 'absolute', left: (from.x + to.x) / 2 + 30, top: (from.y + to.y) / 2 + 50, width: 60, height: 20, cursor: 'pointer', zIndex: 3 }} />;
          })}
        </div>

        {/* Properties Panel */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ marginBottom: 12, fontSize: 14 }}>{isAr ? 'الخصائص' : 'Properties'}</h3>
          {selectedState && (
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'الاسم (EN)' : 'Name (EN)'}</label>
              <input value={selectedState.name} onChange={e => setStates(states.map(s => s.id === selected ? { ...s, name: e.target.value } : s))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginBottom: 8 }} />
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'الاسم (AR)' : 'Name (AR)'}</label>
              <input value={selectedState.nameAr} onChange={e => setStates(states.map(s => s.id === selected ? { ...s, nameAr: e.target.value } : s))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginBottom: 8 }} />
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'اللون' : 'Color'}</label>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {COLORS.map(c => <div key={c} onClick={() => setStates(states.map(s => s.id === selected ? { ...s, color: c } : s))} style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: selectedState.color === c ? '3px solid #333' : '2px solid transparent' }} />)}
              </div>
              <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={selectedState.isFinal} onChange={e => setStates(states.map(s => s.id === selected ? { ...s, isFinal: e.target.checked } : s))} />
                {isAr ? 'مرحلة نهائية' : 'Final state'}
              </label>
              <button onClick={() => { setStates(states.filter(s => s.id !== selected)); setTransitions(transitions.filter(t => t.from !== selected && t.to !== selected)); setSelected(null); }} style={{ marginTop: 12, padding: '6px 16px', borderRadius: 6, background: '#F44336', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>🗑 {isAr ? 'حذف' : 'Delete'}</button>
            </div>
          )}
          {selectedTrans && (
            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'من' : 'From'}</label>
              <select value={selectedTrans.from} onChange={e => setTransitions(transitions.map(t => t.id === selected ? { ...t, from: e.target.value } : t))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginBottom: 8 }}>
                {states.map(s => <option key={s.id} value={s.id}>{isAr ? s.nameAr : s.name}</option>)}
              </select>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'إلى' : 'To'}</label>
              <select value={selectedTrans.to} onChange={e => setTransitions(transitions.map(t => t.id === selected ? { ...t, to: e.target.value } : t))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginBottom: 8 }}>
                {states.map(s => <option key={s.id} value={s.id}>{isAr ? s.nameAr : s.name}</option>)}
              </select>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'التسمية' : 'Label'}</label>
              <input value={selectedTrans.label} onChange={e => setTransitions(transitions.map(t => t.id === selected ? { ...t, label: e.target.value } : t))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginBottom: 8 }} />
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{isAr ? 'الدور المطلوب' : 'Required Role'}</label>
              <select value={selectedTrans.requiredRole || ''} onChange={e => setTransitions(transitions.map(t => t.id === selected ? { ...t, requiredRole: e.target.value } : t))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginBottom: 8 }}>
                <option value="">{isAr ? '— أي دور —' : '— Any —'}</option>
                <option value="admin">{isAr ? 'مدير النظام' : 'Admin'}</option>
                <option value="manager">{isAr ? 'مدير' : 'Manager'}</option>
                <option value="accountant">{isAr ? 'محاسب' : 'Accountant'}</option>
              </select>
              <button onClick={() => { setTransitions(transitions.filter(t => t.id !== selected)); setSelected(null); }} style={{ marginTop: 8, padding: '6px 16px', borderRadius: 6, background: '#F44336', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>🗑 {isAr ? 'حذف' : 'Delete'}</button>
            </div>
          )}
          {!selected && <p style={{ color: '#999', fontSize: 13, textAlign: 'center' }}>{isAr ? 'انقر على مرحلة أو سهم لتعديلها' : 'Click a state or arrow to edit'}</p>}
        </div>
      </div>
    </div>
  );
}
