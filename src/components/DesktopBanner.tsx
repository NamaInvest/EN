'use client';

import { useState, useEffect } from 'react';

// ──────────────────────────────────────────────────────────────────────────────
// Desktop Trial & License Banner
// يظهر في أعلى كل صفحة عند تشغيل التطبيق في وضع Desktop
// ──────────────────────────────────────────────────────────────────────────────

interface TrialInfo {
  isDesktop: boolean;
  isLicensed: boolean;
  trialDaysLeft: number;
  trialExpired: boolean;
  licenseName?: string;
  licenseKey?: string;
  lastBackup?: number;
  version?: string;
}

export default function DesktopBanner() {
  const [info, setInfo] = useState<TrialInfo | null>(null);
  const [showActivation, setShowActivation] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState(false);

  useEffect(() => {
    // Only run in desktop mode
    const isDesktop = typeof window !== 'undefined' && (
      (window as any).namaDesktop || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );

    if (!isDesktop) return;

    // Get trial/license info from Electron
    async function getInfo() {
      try {
        const desktop = (window as any).namaDesktop;
        if (desktop) {
          const [license, appInfo] = await Promise.all([
            desktop.getLicense(),
            desktop.getAppInfo(),
          ]);

          const firstLaunch = localStorage.getItem('nama_first_launch');
          if (!firstLaunch) {
            localStorage.setItem('nama_first_launch', Date.now().toString());
          }
          
          const launchDate = parseInt(firstLaunch || Date.now().toString());
          const daysSinceInstall = Math.floor((Date.now() - launchDate) / (1000 * 60 * 60 * 24));
          const trialDays = 30;
          const trialDaysLeft = Math.max(0, trialDays - daysSinceInstall);

          setInfo({
            isDesktop: true,
            isLicensed: !!license,
            trialDaysLeft,
            trialExpired: trialDaysLeft <= 0 && !license,
            licenseName: license?.company,
            licenseKey: license?.key,
            version: appInfo?.version,
          });

          // Show activation dialog if trial expired
          if (trialDaysLeft <= 0 && !license) {
            setShowActivation(true);
          }
        } else {
          // Fallback for browser testing
          const firstLaunch = localStorage.getItem('nama_first_launch');
          if (!firstLaunch) {
            localStorage.setItem('nama_first_launch', Date.now().toString());
          }
          const launchDate = parseInt(firstLaunch || Date.now().toString());
          const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - launchDate) / (1000 * 60 * 60 * 24)));
          
          setInfo({
            isDesktop: true,
            isLicensed: false,
            trialDaysLeft: daysLeft,
            trialExpired: daysLeft <= 0,
            version: '1.0.0',
          });
        }
      } catch (err) {
        console.error('Desktop info error:', err);
      }
    }

    getInfo();
  }, []);

  async function handleActivate() {
    if (!licenseKey.trim()) return;
    setActivating(true);
    setActivationError('');

    try {
      const desktop = (window as any).namaDesktop;
      if (desktop) {
        const result = await desktop.activateLicense(licenseKey.trim());
        if (result.success) {
          setActivationSuccess(true);
          setShowActivation(false);
          setInfo(prev => prev ? { ...prev, isLicensed: true, trialExpired: false } : prev);
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setActivationError(result.error || 'مفتاح غير صالح');
        }
      } else {
        // Fallback: call API directly
        const res = await fetch('/api/ice/license/verify?key=' + encodeURIComponent(licenseKey.trim()));
        const data = await res.json();
        if (data.valid) {
          localStorage.setItem('nama_license', JSON.stringify({ key: licenseKey, ...data }));
          setActivationSuccess(true);
          setShowActivation(false);
          setInfo(prev => prev ? { ...prev, isLicensed: true } : prev);
        } else {
          setActivationError('مفتاح غير صالح أو منتهي الصلاحية');
        }
      }
    } catch (err) {
      setActivationError('خطأ في الاتصال. تأكد من اتصال الإنترنت.');
    }

    setActivating(false);
  }

  if (!info?.isDesktop) return null;

  // Trial expired — force activation
  if (info.trialExpired && showActivation) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999, direction: 'rtl',
      }}>
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '40px',
          maxWidth: '460px', width: '90%', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
            انتهت الفترة التجريبية
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
            أدخل مفتاح الترخيص لمواصلة استخدام نما إنفست
          </p>

          <input
            type="text"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={licenseKey}
            onChange={e => setLicenseKey(e.target.value.toUpperCase())}
            style={{
              width: '100%', padding: '14px 16px', fontSize: '16px',
              border: '2px solid #e2e8f0', borderRadius: '12px',
              textAlign: 'center', fontFamily: 'monospace', letterSpacing: '2px',
              outline: 'none', marginBottom: '12px', direction: 'ltr',
            }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />

          {activationError && (
            <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>
              ❌ {activationError}
            </p>
          )}

          <button
            onClick={handleActivate}
            disabled={activating || !licenseKey.trim()}
            style={{
              width: '100%', padding: '14px', fontSize: '16px',
              fontWeight: 600, color: '#fff', border: 'none',
              borderRadius: '12px', cursor: 'pointer',
              background: activating ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
              marginBottom: '16px',
            }}
          >
            {activating ? '⏳ جاري التفعيل...' : '🔓 تفعيل الرخصة'}
          </button>

          <p style={{ color: '#94a3b8', fontSize: '12px' }}>
            للحصول على مفتاح ترخيص تواصل مع الدعم الفني
            <br />
            <span style={{ fontFamily: 'monospace' }}>support@namainvist.com</span>
          </p>
        </div>
      </div>
    );
  }

  if (activationSuccess) {
    return (
      <div style={{
        position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff', padding: '12px 28px', borderRadius: '12px',
        fontSize: '14px', fontWeight: 600, zIndex: 99999,
        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
        direction: 'rtl', animation: 'fadeIn 0.3s ease',
      }}>
        ✅ تم تفعيل الرخصة بنجاح! جاري إعادة التحميل...
      </div>
    );
  }

  // Licensed — show green badge (optional, can be hidden)
  if (info.isLicensed) {
    return null; // No banner needed when licensed
  }

  // Trial active — show countdown banner
  const urgency = info.trialDaysLeft <= 7;
  return (
    <>
      <div style={{
        background: urgency
          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
          : 'linear-gradient(135deg, #6366f1, #4f46e5)',
        color: '#fff',
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontSize: '13px',
        fontWeight: 500,
        direction: 'rtl',
        zIndex: 9999,
      }}>
        <span>
          {urgency ? '⚠️' : '💎'}{' '}
          فترة تجريبية — {info.trialDaysLeft} يوم متبقي
          {info.version && <span style={{ opacity: 0.7, marginRight: '12px' }}>v{info.version}</span>}
        </span>
        <button
          onClick={() => setShowActivation(true)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            padding: '3px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          🔑 تفعيل الرخصة
        </button>
      </div>

      {/* Activation Modal */}
      {showActivation && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, direction: 'rtl',
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '32px',
            maxWidth: '420px', width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔑</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
              تفعيل نما إنفست
            </h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              أدخل مفتاح الترخيص المقدم من فريق الدعم
            </p>

            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={licenseKey}
              onChange={e => setLicenseKey(e.target.value.toUpperCase())}
              style={{
                width: '100%', padding: '12px 14px', fontSize: '15px',
                border: '2px solid #e2e8f0', borderRadius: '10px',
                textAlign: 'center', fontFamily: 'monospace', letterSpacing: '2px',
                outline: 'none', marginBottom: '10px', direction: 'ltr',
              }}
            />

            {activationError && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '8px' }}>
                ❌ {activationError}
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={handleActivate}
                disabled={activating || !licenseKey.trim()}
                style={{
                  flex: 1, padding: '12px', fontSize: '14px',
                  fontWeight: 600, color: '#fff', border: 'none',
                  borderRadius: '10px', cursor: 'pointer',
                  background: activating ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                }}
              >
                {activating ? '⏳ جاري...' : '✅ تفعيل'}
              </button>
              <button
                onClick={() => setShowActivation(false)}
                style={{
                  padding: '12px 20px', fontSize: '14px',
                  fontWeight: 500, color: '#64748b', border: '1px solid #e2e8f0',
                  borderRadius: '10px', cursor: 'pointer', background: '#fff',
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
