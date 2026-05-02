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
    
    // Fatoora States
    const [fatooraStep, setFatooraStep] = useState(0);
    const [fatooraLoading, setFatooraLoading] = useState(false);
    const [fatooraMessage, setFatooraMessage] = useState('');

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    useEffect(() => {
        const fetchData = async () => {
            let token = localStorage.getItem('token');

            // ── Auto-login fallback: إذا لا يوجد token أو منتهي الصلاحية ──────
            // هذا يحدث عندما يُحوَّل المستخدم الجديد لهذه الصفحة بدون المرور بـ auto-login
            const tryAutoLogin = async (): Promise<string | null> => {
                try {
                    // أولاً: حاول عبر /api/auth/login بحساب admin (الأكثر موثوقية)
                    const loginRes = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: 'admin',
                            password: 'admin',
                            deviceToken: 'auto-setup',
                            deviceName: 'Setup',
                        }),
                    });
                    if (loginRes.ok) {
                        const data = await loginRes.json();
                        if (data.token) {
                            localStorage.setItem('token', data.token);
                            if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                            return data.token;
                        }
                    }
                    // ثانياً: حاول عبر /api/auth/login بالـ username المشتق من البريد
                    const savedEmail = localStorage.getItem('clerkEmail') || '';
                    if (savedEmail) {
                        const emailUser = savedEmail.split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase();
                        const emailRes = await fetch('/api/auth/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: emailUser, password: 'admin', deviceToken: 'auto-setup', deviceName: 'Setup' }),
                        });
                        if (emailRes.ok) {
                            const data = await emailRes.json();
                            if (data.token) {
                                localStorage.setItem('token', data.token);
                                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                                return data.token;
                            }
                        }
                    }
                } catch { /* ignore */ }
                return null;
            };

            // إذا لم يكن هناك token → حاول تسجيل دخول تلقائي
            if (!token) {
                token = await tryAutoLogin();
            }

            try {
                let res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } });

                // إذا رجع 401 → ربما الـ token منتهي → حاول تسجيل دخول جديد
                if (res.status === 401) {
                    token = await tryAutoLogin();
                    if (token) {
                        res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } });
                    }
                }

                if (res.ok) {
                    const data: { id: number; key: string; value: string }[] = await res.json();
                    const map: Record<string, string> = {};
                    data.forEach(s => { map[s.key] = s.value; });
                    setSettings(map);
                    setOriginal(map);
                    if (map['company_logo']) setLogoPreview(map['company_logo']);
                }

                // Check ZATCA connection status
                try {
                    const zatcaRes = await fetch('/api/zatca?type=status', { headers: { Authorization: `Bearer ${token}` } });
                    if (zatcaRes.ok) {
                        const zatcaStatus = await zatcaRes.json();
                        if (zatcaStatus.status === 'connected' || zatcaStatus.has_production_csid) {
                            setFatooraStep(3);
                        } else if (zatcaStatus.status === 'compliance_passed') {
                            setFatooraStep(2);
                        } else if (zatcaStatus.status === 'compliance_csid') {
                            setFatooraStep(1);
                        }
                    }
                } catch { }
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
                
                // Sync updated company details with central ICE server if running in desktop mode
                const desktopLicense = localStorage.getItem('nama-desktop-license');
                if (desktopLicense && (changedKeys.includes('company_name') || changedKeys.includes('tax_number') || changedKeys.includes('zatca_crn') || changedKeys.includes('company_name_en'))) {
                   try {
                       fetch('https://namainvist.com/api/ice/desktop-register', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({
                             licenseKey: desktopLicense,
                             companyNameAr: settings['company_name'] || '',
                             companyNameEn: settings['company_name_en'] || '',
                             vatNumber: settings['tax_number'] || '',
                             crnNumber: settings['zatca_crn'] || '',
                             city: settings['zatca_city'] || '',
                             businessDomain: settings['company_industry'] || '',
                           })
                       }).catch(console.error);
                   } catch { }
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                showToast(`❌ ${errData.error || 'فشل في الحفظ'}`);
                console.error('Save failed:', res.status, errData);
            }
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

    const handleFatooraAction = async (action: string) => {
        setFatooraLoading(true);
        setFatooraMessage('');
        try {
            const token = localStorage.getItem('token');
            const bodyData: any = { action };
            if (action === 'compliance-csid') {
                const otp = settings['zatca_otp'] || '';
                if (!otp) { showToast(t('sys.str_4534') || 'OTP مطلوب'); setFatooraLoading(false); return; }
                bodyData.otp = otp;
            }
            const res = await fetch('/api/zatca', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(bodyData),
            });
            const data = await res.json();
            if (data.success) {
                setFatooraMessage(data.message);
                showToast(data.message);
                if (action === 'compliance-csid') setFatooraStep(1);
                if (action === 'compliance-invoice') setFatooraStep(2);
                if (action === 'production-csid') setFatooraStep(3);
            } else {
                setFatooraMessage(`❌ ${data.error || data.message}`);
                showToast(`❌ ${data.error || data.message}`);
            }
        } catch (err) { setFatooraMessage('❌ خطأ في الاتصال'); }
        finally { setFatooraLoading(false); }
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
                        {/* نسبة الضريبة — مقفولة على 15% للسعودية */}
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4398')}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="input"
                                    type="number"
                                    value={settings['tax_rate'] ?? '15'}
                                    onChange={e => set('tax_rate', e.target.value)}
                                    dir="ltr"
                                    readOnly
                                    style={{
                                        ...inputStyle('tax_rate'),
                                        background: 'rgba(234,179,8,0.08)',
                                        color: 'var(--warning)',
                                        fontWeight: '700',
                                        cursor: 'not-allowed',
                                    }}
                                />
                                <span style={{
                                    position: 'absolute', left: '12px', top: '50%',
                                    transform: 'translateY(-50%)', fontSize: '11px',
                                    color: 'var(--text-muted)', pointerEvents: 'none'
                                }}>🇸🇦 ثابتة للسعودية</span>
                            </div>
                        </div>

                        {/* تفعيل ضريبة القيمة المضافة */}
                        <div className="input-group">
                            <label className="input-label">ضريبة القيمة المضافة (VAT)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '6px' }}>
                                <button
                                    className={`btn btn-sm ${settings['POS_TAX_ENABLED'] !== 'false' ? 'btn-success' : 'btn-ghost'}`}
                                    onClick={async () => {
                                        const newVal = settings['POS_TAX_ENABLED'] === 'false' ? 'true' : 'false';
                                        set('POS_TAX_ENABLED', newVal);
                                        const token = localStorage.getItem('token');
                                        await fetch('/api/settings/POS_TAX_ENABLED', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                            body: JSON.stringify({ value: newVal }),
                                        }).catch(() => {});
                                    }}
                                >
                                    {settings['POS_TAX_ENABLED'] !== 'false' ? '✅ مفعّلة (15%)' : '⭕ معطّلة'}
                                </button>
                            </div>
                        </div>

                        {/* شمول الضريبة في السعر */}
                        <div className="input-group">
                            <label className="input-label">الأسعار شاملة الضريبة</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '6px' }}>
                                <button
                                    className={`btn btn-sm ${settings['POS_TAX_INCLUSIVE'] !== 'false' ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={async () => {
                                        const newVal = settings['POS_TAX_INCLUSIVE'] === 'false' ? 'true' : 'false';
                                        set('POS_TAX_INCLUSIVE', newVal);
                                        const token = localStorage.getItem('token');
                                        await fetch('/api/settings/POS_TAX_INCLUSIVE', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                            body: JSON.stringify({ value: newVal }),
                                        }).catch(() => {});
                                    }}
                                >
                                    {settings['POS_TAX_INCLUSIVE'] !== 'false' ? '✅ نعم (شامل)' : '⭕ لا (غير شامل)'}
                                </button>
                            </div>
                        </div>

                        {/* تفعيل منصة فاتورة */}
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

                {/* ── المعالج (ZATCA Wizard) ──────────── */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '10px', marginBottom: '16px', background: fatooraStep >= 3 ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))' : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: `2px solid ${fatooraStep >= 3 ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', background: fatooraStep >= 3 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', boxShadow: fatooraStep >= 3 ? '0 0 20px rgba(34,197,94,0.4)' : '0 0 20px rgba(239,68,68,0.4)' }}>
                                {fatooraStep >= 3 ? '🟢' : '🔴'}
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '16px' }}>{fatooraStep >= 3 ? t('sys.str_4552') : t('sys.str_4553')}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fatooraStep >= 3 ? t('sys.str_4554') : t('sys.str_4555')}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { step: 1, label: t('sys.str_4556'), action: 'compliance-csid' },
                            { step: 2, label: t('sys.str_4557'), action: 'compliance-invoice' },
                            { step: 3, label: t('sys.str_4558'), action: 'production-csid' },
                        ].map(s => (
                            <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: fatooraStep >= s.step ? 'rgba(34,197,94,0.08)' : 'var(--bg-card)', border: `1px solid ${fatooraStep >= s.step ? 'var(--success-light)' : 'var(--border)'}` }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', background: fatooraStep >= s.step ? 'var(--success-light)' : 'var(--bg-card-hover)', color: fatooraStep >= s.step ? '#fff' : 'var(--text-muted)' }}>
                                    {fatooraStep >= s.step ? '✓' : s.step}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{s.label}</div>
                                </div>
                                <button   className={`btn btn-sm ${fatooraStep >= s.step ? 'btn-success' : 'btn-primary'}`} onClick={() => handleFatooraAction(s.action)} disabled={fatooraLoading || (s.step > 1 && fatooraStep < s.step - 1)} style={{ minWidth: '80px' }}>
                                    {fatooraLoading ? '⏳' : (fatooraStep >= s.step ? t('sys.str_4559') : t('sys.str_4560'))}
                                </button>
                            </div>
                        ))}
                    </div>
                    {fatooraMessage && (
                        <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: fatooraMessage.includes('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', fontSize: '13px', fontWeight: '600' }}>
                            {fatooraMessage}
                        </div>
                    )}
                </div>

                {/* ── 3. بيانات منصة فاتورة المتقدمة (ZATCA) ──────────── */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
                        {t('sys.str_4400')} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>(ZATCA Branch Data)</span>
                    </h3>
                    <div className="grid-2">
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4435')}</label>
                            <select className="input" value={settings['zatca_environment'] || 'simulation'} onChange={e => set('zatca_environment', e.target.value)} style={inputStyle('zatca_environment')}>
                                <option value="simulation">{t('sys.str_4342') || 'مرحلة المحاكاة (Simulation)'}</option>
                                <option value="production">{t('sys.str_4343') || 'مرحلة الإنتاج (Production)'}</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_4436')}</label>
                            <input
                                className="input"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="000000"
                                value={settings['zatca_otp'] || ''}
                                onChange={async (e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                                    set('zatca_otp', val);
                                    if (val.length === 6) {
                                        // Auto-save OTP immediately
                                        try {
                                            const token = localStorage.getItem('token');
                                            const res = await fetch('/api/settings', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                body: JSON.stringify({ zatca_otp: val }),
                                            });
                                            if (res.ok) {
                                                setOriginal(prev => ({ ...prev, zatca_otp: val }));
                                                showToast('✅ تم حفظ رمز OTP تلقائياً');
                                            } else {
                                                const errData = await res.json().catch(() => ({}));
                                                showToast(`❌ فشل حفظ OTP: ${errData.error || res.status}`);
                                            }
                                        } catch { showToast('❌ خطأ في الاتصال'); }
                                    }
                                }}
                                dir="ltr"
                                style={{
                                    ...inputStyle('zatca_otp'),
                                    letterSpacing: '8px',
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    fontFamily: 'monospace',
                                }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                أدخل 6 أرقام — سيتم الحفظ تلقائياً
                            </span>
                        </div>
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
