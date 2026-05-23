'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SSO Settings — `/settings/sso`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  إدارة موفّر تسجيل الدخول الموحّد (Single Sign-On).
 *  أنواع مدعومة: SAML 2.0 · OIDC · Microsoft Entra ID · Google Workspace · Okta
 *
 *  Endpoints:
 *   GET  /api/auth/sso?tenantId=X    → جلب الموفّر النشط
 *   POST /api/auth/sso { type: 'register', tenantId, ssoType, name, config }
 *   POST /api/auth/sso { type: 'toggle', id, isActive }
 *
 *  Security:
 *   - admin / owner فقط (SSO يؤثر على كل المستخدمين)
 *   - clientSecret لا يُعرض في الـ UI بعد الحفظ
 *
 *  @see src/app/api/auth/sso/route.ts
 *  @see src/lib/sso-engine.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import {
  KeyRound, Plus, RefreshCw, CheckCircle2, XCircle, Eye, EyeOff,
  ExternalLink, Shield, AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type SsoType = 'SAML' | 'OIDC' | 'AZURE_AD' | 'GOOGLE' | 'OKTA';

interface SsoProvider {
  id: number;
  tenantId: string;
  type: string;
  name: string;
  metadataUrl?: string | null;
  clientId?: string | null;
  attributeMapping?: any;
  isActive: boolean;
}

interface RegisterForm {
  ssoType: SsoType;
  name: string;
  clientId: string;
  clientSecret: string;
  metadataUrl: string;
  authUrl: string;
  tokenUrl: string;
  emailAttr: string;
  firstNameAttr: string;
  lastNameAttr: string;
}

const SSO_TYPE_META: Record<SsoType, { ar: string; en: string; hint: string }> = {
  SAML:     { ar: 'SAML 2.0',           en: 'SAML 2.0',          hint: 'Enterprise XML-based standard' },
  OIDC:     { ar: 'OpenID Connect',     en: 'OpenID Connect',    hint: 'Modern OAuth 2.0 + JWT' },
  AZURE_AD: { ar: 'Microsoft Entra ID', en: 'Microsoft Entra ID', hint: 'Azure AD / Microsoft 365' },
  GOOGLE:   { ar: 'Google Workspace',   en: 'Google Workspace',  hint: 'Google OAuth + Workspace' },
  OKTA:     { ar: 'Okta',               en: 'Okta',              hint: 'Okta Identity Cloud' },
};

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function SsoSettingsPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [provider, setProvider] = useState<SsoProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [form, setForm] = useState<RegisterForm>({
    ssoType: 'OIDC',
    name: '',
    clientId: '',
    clientSecret: '',
    metadataUrl: '',
    authUrl: '',
    tokenUrl: '',
    emailAttr: 'email',
    firstNameAttr: 'given_name',
    lastNameAttr: 'family_name',
  });

  const fetchProvider = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/auth/sso', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) { setLoadError(_t('انتهت الجلسة', 'Session expired')); return; }
      if (res.status === 403) { setLoadError(_t('SSO مقصور على admin/owner', 'SSO restricted to admin/owner')); return; }
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { provider: SsoProvider | null };
      setProvider(data.provider);
    } catch (err: unknown) {
      setLoadError(_t(`فشل التحميل: ${err instanceof Error ? err.message : 'unknown'}`, 'Load failed'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { void fetchProvider(); }, [fetchProvider]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.clientId.trim()) {
      toastError(_t('الاسم و Client ID مطلوبان', 'Name + Client ID required'));
      return;
    }

    setSubmitting(true);
    try {
      const config = {
        clientId: form.clientId.trim(),
        clientSecret: form.clientSecret.trim() || undefined,
        metadataUrl: form.metadataUrl.trim() || undefined,
        authUrl: form.authUrl.trim() || undefined,
        tokenUrl: form.tokenUrl.trim() || undefined,
        attributeMapping: {
          email: form.emailAttr,
          firstName: form.firstNameAttr,
          lastName: form.lastNameAttr,
        },
      };

      const res = await fetch('/api/auth/sso', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'register',
          tenantId: 'default',
          ssoType: form.ssoType,
          name: form.name.trim(),
          config,
        }),
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      toastSuccess(_t('تم تسجيل الموفّر', 'Provider registered'));
      setShowForm(false);
      setForm({ ...form, clientSecret: '' }); // امسح secret بعد الحفظ
      await fetchProvider();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async () => {
    if (!provider) return;
    if (!confirm(_t(
      provider.isActive
        ? 'سيتم إيقاف SSO. المستخدمون الحاليون قد لا يستطيعون الدخول. متابعة؟'
        : 'سيتم تفعيل SSO. متابعة؟',
      provider.isActive
        ? 'SSO will be disabled. Active users may not be able to login. Continue?'
        : 'SSO will be activated. Continue?',
    ))) return;

    try {
      const res = await fetch('/api/auth/sso', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'toggle', id: provider.id, isActive: !provider.isActive }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      toastSuccess(_t('تم تحديث الحالة', 'Status updated'));
      await fetchProvider();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    }
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <KeyRound size={28} color="#7C3AED" />
            {_t('تسجيل الدخول الموحّد (SSO)', 'Single Sign-On (SSO)')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'ربط النظام بـ Active Directory / Microsoft 365 / Google Workspace / Okta — تسجيل دخول موحّد للموظفين',
              'Connect with AD / Microsoft 365 / Google Workspace / Okta — unified employee sign-in',
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchProvider()}>
            <RefreshCw size={18} className={loading ? 'sso-spin' : ''} />
          </button>
          {!provider && (
            <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={18} /> {_t('إعداد موفّر SSO', 'Configure SSO Provider')}
            </button>
          )}
        </div>
      </div>

      {/* Loading / Error */}
      {loading && <Skeleton />}
      {!loading && loadError && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#DC2626', border: '1px dashed #FCA5A5', background: '#FEF2F2' }} role="alert">
          <XCircle size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontWeight: 600, marginBottom: '16px' }}>{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={() => void fetchProvider()}>
            <RefreshCw size={16} /> {_t('إعادة المحاولة', 'Retry')}
          </button>
        </div>
      )}

      {/* No provider — show invitation */}
      {!loading && !loadError && !provider && !showForm && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Shield size={48} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            {_t('لم يتم إعداد SSO بعد', 'No SSO configured yet')}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px', maxWidth: '500px', margin: '0 auto 20px' }}>
            {_t(
              'يمكنك ربط النظام بأي مزوّد هوية مؤسسي (Microsoft 365, Google Workspace, Okta, إلخ) ليدخل الموظفون بحسابات الشركة',
              'Connect to any enterprise identity provider (Microsoft 365, Google Workspace, Okta, etc.) so employees can sign in with company accounts',
            )}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} style={{ marginInlineEnd: '6px' }} />
            {_t('ابدأ الإعداد', 'Start Setup')}
          </button>
        </div>
      )}

      {/* Provider configured */}
      {!loading && !loadError && provider && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{provider.name}</h3>
                {provider.isActive ? (
                  <span style={{ padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#DCFCE7', color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={11} /> {_t('نشط', 'Active')}
                  </span>
                ) : (
                  <span style={{ padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#FEE2E2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={11} /> {_t('متوقف', 'Inactive')}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {SSO_TYPE_META[provider.type as SsoType]?.hint || provider.type}
              </p>
            </div>
            <button
              type="button"
              className={provider.isActive ? 'btn btn-secondary' : 'btn btn-primary'}
              onClick={handleToggle}
            >
              {provider.isActive ? _t('إيقاف', 'Disable') : _t('تفعيل', 'Activate')}
            </button>
          </div>

          <div className="grid-2" style={{ gap: '12px' }}>
            <Field label={_t('النوع', 'Type')} value={SSO_TYPE_META[provider.type as SsoType] ? _t(SSO_TYPE_META[provider.type as SsoType].ar, SSO_TYPE_META[provider.type as SsoType].en) : provider.type} />
            <Field label="Client ID" value={provider.clientId || '—'} />
            {provider.metadataUrl && <Field label="Metadata URL" value={provider.metadataUrl} fullWidth />}
            {provider.attributeMapping && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {_t('ربط الحقول', 'Attribute Mapping')}
                </div>
                <pre style={{ fontSize: '11px', background: '#F9FAFB', padding: '8px', borderRadius: '4px', overflow: 'auto', direction: 'ltr', textAlign: 'left' }}>
                  {JSON.stringify(provider.attributeMapping, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {!provider.isActive && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '8px', fontSize: '12px', color: '#92400E' }}>
              <AlertTriangle size={14} style={{ display: 'inline', marginInlineEnd: '6px' }} />
              {_t('SSO معطّل حالياً — المستخدمون يدخلون بكلمات المرور التقليدية', 'SSO is currently disabled — users sign in with traditional passwords')}
            </div>
          )}
        </div>
      )}

      {/* Register Form Modal */}
      {showForm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2><KeyRound size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />{_t('إعداد موفّر SSO', 'Configure SSO Provider')}</h2>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} aria-label={_t('إغلاق', 'Close')}>✕</button>
            </div>
            <form onSubmit={handleRegister}>
              <div className="modal-body">
                <div className="grid-2" style={{ gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label" htmlFor="sso-type">{_t('النوع', 'Type')} *</label>
                    <select id="sso-type" className="input" value={form.ssoType} onChange={(e) => setForm({ ...form, ssoType: e.target.value as SsoType })}>
                      {(Object.keys(SSO_TYPE_META) as SsoType[]).map((t) => (
                        <option key={t} value={t}>{_t(SSO_TYPE_META[t].ar, SSO_TYPE_META[t].en)}</option>
                      ))}
                    </select>
                    <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{SSO_TYPE_META[form.ssoType].hint}</small>
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="sso-name">{_t('الاسم', 'Display Name')} *</label>
                    <input id="sso-name" className="input" required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.ssoType === 'AZURE_AD' ? 'Acme Microsoft 365' : 'Acme SSO'} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="sso-cid">{_t('عميل المعرف *', 'Client ID *')}</label>
                    <input id="sso-cid" className="input" required maxLength={200} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="sso-secret">{_t('عميل سري', 'Client Secret')}</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        id="sso-secret"
                        type={showSecret ? 'text' : 'password'}
                        className="input"
                        maxLength={500}
                        value={form.clientSecret}
                        onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
                        style={{ flex: 1, fontFamily: 'monospace' }}
                      />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSecret(!showSecret)} aria-label={showSecret ? _t('إخفاء', 'Hide') : _t('عرض', 'Show')}>
                        {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{_t('يُشفّر عند الحفظ — لن يُعرض مرة أخرى', 'Encrypted on save — will not be shown again')}</small>
                  </div>

                  {form.ssoType === 'SAML' && (
                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="input-label" htmlFor="sso-meta">Metadata URL</label>
                      <input id="sso-meta" type="url" className="input" value={form.metadataUrl} onChange={(e) => setForm({ ...form, metadataUrl: e.target.value })} placeholder="https://your-idp.com/saml/metadata.xml" />
                    </div>
                  )}

                  {(form.ssoType === 'OIDC' || form.ssoType === 'OKTA' || form.ssoType === 'GOOGLE') && (
                    <>
                      <div className="input-group">
                        <label className="input-label" htmlFor="sso-auth">{_t('تفويض الرابط', 'Authorization URL')}</label>
                        <input id="sso-auth" type="url" className="input" value={form.authUrl} onChange={(e) => setForm({ ...form, authUrl: e.target.value })} placeholder="https://provider.com/oauth/authorize" />
                      </div>
                      <div className="input-group">
                        <label className="input-label" htmlFor="sso-token">Token URL</label>
                        <input id="sso-token" type="url" className="input" value={form.tokenUrl} onChange={(e) => setForm({ ...form, tokenUrl: e.target.value })} placeholder="https://provider.com/oauth/token" />
                      </div>
                    </>
                  )}

                  <div style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                      {_t('ربط حقول المستخدم (Attribute Mapping)', 'User Attribute Mapping')}
                    </h4>
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="sso-email">{_t('البريد', 'Email Attribute')}</label>
                    <input id="sso-email" className="input" value={form.emailAttr} onChange={(e) => setForm({ ...form, emailAttr: e.target.value })} placeholder="email" />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="sso-fn">{_t('الاسم الأول', 'First Name Attribute')}</label>
                    <input id="sso-fn" className="input" value={form.firstNameAttr} onChange={(e) => setForm({ ...form, firstNameAttr: e.target.value })} placeholder="given_name" />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="sso-ln">{_t('الاسم الأخير', 'Last Name Attribute')}</label>
                    <input id="sso-ln" className="input" value={form.lastNameAttr} onChange={(e) => setForm({ ...form, lastNameAttr: e.target.value })} placeholder="family_name" />
                  </div>
                </div>

                <div style={{ marginTop: '16px', padding: '12px', background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: '8px', fontSize: '12px', color: '#1E40AF' }}>
                  <ExternalLink size={14} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                  {_t(
                    'احصل على Client ID + Secret من لوحة مزوّد الهوية. للـ Azure AD: App Registrations → New registration.',
                    'Get Client ID + Secret from your IdP admin console. For Azure AD: App Registrations → New registration.',
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '12px 20px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={submitting}>{_t('إلغاء', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? _t('جاري التسجيل...', 'Registering...') : _t('تسجيل', 'Register')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.sso-spin { animation: sso-spin 1s linear infinite; } @keyframes sso-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 500, wordBreak: 'break-all', fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="card" style={{ padding: '24px', height: '300px', background: 'linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} aria-busy="true">
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}
