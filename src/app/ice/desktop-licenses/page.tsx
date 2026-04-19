'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface License {
  id: number;
  license_key: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  max_devices: number;
  activated_devices: number;
  expires_at: string | null;
  created_at: string;
  activated_at: string | null;
  last_verified_at: string | null;
  hardware_id: string | null;
  notes: string;
}

export default function DesktopLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState('');

  // Create form
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [maxDevices, setMaxDevices] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');

  async function loadLicenses() {
    try {
      const res = await fetch('/api/ice/desktop-licenses');
      const data = await res.json();
      setLicenses(data.licenses || []);
    } catch (err) {
      console.error('Load licenses error:', err);
    }
    setLoading(false);
  }

  useEffect(() => { loadLicenses(); }, []);

  async function createLicense() {
    setCreating(true);
    try {
      const res = await fetch('/api/ice/desktop-licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          company_name: companyName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          notes,
          max_devices: parseInt(maxDevices) || 1,
          expires_at: expiresAt || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewKey(data.license_key);
        setShowCreate(false);
        setCompanyName(''); setContactEmail(''); setContactPhone(''); setNotes('');
        loadLicenses();
      }
    } catch (err) {
      console.error('Create error:', err);
    }
    setCreating(false);
  }

  async function updateStatus(id: number, action: string) {
    await fetch('/api/ice/desktop-licenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    });
    loadLicenses();
  }

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    suspended: 'bg-amber-100 text-amber-700 border-amber-200',
    revoked: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusLabels: Record<string, string> = {
    active: '✅ نشط',
    suspended: '⏸️ معلّق',
    revoked: '❌ ملغي',
  };

  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)',
        padding: '32px 40px',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Link href="/ice" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '13px' }}>
              ← العودة للوحة ICE
            </Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 4px' }}>🔑 تراخيص سطح المكتب</h1>
            <p style={{ opacity: 0.7, fontSize: '14px' }}>إنشاء وإدارة مفاتيح ترخيص تطبيق Nama Invest Desktop</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', padding: '10px 24px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                backdropFilter: 'blur(10px)',
              }}
            >
              ➕ إنشاء رخصة جديدة
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'إجمالي', value: licenses.length, color: '#818cf8' },
            { label: 'نشطة', value: licenses.filter(l => l.status === 'active').length, color: '#34d399' },
            { label: 'مفعّلة', value: licenses.filter(l => l.activated_at).length, color: '#60a5fa' },
            { label: 'ملغية', value: licenses.filter(l => l.status === 'revoked').length, color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
              borderRadius: '12px', padding: '16px 24px', minWidth: '120px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* New Key Alert */}
      {newKey && (
        <div style={{
          margin: '20px 40px', padding: '20px', borderRadius: '12px',
          background: '#ecfdf5', border: '2px solid #10b981',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#065f46', fontSize: '15px' }}>✅ تم إنشاء مفتاح جديد:</div>
            <div style={{
              fontFamily: 'monospace', fontSize: '24px', fontWeight: 800,
              color: '#047857', letterSpacing: '3px', marginTop: '4px', direction: 'ltr',
            }}>
              {newKey}
            </div>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(newKey); }}
            style={{
              background: '#10b981', color: '#fff', border: 'none',
              padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            📋 نسخ
          </button>
        </div>
      )}

      {/* Licenses Table */}
      <div style={{ padding: '20px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>⏳ جاري التحميل...</div>
        ) : licenses.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔑</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>لا توجد تراخيص بعد</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>أنشئ أول مفتاح ترخيص لتطبيق سطح المكتب</p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: '#fff', border: 'none', padding: '12px 28px',
                borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              }}
            >
              ➕ إنشاء رخصة
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {licenses.map(lic => (
              <div key={lic.id} style={{
                background: '#fff', borderRadius: '14px', padding: '20px 24px',
                border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center',
                gap: '20px', flexWrap: 'wrap',
              }}>
                {/* Key */}
                <div style={{ flex: '0 0 200px' }}>
                  <div style={{
                    fontFamily: 'monospace', fontSize: '16px', fontWeight: 700,
                    color: '#1e293b', letterSpacing: '2px', direction: 'ltr',
                  }}>
                    {lic.license_key}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    أنشئ: {new Date(lic.created_at).toLocaleDateString('ar-SA')}
                  </div>
                </div>

                {/* Company */}
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{lic.company_name || '—'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {lic.contact_email || lic.contact_phone || '—'}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                    ...(lic.status === 'active' ? { background: '#ecfdf5', color: '#047857' } :
                        lic.status === 'suspended' ? { background: '#fffbeb', color: '#b45309' } :
                        { background: '#fef2f2', color: '#b91c1c' }),
                  }}>
                    {statusLabels[lic.status] || lic.status}
                  </span>
                </div>

                {/* Devices */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#6366f1' }}>
                    {lic.activated_devices}/{lic.max_devices}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>أجهزة</div>
                </div>

                {/* Last verify */}
                <div style={{ textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '12px', color: lic.last_verified_at ? '#059669' : '#94a3b8' }}>
                    {lic.last_verified_at
                      ? new Date(lic.last_verified_at).toLocaleDateString('ar-SA')
                      : 'لم يتحقق'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>آخر تحقق</div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {lic.status === 'active' && (
                    <>
                      <button onClick={() => updateStatus(lic.id, 'suspend')} title="تعليق"
                        style={{ background: '#fef3c7', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        ⏸️
                      </button>
                      <button onClick={() => updateStatus(lic.id, 'revoke')} title="إلغاء"
                        style={{ background: '#fee2e2', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        ❌
                      </button>
                    </>
                  )}
                  {(lic.status === 'suspended' || lic.status === 'revoked') && (
                    <button onClick={() => updateStatus(lic.id, 'reactivate')} title="إعادة تفعيل"
                      style={{ background: '#d1fae5', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      ✅
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, direction: 'rtl',
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '32px',
            maxWidth: '480px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: '#1e293b' }}>
              🔑 إنشاء رخصة جديدة
            </h2>

            {[
              { label: 'اسم الشركة', value: companyName, set: setCompanyName, placeholder: 'مؤسسة ABC' },
              { label: 'البريد الإلكتروني', value: contactEmail, set: setContactEmail, placeholder: 'email@company.com' },
              { label: 'رقم الجوال', value: contactPhone, set: setContactPhone, placeholder: '+966...' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  {f.label}
                </label>
                <input
                  value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '14px', outline: 'none',
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  عدد الأجهزة
                </label>
                <input
                  type="number" min="1" value={maxDevices} onChange={e => setMaxDevices(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  تاريخ الانتهاء
                </label>
                <input
                  type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>ملاحظات</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                rows={2} placeholder="ملاحظات اختيارية..."
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={createLicense} disabled={creating || !companyName.trim()}
                style={{
                  flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600,
                  color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer',
                  background: creating ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                }}
              >
                {creating ? '⏳ جاري الإنشاء...' : '🔑 إنشاء المفتاح'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '12px 20px', fontSize: '14px', color: '#64748b',
                  border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', background: '#fff',
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
