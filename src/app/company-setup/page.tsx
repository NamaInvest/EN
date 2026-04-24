'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const BUSINESS_DOMAINS = [
  'صيدلية', 'بقالة وسوبرماركت', 'مطعم ومقهى',
  'إلكترونيات وأجهزة', 'ملابس وأزياء', 'أثاث وديكور',
  'مخبز وحلويات', 'سيارات وقطع غيار', 'عطور ومستحضرات تجميل',
  'مجوهرات وساعات', 'عيادة طبية', 'عيادة أسنان', 'بصريات ونظارات',
  'عيادة بيطرية', 'عقارات', 'مقاولات وبناء',
  'تصنيع وإنتاج', 'جملة وتوزيع', 'استيراد وتصدير',
  'نقل ولوجستيات', 'طباعة وإعلان', 'خدمات تقنية',
  'نظافة وصيانة', 'مغسلة ملابس', 'خياطة',
  'تعليم وتدريب', 'نادي رياضي', 'فندقة وضيافة',
  'سفر وسياحة', 'تجارة عامة', 'أخرى',
];

export default function CompanySetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);

  // Step 1: Company info
  const [companyNameAr, setCompanyNameAr] = useState('');
  const [companyNameEn, setCompanyNameEn] = useState('');
  const [businessDomain, setBusinessDomain] = useState('');
  const [mobile, setMobile] = useState('');

  // Step 2: Location & Legal
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [streetName, setStreetName] = useState('');
  const [buildingNo, setBuildingNo] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [crnNumber, setCrnNumber] = useState('');

  // Check if setup already done (run once)
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/settings', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const defaultNames = ['نما إنفست', 'Nama Invest', 'شركتي', 'نماء سوفت', 'الشركة الرئيسية', 'Nama Invest ERP', ''];
        const name = Array.isArray(data) ? data.find((s: any) => s.key === 'company_name')?.value : data?.company_name;
        if (name && !defaultNames.includes(name)) {
          router.replace('/dashboard');
        }
      })
      .catch(() => {});
  }, [router]);

  // Validation
  const validateStep1 = () => {
    if (!companyNameAr.trim()) return 'اسم الشركة بالعربية مطلوب';
    if (!mobile.trim()) return 'رقم الجوال مطلوب';
    if (mobile && !/^\d{10}$/.test(mobile)) return 'رقم الجوال يجب أن يكون 10 أرقام';
    return '';
  };

  const validateStep2 = () => {
    if (!city.trim()) return 'المدينة مطلوبة';
    if (vatNumber && !/^3\d{13}3$/.test(vatNumber)) return 'الرقم الضريبي يجب أن يكون 15 رقم (يبدأ وينتهي بـ 3)';
    if (crnNumber && !/^7\d{9}$/.test(crnNumber)) return 'السجل التجاري يجب أن يكون 10 أرقام (يبدأ بـ 7)';
    return '';
  };

  const nextStep = () => {
    const err = validateStep1();
    if (err) { setErrorMsg(err); return; }
    setErrorMsg('');
    setStep(2);
  };

  const handleSubmit = async () => {
    const err = validateStep2();
    if (err) { setErrorMsg(err); return; }
    setErrorMsg('');
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      // 1. Save locally to Settings — use the SAME keys as settings/company page
      const settingsRes = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          // بيانات المنشأة الأساسية
          company_name: companyNameAr,
          company_name_en: companyNameEn,
          company_phone: mobile,
          company_address: `${streetName}${streetName ? '، ' : ''}${district}${district ? '، ' : ''}${city}`,
          tax_number: vatNumber,
          business_domain: businessDomain,
          // بيانات ZATCA (نفس المفاتيح في صفحة معلومات المنشأة)
          zatca_crn: crnNumber,
          zatca_street: streetName,
          zatca_building: buildingNo,
          zatca_district: district,
          zatca_city: city,
          zatca_postal_code: postalCode,
        }),
      });

      if (!settingsRes.ok) {
        console.warn('Settings save warning (non-fatal)');
      }

      // 2. Send to cloud for ICE tracking (namainvist.com/ice/desktop-licenses)
      let trialMessage = '✅ تم حفظ بيانات الشركة بنجاح!';
      try {
        const cloudRes = await fetch('https://namainvist.com/api/ice/desktop-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyNameAr,
            companyNameEn,
            businessDomain,
            mobile,
            vatNumber,
            crnNumber,
            city,
            district,
            streetName,
            buildingNo,
            postalCode,
            hardwareId: getHardwareId(),
            deviceName: navigator.userAgent.substring(0, 80),
            appVersion: '1.0.0',
          }),
        });

        const cloudData = await cloudRes.json();
        if (cloudData.success) {
          if (cloudData.license_key) {
            localStorage.setItem('nama-desktop-license', cloudData.license_key);
            localStorage.setItem('nama-license-status', cloudData.status || 'trial');
          }
          if (cloudData.status === 'trial') {
            trialMessage = `✅ تم التسجيل بنجاح — فترة تجريبية ${cloudData.trial_days || 7} أيام`;
          } else if (cloudData.already_registered) {
            trialMessage = '✅ الجهاز مسجّل مسبقاً — مواصلة العمل';
          }

          // Check if there's a backup to restore
          if (cloudData.has_backup && cloudData.backup_id) {
            setBackupData(cloudData);
            setSuccessMsg(trialMessage);
            setShowRestorePrompt(true);
            setSaving(false);
            return; // Don't redirect yet — ask about restore first
          }
        }
      } catch (cloudErr) {
        console.warn('Cloud registration deferred (no internet):', cloudErr);
        trialMessage = '✅ تم حفظ البيانات — يعمل بدون إنترنت (وضع تجريبي)';
        localStorage.setItem('nama-license-status', 'offline-trial');
      }

      setSuccessMsg(trialMessage);
      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);

    } catch (err: any) {
      setErrorMsg('خطأ في الحفظ: ' + err.message);
    }
    setSaving(false);
  };

  function getHardwareId(): string {
    let id = localStorage.getItem('nama-hardware-id');
    if (!id) {
      id = 'HW-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('nama-hardware-id', id);
    }
    return id;
  }

  // Styles 
  const containerStyle: React.CSSProperties = {
    direction: 'rtl', minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px',
    padding: '40px', maxWidth: '600px', width: '100%',
    boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', fontSize: '14px',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px', color: '#fff', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 700,
    color: 'rgba(255,255,255,0.7)', marginBottom: '6px',
  };

  const fieldGroupStyle: React.CSSProperties = { marginBottom: '16px' };

  const twoColStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
  };

  const btnPrimary: React.CSSProperties = {
    padding: '14px 32px', fontSize: '15px', fontWeight: 700,
    color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer',
    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
  };

  const btnSecondary: React.CSSProperties = {
    padding: '14px 32px', fontSize: '15px', fontWeight: 600,
    color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '14px', cursor: 'pointer', background: 'transparent',
  };

  const handleRestoreBackup = async () => {
    if (!backupData) return;
    setRestoring(true);
    try {
      // Download backup from cloud
      const backupUrl = `https://namainvist.com/api/ice/backup/download?license_key=${backupData.backup_license_key}&id=${backupData.backup_id}`;
      const res = await fetch(backupUrl);
      if (!res.ok) throw new Error('فشل تحميل النسخة الاحتياطية');

      const blob = await res.blob();

      // Send to local restore API
      const formData = new FormData();
      formData.append('file', blob, 'backup.sql.gz');
      
      const restoreRes = await fetch('/api/system/restore-backup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (restoreRes.ok) {
        setSuccessMsg('✅ تم استعادة النسخة الاحتياطية بنجاح!');
        setShowRestorePrompt(false);
        setTimeout(() => { window.location.href = '/login'; }, 2000);
      } else {
        const err = await restoreRes.json();
        setErrorMsg('فشل الاستعادة: ' + (err.message || 'خطأ'));
        setShowRestorePrompt(false);
      }
    } catch (err: any) {
      setErrorMsg('فشل تحميل النسخة: ' + err.message);
      setShowRestorePrompt(false);
    }
    setRestoring(false);
  };

  const skipRestore = () => {
    setShowRestorePrompt(false);
    setTimeout(() => { router.replace('/dashboard'); }, 1000);
  };

  // Restore prompt screen
  if (showRestorePrompt) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>💾</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#a5b4fc', marginBottom: '12px' }}>
            تم العثور على نسخة احتياطية سابقة
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '8px' }}>
            وجدنا نسخة احتياطية لهذه المنشأة من تسجيل سابق
          </p>
          {backupData?.backup_date && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '24px' }}>
              📅 تاريخ النسخة: {new Date(backupData.backup_date).toLocaleDateString('en-GB')}
              {backupData.backup_size && ` — 📦 الحجم: ${(backupData.backup_size / 1024 / 1024).toFixed(1)} MB`}
            </p>
          )}

          {restoring ? (
            <div style={{ padding: '20px' }}>
              <div style={{
                width: '48px', height: '48px', margin: '0 auto 16px',
                border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
              }} />
              <p style={{ color: '#a5b4fc', fontWeight: 600 }}>⏳ جاري استعادة النسخة الاحتياطية...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div style={{
                  marginBottom: '16px', padding: '10px', borderRadius: '10px',
                  background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '13px',
                }}>⚠️ {errorMsg}</div>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  style={{
                    ...btnPrimary,
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                  }}
                  onClick={handleRestoreBackup}
                >
                  ✅ نعم، استعادة النسخة
                </button>
                <button style={btnSecondary} onClick={skipRestore}>
                  ❌ لا، بداية جديدة
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (successMsg && !showRestorePrompt) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏢</div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
            {successMsg}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            جاري التحويل للوحة التحكم...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', boxShadow: '0 8px 30px rgba(99,102,241,0.3)',
          }}>🏢</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            إعداد بيانات المنشأة
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            أدخل بيانات شركتك لتفعيل النظام
          </p>

          {/* Step indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
            {['بيانات المنشأة', 'الموقع والبيانات الضريبية'].map((label, i) => (
              <div key={i} style={{
                padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                background: step === i + 1 ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                color: step === i + 1 ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
                border: `1px solid ${step === i + 1 ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
              }}>
                {i + 1}. {label}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div style={{
            marginBottom: '20px', padding: '12px 16px', borderRadius: '12px',
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', fontSize: '13px', fontWeight: 600,
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>اسم المنشأة بالعربية *</label>
              <input style={inputStyle} value={companyNameAr}
                onChange={e => setCompanyNameAr(e.target.value)}
                placeholder="مثال: مؤسسة نما للتجارة" />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>اسم المنشأة بالإنجليزية</label>
              <input style={{ ...inputStyle, direction: 'ltr' }} value={companyNameEn}
                onChange={e => setCompanyNameEn(e.target.value)}
                placeholder="e.g. Nama Trading Est." />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>مجال العمل *</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={businessDomain}
                onChange={e => setBusinessDomain(e.target.value)}>
                <option value="" style={{ background: '#1e293b' }}>-- اختر مجال العمل --</option>
                {BUSINESS_DOMAINS.map(d => (
                  <option key={d} value={d} style={{ background: '#1e293b' }}>{d}</option>
                ))}
              </select>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>رقم الجوال * (10 أرقام)</label>
              <input style={{ ...inputStyle, direction: 'ltr' }} value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="05XXXXXXXX" maxLength={10} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '24px' }}>
              <button style={btnPrimary} onClick={nextStep}>
                التالي ←
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <div style={twoColStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>المدينة *</label>
                <input style={inputStyle} value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="الرياض" />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>الحي</label>
                <input style={inputStyle} value={district}
                  onChange={e => setDistrict(e.target.value)}
                  placeholder="العليا" />
              </div>
            </div>

            <div style={twoColStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>اسم الشارع</label>
                <input style={inputStyle} value={streetName}
                  onChange={e => setStreetName(e.target.value)}
                  placeholder="شارع الملك فهد" />
              </div>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>رقم المبنى (4 أرقام)</label>
                <input style={{ ...inputStyle, direction: 'ltr' }} value={buildingNo}
                  onChange={e => setBuildingNo(e.target.value)}
                  placeholder="1234" maxLength={4} />
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>الرمز البريدي (5 أرقام)</label>
              <input style={{ ...inputStyle, direction: 'ltr', maxWidth: '200px' }} value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                placeholder="12345" maxLength={5} />
            </div>

            <div style={{
              marginTop: '20px', paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#a5b4fc', marginBottom: '16px' }}>
                📋 البيانات الضريبية
              </h3>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>الرقم الضريبي VAT (15 رقم — يبدأ وينتهي بـ 3)</label>
                <input style={{ ...inputStyle, direction: 'ltr', fontFamily: 'monospace', letterSpacing: '2px' }}
                  value={vatNumber} onChange={e => setVatNumber(e.target.value)}
                  placeholder="3XXXXXXXXXXXXX3" maxLength={15} />
                {vatNumber && /^3\d{13}3$/.test(vatNumber) && (
                  <p style={{ color: '#34d399', fontSize: '12px', marginTop: '4px' }}>✅ الرقم الضريبي صحيح</p>
                )}
                {vatNumber && vatNumber.length === 15 && !/^3\d{13}3$/.test(vatNumber) && (
                  <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>❌ صيغة الرقم الضريبي غير صحيحة</p>
                )}
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>السجل التجاري CRN (10 أرقام — يبدأ بـ 7)</label>
                <input style={{ ...inputStyle, direction: 'ltr', fontFamily: 'monospace', letterSpacing: '2px' }}
                  value={crnNumber} onChange={e => setCrnNumber(e.target.value)}
                  placeholder="7XXXXXXXXX" maxLength={10} />
                {crnNumber && /^7\d{9}$/.test(crnNumber) && (
                  <p style={{ color: '#34d399', fontSize: '12px', marginTop: '4px' }}>✅ السجل التجاري صحيح</p>
                )}
                {crnNumber && crnNumber.length === 10 && !/^7\d{9}$/.test(crnNumber) && (
                  <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>❌ صيغة السجل التجاري غير صحيحة</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', gap: '12px' }}>
              <button style={btnSecondary} onClick={() => { setStep(1); setErrorMsg(''); }}>
                → السابق
              </button>
              <button style={{
                ...btnPrimary,
                background: saving ? '#64748b' : 'linear-gradient(135deg, #059669, #10b981)',
                boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
              }} onClick={handleSubmit} disabled={saving}>
                {saving ? '⏳ جاري الحفظ...' : '✅ حفظ وتفعيل النظام'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
