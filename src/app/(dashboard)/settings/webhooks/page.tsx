'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Webhooks Manager — `/settings/webhooks`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  إدارة Webhook subscriptions:
 *   - إنشاء webhooks جديدة مع events selection
 *   - تفعيل/تعطيل subscriptions
 *   - تدوير الـ secret (rotate-secret)
 *   - حذف
 *   - مراقبة failCount + lastDeliveredAt
 *
 *  HMAC signing: كل webhook له secret يُستخدم لتوقيع payload (X-Signature header).
 *
 *  Endpoints:
 *   GET    /api/webhooks                    → list
 *   POST   /api/webhooks                    → create (يرجع secret مرة واحدة)
 *   PATCH  /api/webhooks/[id]               → update
 *   DELETE /api/webhooks/[id]               → delete
 *   POST   /api/webhooks/[id]/rotate-secret → rotate
 *
 *  Permission: admin / owner / integration_manager
 *
 *  @see src/app/api/webhooks/route.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Webhook as WebhookIcon, Plus, RefreshCw, Trash2, RotateCw, CheckCircle2,
  XCircle, Copy, AlertTriangle, Activity, Clock, ExternalLink,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebhookSub {
  id: number;
  url: string;
  events: string;              // JSON string array
  description: string;
  isActive: boolean;
  failCount: number;
  lastDeliveredAt: string | null;
  createdAt: string;
}

interface ListResponse {
  items: WebhookSub[];
  total: number;
  knownEvents: readonly string[];
}

interface CreatedWebhook extends WebhookSub {
  secret: string;
  _warning: string;
}

interface CreateForm {
  url: string;
  description: string;
  events: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function WebhooksPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [items, setItems] = useState<WebhookSub[]>([]);
  const [knownEvents, setKnownEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateForm>({ url: '', description: '', events: [] });

  // Secret display after create
  const [createdSecret, setCreatedSecret] = useState<CreatedWebhook | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchList = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/webhooks', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) { setLoadError(_t('انتهت الجلسة', 'Session expired')); return; }
      if (res.status === 403) { setLoadError(_t('Webhooks مقصورة على admin/integration_manager', 'Webhooks restricted')); return; }
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ListResponse;
      setItems(data.items);
      setKnownEvents([...(data.knownEvents || [])]);
    } catch (err: unknown) {
      setLoadError(_t(`فشل التحميل: ${err instanceof Error ? err.message : 'unknown'}`, 'Load failed'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { void fetchList(); }, [fetchList]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url.trim()) { toastError(_t('URL مطلوب', 'URL required')); return; }
    if (form.events.length === 0) { toastError(_t('حدث واحد على الأقل', 'At least 1 event')); return; }

    setCreating(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: form.url.trim(),
          events: form.events,
          description: form.description.trim(),
        }),
      });
      if (res.status === 403) { toastError(_t('غير مصرح', 'Forbidden')); return; }
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as CreatedWebhook;
      setCreatedSecret(data);
      setShowCreate(false);
      setForm({ url: '', description: '', events: [] });
      await fetchList();
      toastSuccess(_t('تم الإنشاء — احفظ الـ secret الآن!', 'Created — save the secret now!'));
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (sub: WebhookSub) => {
    try {
      const res = await fetch(`/api/webhooks/${sub.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !sub.isActive }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      toastSuccess(_t('تم التحديث', 'Updated'));
      await fetchList();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    }
  };

  const handleDelete = async (sub: WebhookSub) => {
    if (!confirm(_t(
      `هل أنت متأكد من حذف webhook لـ ${sub.url}؟`,
      `Delete webhook for ${sub.url}?`,
    ))) return;

    try {
      const res = await fetch(`/api/webhooks/${sub.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      toastSuccess(_t('تم الحذف', 'Deleted'));
      await fetchList();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    }
  };

  const handleRotateSecret = async (sub: WebhookSub) => {
    if (!confirm(_t(
      'سيتم استبدال الـ secret الحالي. عليك تحديثه في جهتك المستقبلة. متابعة؟',
      'Current secret will be replaced. You must update it on receiving side. Continue?',
    ))) return;

    try {
      const res = await fetch(`/api/webhooks/${sub.id}/rotate-secret`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { secret: string };
      setCreatedSecret({ ...sub, secret: data.secret, _warning: 'Secret rotated — save now' });
      toastSuccess(_t('تم تدوير الـ secret', 'Secret rotated'));
      await fetchList();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'failed');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess(_t('تم النسخ', 'Copied'));
  };

  const toggleEvent = (event: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter((e) => e !== event) : [...f.events, event],
    }));
  };

  const parseEvents = (eventsStr: string): string[] => {
    try { return JSON.parse(eventsStr); } catch { return []; }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowCreate(false); setCreatedSecret(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <WebhookIcon size={28} color="#0F766E" />
            {_t('Webhooks — التكاملات الخارجية', 'Webhooks — External Integrations')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {_t(
              'أرسل أحداث النظام (فواتير، مدفوعات، إلخ) إلى أنظمتك الخارجية تلقائياً مع HMAC signing',
              'Send system events (invoices, payments, etc.) to your external systems automatically with HMAC signing',
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-ghost" onClick={() => void fetchList()}>
            <RefreshCw size={18} className={loading ? 'wh-spin' : ''} />
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> {_t('webhook جديد', 'New Webhook')}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && <Skeleton />}
      {!loading && loadError && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#DC2626', border: '1px dashed #FCA5A5', background: '#FEF2F2' }} role="alert">
          <XCircle size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontWeight: 600, marginBottom: '16px' }}>{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={() => void fetchList()}>
            <RefreshCw size={16} /> {_t('إعادة المحاولة', 'Retry')}
          </button>
        </div>
      )}
      {!loading && !loadError && items.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <WebhookIcon size={48} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{_t('لا توجد webhooks', 'No webhooks')}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px' }}>
            {_t('أنشئ webhook لربط النظام بأي خدمة خارجية', 'Create a webhook to connect to any external service')}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> {_t('webhook جديد', 'New Webhook')}
          </button>
        </div>
      )}

      {!loading && !loadError && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((sub) => {
            const events = parseEvents(sub.events);
            return (
              <div key={sub.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {sub.isActive ? (
                        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: '#DCFCE7', color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={11} /> {_t('نشط', 'Active')}
                        </span>
                      ) : (
                        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: '#FEE2E2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={11} /> {_t('متوقف', 'Inactive')}
                        </span>
                      )}
                      {sub.failCount > 0 && (
                        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: '#FEF3C7', color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={11} /> {sub.failCount} {_t('فشل', 'fails')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 500, marginBottom: '4px', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ExternalLink size={12} color="var(--text-muted)" />
                      {sub.url}
                    </div>
                    {sub.description && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{sub.description}</p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {events.map((ev) => (
                        <span key={ev} style={{ padding: '2px 8px', background: '#E0E7FF', color: '#3730A3', borderRadius: '10px', fontSize: '10px', fontFamily: 'monospace' }}>
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleRotateSecret(sub)} title={_t('تدوير secret', 'Rotate secret')} aria-label={_t('تدوير secret', 'Rotate secret')}>
                      <RotateCw size={14} />
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleToggle(sub)} title={sub.isActive ? _t('إيقاف', 'Disable') : _t('تفعيل', 'Activate')} aria-label={sub.isActive ? _t('إيقاف', 'Disable') : _t('تفعيل', 'Activate')}>
                      {sub.isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(sub)} title={_t('حذف', 'Delete')} style={{ color: '#DC2626' }} aria-label={_t('حذف', 'Delete')}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={12} />
                    {sub.lastDeliveredAt ? (
                      <span>{_t('آخر تسليم:', 'Last delivery:')} {new Date(sub.lastDeliveredAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                    ) : (
                      <span>{_t('لم يُرسل بعد', 'Never delivered')}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {_t('أُنشئ:', 'Created:')} {new Date(sub.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2><Plus size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />{_t('webhook جديد', 'New Webhook')}</h2>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} aria-label={_t('إغلاق', 'Close')}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label" htmlFor="wh-url">URL *</label>
                  <input
                    id="wh-url"
                    type="url"
                    className="input"
                    required
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://your-service.com/webhook"
                    style={{ fontFamily: 'monospace' }}
                  />
                  <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {_t('يجب أن يكون HTTPS في الإنتاج', 'Must be HTTPS in production')}
                  </small>
                </div>

                <div className="input-group" style={{ marginTop: '12px' }}>
                  <label className="input-label" htmlFor="wh-desc">{_t('الوصف', 'Description')}</label>
                  <input
                    id="wh-desc"
                    className="input"
                    maxLength={500}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={_t('Slack ربط فواتير', 'Slack invoices integration')}
                  />
                </div>

                <div className="input-group" style={{ marginTop: '12px' }}>
                  <label className="input-label">{_t('الأحداث', 'Events')} * ({form.events.length} {_t('مختار', 'selected')})</label>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }}>
                    {knownEvents.map((event) => {
                      const checked = form.events.includes(event);
                      return (
                        <label
                          key={event}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: checked ? '#E0E7FF' : 'transparent',
                          }}
                        >
                          <input type="checkbox" checked={checked} onChange={() => toggleEvent(event)} />
                          <code style={{ fontSize: '12px', fontFamily: 'monospace' }}>{event}</code>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginTop: '16px', padding: '12px', background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: '8px', fontSize: '12px', color: '#1E40AF' }}>
                  <strong>{_t('HMAC signing:', 'HMAC signing:')}</strong>
                  {' '}
                  {_t(
                    'سيتم توقيع كل request بالـ secret في header X-Signature. تحقق منه عند الاستقبال.',
                    'Each request will be signed with the secret in X-Signature header. Verify it on receiving side.',
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '12px 20px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)} disabled={creating}>{_t('إلغاء', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? _t('جاري الإنشاء...', 'Creating...') : _t('إنشاء', 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Secret Modal — يُعرض مرة واحدة بعد إنشاء/تدوير */}
      {createdSecret && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header" style={{ background: '#FEF3C7', borderBottom: '2px solid #F59E0B' }}>
              <h2 style={{ color: '#92400E' }}>
                <AlertTriangle size={20} style={{ display: 'inline', marginInlineEnd: '6px' }} />
                {_t('احفظ الـ Secret الآن!', 'Save the Secret Now!')}
              </h2>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', marginBottom: '12px', color: '#7F1D1D', fontWeight: 600 }}>
                {_t(
                  '⚠️ هذا الـ secret لن يظهر مرة أخرى. احفظه في مكان آمن واستخدمه للتحقق من X-Signature على جهتك المستقبلة.',
                  '⚠️ This secret will not be shown again. Save it securely and use it to verify X-Signature on receiving side.',
                )}
              </p>
              <div style={{ background: '#1E293B', padding: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ flex: 1, color: '#F1F5F9', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                  {createdSecret.secret}
                </code>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleCopy(createdSecret.secret)} style={{ color: '#F1F5F9' }} aria-label={_t('نسخ', 'Copy')}>
                  <Copy size={14} />
                </button>
              </div>
              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <strong>{_t('استخدام في Node.js:', 'Verify in Node.js:')}</strong>
                <pre style={{ background: '#F9FAFB', padding: '8px', borderRadius: '4px', marginTop: '4px', overflow: 'auto', direction: 'ltr', textAlign: 'left' }}>
{`const crypto = require('crypto');
const expected = crypto
  .createHmac('sha256', SECRET)
  .update(req.body)
  .digest('hex');
if (expected !== req.headers['x-signature']) {
  res.status(401).end();
}`}
                </pre>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px' }}>
              <button type="button" className="btn btn-primary" onClick={() => setCreatedSecret(null)}>
                {_t('فهمت — احفظت الـ secret', 'Got it — I saved the secret')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.wh-spin { animation: wh-spin 1s linear infinite; } @keyframes wh-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card" style={{ height: '120px', background: 'linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: '12px' }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}
