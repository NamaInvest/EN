'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface License {
  id: number;
  license_key: string;
  hardware_id: string | null;
  company_name_ar: string;
  company_name_en: string;
  company_name: string;
  business_domain: string;
  mobile: string;
  vat_number: string;
  crn_number: string;
  city: string;
  city_en: string;
  district: string;
  street_name: string;
  building_no: string;
  postal_code: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  app_version: string;
  max_devices: number;
  activated_devices: number;
  trial_ends_at: string | null;
  expires_at: string | null;
  activated_at: string | null;
  last_verified_at: string | null;
  notes: string;
  created_at: string;
}

export default function DesktopLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState('');

  // Create form
  const [companyNameAr, setCompanyNameAr] = useState('');
  const [companyNameEn, setCompanyNameEn] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [crnNumber, setCrnNumber] = useState('');
  const [city, setCity] = useState('');
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
          company_name_ar: companyNameAr,
          company_name_en: companyNameEn,
          contact_email: contactEmail,
          mobile,
          vat_number: vatNumber,
          crn_number: crnNumber,
          city,
          notes,
          max_devices: parseInt(maxDevices) || 1,
          expires_at: expiresAt || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewKey(data.license_key);
        setShowCreate(false);
        setCompanyNameAr(''); setCompanyNameEn(''); setContactEmail('');
        setMobile(''); setVatNumber(''); setCrnNumber(''); setCity(''); setNotes('');
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

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    trial:     { label: '🕐 تجريبي', bg: '#dbeafe', color: '#1d4ed8' },
    active:    { label: '✅ نشط',   bg: '#dcfce7', color: '#15803d' },
    suspended: { label: '⏸️ معلّق', bg: '#fef9c3', color: '#a16207' },
    revoked:   { label: '❌ ملغي',  bg: '#fee2e2', color: '#b91c1c' },
    trial_expired: { label: '⏰ منتهي', bg: '#fce4ec', color: '#c62828' },
  };

  function getDaysRemaining(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div style={{ direction: 'rtl', minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)',
        padding: '32px 40px', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Link href="/ice" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '13px' }}>
              ← العودة للوحة ICE
            </Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '8px 0 4px' }}>🔑 تراخيص سطح المكتب</h1>
            <p style={{ opacity: 0.7, fontSize: '14px' }}>إدارة تراخيص وبيانات عملاء تطبيق Nama Invest Desktop</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', padding: '10px 24px', borderRadius: '10px',
              cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              backdropFilter: 'blur(10px)',
            }}
          >
            ➕ إنشاء رخصة يدوية
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'إجمالي', value: licenses.length, color: '#818cf8' },
            { label: 'تجريبي', value: licenses.filter(l => l.status === 'trial').length, color: '#60a5fa' },
            { label: 'نشطة', value: licenses.filter(l => l.status === 'active').length, color: '#34d399' },
            { label: 'معلّقة', value: licenses.filter(l => l.status === 'suspended').length, color: '#fbbf24' },
            { label: 'ملغية', value: licenses.filter(l => l.status === 'revoked').length, color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
              borderRadius: '12px', padding: '16px 24px', minWidth: '100px',
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
            <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 800, color: '#047857', letterSpacing: '3px', marginTop: '4px', direction: 'ltr' }}>
              {newKey}
            </div>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(newKey); }}
            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            📋 نسخ
          </button>
        </div>
      )}

      {/* Licenses List */}
      <div style={{ padding: '20px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>⏳ جاري التحميل...</div>
        ) : licenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔑</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>لا توجد تراخيص مسجلة بعد</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>ستظهر هنا عندما يسجّل عميل من تطبيق سطح المكتب</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {licenses.map(lic => {
              const expanded = expandedId === lic.id;
              const trialDays = getDaysRemaining(lic.trial_ends_at);
              const sc = statusConfig[lic.status] || statusConfig.trial;

              return (
                <div key={lic.id} style={{
                  background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
                  overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}>
                  {/* Main row */}
                  <div
                    style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', cursor: 'pointer' }}
                    onClick={() => setExpandedId(expanded ? null : lic.id)}
                  >
                    {/* License Key */}
                    <div style={{ minWidth: '180px' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: '#1e293b', letterSpacing: '1.5px', direction: 'ltr' }}>
                        {lic.license_key}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {new Date(lic.created_at).toLocaleDateString('ar-SA')}
                      </div>
                    </div>

                    {/* Company Name */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
                        {lic.company_name_ar || lic.company_name || '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {lic.business_domain || ''} {lic.city ? `• ${lic.city}` : ''}
                      </div>
                    </div>

                    {/* VAT */}
                    <div style={{ minWidth: '140px' }}>
                      {lic.vat_number ? (
                        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#475569', direction: 'ltr' }}>
                          🏛️ {lic.vat_number}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#cbd5e1' }}>بدون رقم ضريبي</div>
                      )}
                    </div>

                    {/* Status */}
                    <span style={{
                      padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                      background: sc.bg, color: sc.color,
                    }}>
                      {sc.label}
                    </span>

                    {/* Trial countdown */}
                    {lic.status === 'trial' && trialDays !== null && (
                      <div style={{
                        fontSize: '12px', fontWeight: 700,
                        color: trialDays <= 2 ? '#dc2626' : trialDays <= 5 ? '#d97706' : '#059669',
                      }}>
                        {trialDays > 0 ? `${trialDays} يوم متبقي` : 'منتهي'}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                      {(lic.status === 'active' || lic.status === 'trial') && (
                        <>
                          <button onClick={() => updateStatus(lic.id, 'suspend')} title="تعليق"
                            style={{ background: '#fef3c7', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                            ⏸️
                          </button>
                          <button onClick={() => updateStatus(lic.id, 'revoke')} title="إلغاء"
                            style={{ background: '#fee2e2', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                            ❌
                          </button>
                        </>
                      )}
                      {(lic.status === 'suspended' || lic.status === 'revoked') && (
                        <button onClick={() => updateStatus(lic.id, 'reactivate')} title="إعادة تفعيل"
                          style={{ background: '#d1fae5', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                          ✅ تفعيل
                        </button>
                      )}
                    </div>

                    <span style={{ fontSize: '16px', color: '#94a3b8', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <div style={{
                      padding: '0 24px 24px', borderTop: '1px solid #f1f5f9',
                    }}>
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '16px', paddingTop: '20px',
                      }}>
                        <DetailCard title="🏢 بيانات الشركة" items={[
                          { label: 'الاسم عربي', value: lic.company_name_ar || '—' },
                          { label: 'الاسم إنجليزي', value: lic.company_name_en || '—' },
                          { label: 'مجال العمل', value: lic.business_domain || '—' },
                          { label: 'الجوال', value: lic.mobile || lic.contact_phone || '—' },
                          { label: 'البريد', value: lic.contact_email || '—' },
                        ]} />
                        <DetailCard title="📍 الموقع" items={[
                          { label: 'المدينة', value: lic.city || '—' },
                          { label: 'الحي', value: lic.district || '—' },
                          { label: 'الشارع', value: lic.street_name || '—' },
                          { label: 'رقم المبنى', value: lic.building_no || '—' },
                          { label: 'الرمز البريدي', value: lic.postal_code || '—' },
                        ]} />
                        <DetailCard title="📋 البيانات الضريبية" items={[
                          { label: 'الرقم الضريبي', value: lic.vat_number || '—', mono: true },
                          { label: 'السجل التجاري', value: lic.crn_number || '—', mono: true },
                        ]} />
                        <DetailCard title="🔧 معلومات تقنية" items={[
                          { label: 'معرّف الجهاز', value: lic.hardware_id || 'غير مفعّل', mono: true },
                          { label: 'إصدار التطبيق', value: lic.app_version || '—' },
                          { label: 'أجهزة مفعّلة', value: `${lic.activated_devices}/${lic.max_devices}` },
                          { label: 'آخر تحقق', value: lic.last_verified_at ? new Date(lic.last_verified_at).toLocaleString('ar-SA') : 'لم يتحقق' },
                          { label: 'تاريخ التفعيل', value: lic.activated_at ? new Date(lic.activated_at).toLocaleString('ar-SA') : '—' },
                          { label: 'انتهاء التجربة', value: lic.trial_ends_at ? new Date(lic.trial_ends_at).toLocaleDateString('ar-SA') : '—' },
                        ]} />
                      </div>
                      {lic.notes && (
                        <div style={{ marginTop: '12px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', fontSize: '13px', color: '#475569' }}>
                          📝 {lic.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
            maxWidth: '520px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: '#1e293b' }}>
              🔑 إنشاء رخصة يدوية
            </h2>

            {[
              { label: 'اسم الشركة بالعربية *', value: companyNameAr, set: setCompanyNameAr, placeholder: 'مؤسسة ABC' },
              { label: 'اسم الشركة بالإنجليزية', value: companyNameEn, set: setCompanyNameEn, placeholder: 'ABC Est.' },
              { label: 'رقم الجوال', value: mobile, set: setMobile, placeholder: '05XXXXXXXX' },
              { label: 'البريد الإلكتروني', value: contactEmail, set: setContactEmail, placeholder: 'email@company.com' },
              { label: 'الرقم الضريبي (15 رقم)', value: vatNumber, set: setVatNumber, placeholder: '3XXXXXXXXXXXXX3' },
              { label: 'السجل التجاري (10 أرقام)', value: crnNumber, set: setCrnNumber, placeholder: '7XXXXXXXXX' },
              { label: 'المدينة', value: city, set: setCity, placeholder: 'الرياض' },
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
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>عدد الأجهزة</label>
                <input type="number" min="1" value={maxDevices} onChange={e => setMaxDevices(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>تاريخ الانتهاء</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>ملاحظات</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                rows={2} placeholder="ملاحظات اختيارية..."
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={createLicense} disabled={creating || !companyNameAr.trim()}
                style={{
                  flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600,
                  color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer',
                  background: creating ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                }}>
                {creating ? '⏳ جاري الإنشاء...' : '🔑 إنشاء المفتاح'}
              </button>
              <button onClick={() => setShowCreate(false)}
                style={{ padding: '12px 20px', fontSize: '14px', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', background: '#fff' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Detail card component
function DetailCard({ title, items }: { title: string; items: { label: string; value: string; mono?: boolean }[] }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>{title}</h4>
      {items.map(item => (
        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.label}</span>
          <span style={{
            fontSize: '12px', fontWeight: 600, color: '#1e293b',
            ...(item.mono ? { fontFamily: 'monospace', direction: 'ltr' as const } : {}),
          }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
