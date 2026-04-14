'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { translate } from '@/lib/translations';
import { useSettings } from '@/lib/SettingsContext';

export default function WarehouseOptionsPage() {
    const { lang } = useTranslation();
    const t = useMemo(() => (key: string) => translate(key, lang as any), [lang]);
    const { refreshSettings } = useSettings();

    const [settings, setSettings] = useState<Record<string, string>>({});
    const [original, setOriginal] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    // ── وحدات التعبئة ──────────────────────────────────────────
    const [units, setUnits] = useState<{ id: number; name: string }[]>([]);
    const [newUnitName, setNewUnitName] = useState('');
    const [savingUnit, setSavingUnit] = useState(false);

    const fetchUnits = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/units', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setUnits(await res.json());
    };

    const handleAddUnit = async () => {
        if (!newUnitName.trim()) return;
        setSavingUnit(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/units', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newUnitName.trim() }),
            });
            if (res.ok) { setNewUnitName(''); await fetchUnits(); showToast('✅ تمت إضافة الوحدة'); }
            else showToast('❌ فشل في الإضافة');
        } catch { showToast('❌ خطأ'); }
        finally { setSavingUnit(false); }
    };

    const handleDeleteUnit = async (id: number) => {
        if (!confirm('هل تريد حذف هذه الوحدة؟')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/units?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { await fetchUnits(); showToast('✅ تم الحذف'); }
        else showToast('❌ تعذر الحذف - ربما تستخدمها منتجات');
    };

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    const data: { id: number; key: string; value: string }[] = await res.json();
                    const map: Record<string, string> = {};
                    data.forEach(s => { map[s.key] = s.value; });
                    setSettings(map);
                    setOriginal(map);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
        fetchUnits();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const allKeys = new Set([...Object.keys(settings), ...Object.keys(original)]);
            const changedKeys = Array.from(allKeys).filter(k => (settings[k] || '') !== (original[k] || ''));
            if (changedKeys.length === 0) { showToast('لا توجد تغييرات'); setSaving(false); return; }
            const payload: Record<string, string> = {};
            changedKeys.forEach(k => { payload[k] = settings[k] || ''; });
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setOriginal({ ...settings });
                showToast(`✅ تم الحفظ`);
                refreshSettings();
            } else { showToast('❌ فشل في الحفظ'); }
        } catch { showToast('❌ خطأ في الاتصال'); }
        finally { setSaving(false); }
    };

    const set = (key: string, val: string) => setSettings(prev => ({ ...prev, [key]: val }));
    const changed = (key: string) => (settings[key] || '') !== (original[key] || '');
    const hasChanges = Object.keys(settings).some(k => changed(k));
    const inputStyle = (key: string) => ({
        ...(changed(key) ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary)' } : {}),
    });

    if (loading) return (
        <>
            <div className="page-header"><h1 className="page-title">{t('sys.str_4410')}</h1></div>
            <div className="page-content"><div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>{t('sys.str_4107')}</div></div>
        </>
    );

    const printBarcode = () => {
        const barcodeInput = (document.getElementById('barcode-label-input') as HTMLInputElement)?.value;
        const qty = parseInt((document.getElementById('barcode-label-qty') as HTMLInputElement)?.value || '1');
        const labelSize = settings['barcode_label_size'] || '50x30';
        if (!barcodeInput) { showToast(t('sys.str_4545')); return; }
        const sizes: Record<string, { w: string; h: string; fontSize: string; barcodeH: string }> = {
            '30x20': { w: '30mm', h: '20mm', fontSize: '7px', barcodeH: '12mm' },
            '40x30': { w: '40mm', h: '30mm', fontSize: '8px', barcodeH: '18mm' },
            '50x25': { w: '50mm', h: '25mm', fontSize: '9px', barcodeH: '16mm' },
            '50x30': { w: '50mm', h: '30mm', fontSize: '9px', barcodeH: '20mm' },
            '100x50': { w: '100mm', h: '50mm', fontSize: '12px', barcodeH: '32mm' },
        };
        const sz = sizes[labelSize] || sizes['50x30'];
        const barSvg = barcodeInput.split('').map((ch, i) => {
            const code = ch.charCodeAt(0);
            const widths = [(code >> 6) & 1, (code >> 5) & 1, (code >> 4) & 1, (code >> 3) & 1, (code >> 2) & 1, (code >> 1) & 1, code & 1, 0];
            return widths.map((w, j) => `<rect x="${(i * 8 + j) * 2}" y="0" width="${w ? 2 : 1}" height="100" fill="${j % 2 === 0 ? '#000' : '#fff'}"/>`).join('');
        }).join('');
        const totalBars = barcodeInput.length * 8 * 2;
        let labels = '';
        for (let i = 0; i < qty; i++) {
            labels += `<div class="label">
                <div class="company">${settings['company_name'] || ''}</div>
                <svg class="barcode" viewBox="0 0 ${totalBars} 100" preserveAspectRatio="none">${barSvg}<rect x="0" y="0" width="2" height="100" fill="#000"/><rect x="${totalBars - 2}" y="0" width="2" height="100" fill="#000"/></svg>
                <div class="code">${barcodeInput}</div>
            </div>`;
        }
        const pw = window.open('', '_blank', 'width=400,height=400');
        if (!pw) return;
        pw.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>باركود</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Cairo', sans-serif; display: flex; flex-wrap: wrap; justify-content: center; padding: 2mm; }
            .label { width: ${sz.w}; height: ${sz.h}; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1mm; overflow: hidden; page-break-inside: avoid; }
            .company { font-size: ${sz.fontSize}; font-weight: 600; text-align: center; line-height: 1.1; max-height: 3mm; overflow: hidden; }
            .barcode { width: 90%; height: ${sz.barcodeH}; margin: 1mm 0; }
            .code { font-size: ${sz.fontSize}; font-weight: 600; letter-spacing: 1px; text-align: center; }
            @media print { @page { margin: 0; size: ${sz.w} ${sz.h}; } body { padding: 0; } }
        </style></head><body>${labels}
        <script>window.onload=function(){setTimeout(function(){window.print();window.close();},400);};</script>
        </body></html>`);
        pw.document.close();
    };

    return (
        <>
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px',
                    padding: '12px 24px', zIndex: 9999, fontWeight: '600', fontSize: '14px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}>
                    {toast}
                </div>
            )}

            <div className="page-header">
                <h1 className="page-title">⚙️ {t('sys.str_4410')}</h1>
                <button
                    className={`btn ${hasChanges ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    style={{ minWidth: '140px', fontSize: '15px', fontWeight: '700',
                        ...(hasChanges ? { animation: 'pulse 2s infinite' } : {}) }}
                >
                    {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ التغييرات'}
                </button>
            </div>

            <div className="page-content animate-fade-in">

                {/* ── إعدادات الطابعة والباركود ─────────────────────── */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
                        🖨️ {t('sys.str_4410')}
                    </h3>
                    <div className="grid-2">
                        {/* نوع الطابعة */}
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4411')}</label>
                            <select className="input" value={settings['printer_type'] || '80mm'} onChange={e => set('printer_type', e.target.value)} style={inputStyle('printer_type')}>
                                <option value="58mm">{t('sys.str_4412')}</option>
                                <option value="76mm">{t('sys.str_4413')}</option>
                                <option value="80mm">{t('sys.str_4414')}</option>
                                <option value="A4">📄 A4 (210mm)</option>
                                <option value="A5">📄 A5 (148mm)</option>
                            </select>
                        </div>
                        {/* حجم ملصق الباركود */}
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4417')}</label>
                            <select className="input" value={settings['barcode_label_size'] || '50x30'} onChange={e => set('barcode_label_size', e.target.value)} style={inputStyle('barcode_label_size')}>
                                <option value="30x20">🏷️ 30×20mm</option>
                                <option value="40x30">🏷️ 40×30mm</option>
                                <option value="50x25">🏷️ 50×25mm</option>
                                <option value="50x30">🏷️ 50×30mm (مخصص)</option>
                                <option value="100x50">🏷️ 100×50mm</option>
                            </select>
                        </div>
                        {/* رأس الإيصال */}
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4415')}</label>
                            <input className="input" value={settings['receipt_header'] || ''} onChange={e => set('receipt_header', e.target.value)} style={inputStyle('receipt_header')} />
                        </div>
                        {/* ذيل الإيصال */}
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4416')}</label>
                            <input className="input" value={settings['receipt_footer'] || ''} onChange={e => set('receipt_footer', e.target.value)} style={inputStyle('receipt_footer')} />
                        </div>
                    </div>

                    {/* اختبار طباعة الباركود */}
                    <div style={{ marginTop: '20px', padding: '20px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>{t('sys.str_4139')}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{t('sys.str_4344')}</p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div style={{ flex: '1', minWidth: '200px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>{t('sys.str_4345')}</label>
                                <input className="input" id="barcode-label-input" placeholder={t('sys.str_4544')} dir="ltr" />
                            </div>
                            <div style={{ minWidth: '80px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>{t('sys.str_4093')}</label>
                                <input className="input" id="barcode-label-qty" type="number" defaultValue="1" min="1" max="100" style={{ width: '80px' }} dir="ltr" />
                            </div>
                            <button className="btn btn-primary" onClick={printBarcode} style={{ minWidth: '120px' }}>
                                {t('sys.str_4346')}
                            </button>
                        </div>
                    </div>
                </div>
                {/* ── وحدات التعبئة (درزن، كرتون، شده...) ──────────── */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>📦 وحدات التعبئة</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                        أضف أسماء وحدات التعبئة مثل الدرزن والكرتون والشِّده وغيرها. تُستخدم لتعريف وحدات المنتج المتعددة.
                    </p>

                    {/* إضافة وحدة جديدة */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input
                            className="input"
                            style={{ flex: 1 }}
                            placeholder="اسم الوحدة (مثال: درزن، كرتون، شده، بكت)"
                            value={newUnitName}
                            onChange={e => setNewUnitName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUnit(); } }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleAddUnit}
                            disabled={savingUnit || !newUnitName.trim()}
                            style={{ minWidth: '100px' }}
                        >
                            {savingUnit ? '⏳' : '➕ إضافة'}
                        </button>
                    </div>

                    {/* قائمة الوحدات الموجودة */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {units.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px' }}>لا توجد وحدات تعبئة. أضف أولى وحداتك أعلاه.</div>
                        ) : units.map(u => (
                            <div key={u.id} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'var(--bg-card-hover)', border: '1px solid var(--border)',
                                borderRadius: '20px', padding: '6px 14px', fontSize: '14px',
                            }}>
                                <span>📦 {u.name}</span>
                                <button
                                    onClick={() => handleDeleteUnit(u.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '14px', padding: '0 2px', lineHeight: 1 }}
                                    title="حذف"
                                >✕</button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </>
    );
}
