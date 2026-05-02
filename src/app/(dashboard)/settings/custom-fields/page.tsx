'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { Settings2, Plus, Save, Trash2, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/components/Toast';

const ENTITY_TYPES = [
    { value: 'Customer', label: 'العملاء' },
    { value: 'Product', label: 'المنتجات' },
    { value: 'Invoice', label: 'الفواتير' },
    { value: 'Vendor', label: 'الموردين' },
    { value: 'Employee', label: 'الموظفين' },
    { value: 'PurchaseOrder', label: 'أوامر الشراء' },
];

const FIELD_TYPES = [
    { value: 'TEXT', label: 'نص' },
    { value: 'NUMBER', label: 'رقم' },
    { value: 'DATE', label: 'تاريخ' },
    { value: 'DROPDOWN', label: 'قائمة منسدلة' },
    { value: 'CHECKBOX', label: 'مربع اختيار' },
];

export default function CustomFieldsPage() {
    const { t } = useTranslation();
    const { success, error } = useToast();
    const [fields, setFields] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntity, setSelectedEntity] = useState('Customer');
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ fieldName: '', fieldLabel: '', fieldType: 'TEXT', isRequired: false });

    useEffect(() => { loadData(); }, [selectedEntity]);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`/api/settings/custom-fields?entity=${selectedEntity}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await res.json();
            if (res.ok) setFields(d.fields || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    async function addField() {
        if (!form.fieldName || !form.fieldLabel) { error('اسم الحقل والعنوان مطلوبان'); return; }
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/settings/custom-fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: 'define', entityType: selectedEntity, ...form })
            });
            if (res.ok) {
                success('تم إضافة الحقل المخصص بنجاح');
                setShowAdd(false);
                setForm({ fieldName: '', fieldLabel: '', fieldType: 'TEXT', isRequired: false });
                loadData();
            } else {
                const d = await res.json();
                error(d.error || 'فشل');
            }
        } catch (e) { console.error(e); }
    }

    async function toggleField(id: number, isActive: boolean) {
        try {
            const token = localStorage.getItem('token') || '';
            await fetch('/api/settings/custom-fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: 'toggle', id, isActive: !isActive })
            });
            loadData();
        } catch (e) { console.error(e); }
    }

    const fieldTypeLabel = (type: string) => FIELD_TYPES.find(f => f.value === type)?.label || type;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">محرك الحقول المخصصة (Custom Fields)</h1>
            </div>

            <div className="page-content animate-fade-in">
                {/* Entity Selector */}
                <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <label style={{ fontWeight: '500' }}>اختر الكيان:</label>
                        {ENTITY_TYPES.map(et => (
                            <button
                                key={et.value}
                                className={`btn ${selectedEntity === et.value ? 'btn-primary' : 'btn-outline'}`}
                                style={{ fontSize: '13px' }}
                                onClick={() => setSelectedEntity(et.value)}
                            >
                                {et.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fields Table */}
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '18px', margin: 0 }}>
                            الحقول المخصصة لـ {ENTITY_TYPES.find(e => e.value === selectedEntity)?.label}
                        </h2>
                        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
                            <Plus size={16} style={{ marginLeft: '5px' }} /> إضافة حقل جديد
                        </button>
                    </div>

                    {showAdd && (
                        <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>اسم الحقل (بالإنجليزية)</label>
                                <input className="form-input" value={form.fieldName} onChange={e => setForm({ ...form, fieldName: e.target.value })} placeholder="custom_field_1" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>عنوان الحقل (العرض)</label>
                                <input className="form-input" value={form.fieldLabel} onChange={e => setForm({ ...form, fieldLabel: e.target.value })} placeholder="رقم السجل التجاري" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6b7280' }}>نوع الحقل</label>
                                <select className="form-select" value={form.fieldType} onChange={e => setForm({ ...form, fieldType: e.target.value })}>
                                    {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" checked={form.isRequired} onChange={e => setForm({ ...form, isRequired: e.target.checked })} />
                                    إلزامي
                                </label>
                            </div>
                            <div style={{ gridColumn: '1 / -1', textAlign: 'left' }}>
                                <button className="btn btn-primary" onClick={addField}><Save size={16} style={{ marginLeft: '5px' }} /> حفظ</button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '30px' }}>جاري التحميل...</div>
                    ) : fields.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                            <Settings2 size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                            <p>لا توجد حقول مخصصة لهذا الكيان بعد. أضف حقولاً لتخصيص النماذج تلقائياً</p>
                        </div>
                    ) : (
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '30px' }}></th>
                                    <th>اسم الحقل</th>
                                    <th>العنوان</th>
                                    <th>النوع</th>
                                    <th>إلزامي</th>
                                    <th>الحالة</th>
                                    <th>تفعيل/إيقاف</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fields.map((f: any) => (
                                    <tr key={f.id} style={{ opacity: f.isActive ? 1 : 0.5 }}>
                                        <td><GripVertical size={14} style={{ color: '#d1d5db', cursor: 'grab' }} /></td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{f.fieldName}</td>
                                        <td style={{ fontWeight: '500' }}>{f.fieldLabel}</td>
                                        <td><span className="badge badge-outline">{fieldTypeLabel(f.fieldType)}</span></td>
                                        <td>{f.isRequired ? <span className="badge badge-danger">إلزامي</span> : <span className="badge badge-outline">اختياري</span>}</td>
                                        <td>{f.isActive ? <span className="badge badge-success">نشط</span> : <span className="badge badge-outline">معطل</span>}</td>
                                        <td>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                                onClick={() => toggleField(f.id, f.isActive)}
                                            >
                                                {f.isActive ? <ToggleRight size={16} style={{ color: '#10b981' }} /> : <ToggleLeft size={16} style={{ color: '#6b7280' }} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
