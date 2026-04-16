'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { translate } from '@/lib/translations';
import { useSettings } from '@/lib/SettingsContext';
import { useToast } from '@/components/Toast';

export default function CompanyInfoPage() {
    const { lang } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const t = useMemo(() => (key: string) => translate(key, lang as any), [lang]);
    const { refreshSettings } = useSettings();

    const [settings, setSettings] = useState<Record<string, string>>({});
    const [original, setOriginal] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

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
                    if (map['company_logo']) setLogoPreview(map['company_logo']);
                }
            } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
            finally { setLoading(false); }
        };
        fetchData();
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
                showToast(`✅ تم حفظ ${changedKeys.length} إعداد بنجاح`);
                refreshSettings();
            } else { showToast('❌ فشل في الحفظ'); }
        } catch { showToast('❌ خطأ في الاتصال'); }
        finally { setSaving(false); }
    };

    const handleToggle = async (key: string) => {
        const newVal = settings[key] === '1' ? '0' : '1';
        setSettings(prev => ({ ...prev, [key]: newVal }));
        const token = localStorage.getItem('token');
        try {
            await fetch(`/api/settings/${key}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ value: newVal }),
            });
            refreshSettings();
        } catch { console.error('toggle failed'); }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingLogo(true);
        const formData = new FormData();
        formData.append('logo', file);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/settings/upload-logo', {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setLogoPreview(data.logo);
                showToast('✅ تم رفع الشعار');
            } else { showToast('❌ فشل رفع الشعار'); }
        } catch { showToast('❌ خطأ في الرفع'); }
        finally { setUploadingLogo(false); e.target.value = ''; }
    };

    const handleLogoDelete = async () => {
        const token = localStorage.getItem('token');
        await fetch('/api/settings/company_logo', {
            method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ value: '' }),
        });
        setLogoPreview(null);
        showToast('✅ تم حذف الشعار');
    };

    const set = (key: string, val: string) => setSettings(prev => ({ ...prev, [key]: val }));
    const changed = (key: string) => (settings[key] || '') !== (original[key] || '');
    const hasChanges = Object.keys(settings).some(k => changed(k));

    if (loading) return (
        <>
            <div className="page-header"><h1 className="page-title">معلومات المنشأة</h1></div>
            <div className="page-content"><div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>جارٍ التحميل...</div></div>
        </>
    );

    const inputStyle = (key: string) => ({
        ...(changed(key) ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary)' } : {}),
    });

    return (
        <>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px',
                    padding: '12px 24px', zIndex: 9999, fontWeight: '600', fontSize: '14px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)', animation: 'fadeIn 0.2s ease',
                }}>
                    {toast}
                </div>
            )}

            <div className="page-header">
                <h1 className="page-title">🏢 معلومات المنشأة</h1>
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

                {/* ── 1. معلومات المنشأة ───────────────────────────────── */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
                        {t('sys.str_4390')}
                    </h3>

                    {/* شعار الشركة */}
                    <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                        <label className="input-label" style={{ marginBottom: '12px', display: 'block' }}>📸 {t('sys.str_4339')}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            {logoPreview ? (
                                <img src={logoPreview} alt="شعار الشركة" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px', background: '#fff', padding: '4px', border: '1px solid var(--border)' }} />
                            ) : (
                                <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '1px solid var(--border)' }}>🏢</div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    📤 {uploadingLogo ? 'جارٍ الرفع...' : t('sys.str_4540')}
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploadingLogo} />
                                </label>
                                {logoPreview && (
                                    <button className="btn btn-ghost btn-sm" onClick={handleLogoDelete} style={{ color: 'var(--danger)', fontSize: '12px' }}>🗑️ {t('sys.str_4340')}</button>
                                )}
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('sys.str_4341')}</span>
                            </div>
                        </div>
                    </div>

                    {/* بيانات المنشأة */}
                    <div className="grid-2">
                        {[
                            { key: 'company_name', label: t('sys.str_4391') },
                            { key: 'company_name_en', label: t('sys.str_4392') },
                            { key: 'company_phone', label: t('sys.str_4393') },
                            { key: 'company_address', label: t('sys.str_4394') },
                            { key: 'tax_number', label: t('sys.str_4395') },
                            { key: 'currency', label: t('sys.str_4396') },
                        ].map(({ key, label }) => (
                            <div key={key} className="input-group">
                                <label className="input-label">{label}</label>
                                <input className="input" value={settings[key] || ''} onChange={e => set(key, e.target.value)} style={inputStyle(key)} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── 2. إعدادات الضرائب والزكاة ─────────────────────── */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
                        {t('sys.str_4397')}
                    </h3>
                    <div className="grid-2">
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4398')}</label>
                            <input className="input" type="number" value={settings['tax_rate'] || ''} onChange={e => set('tax_rate', e.target.value)} dir="ltr" style={inputStyle('tax_rate')} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4399')}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '6px' }}>
                                <button
                                    className={`btn btn-sm ${settings['zatca_enabled'] === '1' ? 'btn-success' : 'btn-ghost'}`}
                                    onClick={() => handleToggle('zatca_enabled')}
                                >
                                    {settings['zatca_enabled'] === '1' ? '✅ مفعّل' : '⭕ معطّل'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 3. بيانات منصة فاتورة المتقدمة (ZATCA) ──────────── */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
                        {t('sys.str_4400')} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>(ZATCA Branch Data)</span>
                    </h3>
                    <div className="grid-2">
                        {[
                            { key: 'zatca_crn', label: t('sys.str_4401') },
                            { key: 'zatca_industry', label: t('sys.str_4402') },
                            { key: 'branch_name_en', label: t('sys.str_4403') },
                            { key: 'zatca_street', label: t('sys.str_4404') },
                            { key: 'zatca_building', label: t('sys.str_4405') },
                            { key: 'zatca_district', label: t('sys.str_4406') },
                            { key: 'zatca_city', label: t('sys.str_4407') },
                            { key: 'zatca_city_en', label: t('sys.str_4408') },
                            { key: 'zatca_postal_code', label: t('sys.str_4409') },
                        ].map(({ key, label }) => (
                            <div key={key} className="input-group">
                                <label className="input-label">{label}</label>
                                <input className="input" value={settings[key] || ''} onChange={e => set(key, e.target.value)} style={inputStyle(key)} />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </>
    );
}