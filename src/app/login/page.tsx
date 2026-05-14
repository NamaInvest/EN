"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Camera, X } from "lucide-react";
import { SignIn, useUser } from "@clerk/nextjs";

import { Suspense } from "react";
import { useTranslation } from "@/lib/i18n";

function LoginForm() {
  const { user, isLoaded } = useUser();
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("نما انفست");
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showLocalForm, setShowLocalForm] = useState(false);
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/auth/routing";

  useEffect(() => {
    // Detect if we're on a tenant subdomain or desktop (Electron)
    const host = window.location.hostname || '';
    const isDesktopApp = !!(window as any).namaDesktop;
    
    // Determine the environment
    if (isDesktopApp) {
      setIsDesktop(true);
      setIsSubdomain(true); // Desktop uses local JWT auth
      setShowLocalForm(true);
    } else if (host !== 'namainvist.com' && host !== 'www.namainvist.com' && host.endsWith('.namainvist.com')) {
      setIsSubdomain(true); // We are on a tenant subdomain -> Default to Username/Password
      setShowLocalForm(true);
    } else {
      setIsSubdomain(false); // We are on Main Domain -> Default to Clerk SignIn
      setShowLocalForm(false);
    }

    // ملاحظة مهمة: لا نقوم بتحويل تلقائي لـ sso-redirect هنا!
    // التدفق الصحيح: المستخدم يرى نموذج Clerk → يضغط زر الدخول →
    // Clerk يحوله لـ afterSignInUrl (وهي /api/auth/sso-redirect)
    // التحويل التلقائي كان يسبب حلقة لا نهائية (Loop)

    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const name = data.find?.(
          (s: { key: string }) => s.key === "company_name",
        );
        if (name?.value) setCompanyName(name.value);
      })
      .catch(() => {});

  }, [user, isLoaded]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("[LOGIN] Starting login...");

      // [#10] إصلاح أمني: استخدام crypto.randomUUID() بدلاً من Math.random()
      // Math.random() ليس cryptographically secure ولا يصلح لتوليد tokens
      let deviceToken = localStorage.getItem("deviceToken");
      if (!deviceToken) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          deviceToken = crypto.randomUUID();
        } else {
          // Fallback للمتصفحات القديمة فقط
          deviceToken = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            },
          );
        }
        localStorage.setItem("deviceToken", deviceToken);
      }
      const deviceName = navigator.userAgent.substring(0, 50);

      console.log("[LOGIN] Sending fetch...");

      // Add timeout to prevent infinite hang
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, deviceToken, deviceName }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("[LOGIN] Response status:", res.status);

      let data;
      try {
        data = await res.json();
      } catch {
        setError(t("sys.str_4020") + res.status + ")");
        return;
      }

      if (!res.ok) {
        setError(data.error || t("sys.str_4021"));
        return;
      }

      if (data.requires2FA) {
        setShow2FA(true);
        setTempUserId(data.userId); // Ensure backend returns userId when requires2FA is true
        return;
      }

      console.log("[LOGIN] Success, saving token...");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("lastActivity", Date.now().toString());

      // [#9] إصلاح أمني: إضافة SameSite=Lax لمنع CSRF attacks
      // ملاحظة: Secure يُضاف فقط في HTTPS. HttpOnly غير ممكن من client-side.
      const isSecure = window.location.protocol === 'https:';
      document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
      // تحويل المستخدم حسب الدور والصفحة الافتراضية
      const defaultPage = data.user?.defaultPage;
      const ADMIN_ROLES = ['admin', 'owner', 'system_admin'];

      // Desktop mode: check if company setup is needed
      if (isDesktop && ADMIN_ROLES.includes(data.user?.role)) {
        try {
          const settingsRes = await fetch('/api/settings', {
            headers: { 'Authorization': `Bearer ${data.token}` },
          });
          if (settingsRes.ok) {
            const settings = await settingsRes.json();
            const compName = Array.isArray(settings) 
              ? settings.find((s: any) => s.key === 'company_name')?.value
              : settings?.company_name;
            const needsSetup = !compName || compName === 'نما إنفست' || compName === 'Nama Invest' || compName === 'شركتي' || compName === 'نماء سوفت' || compName === 'الشركة الرئيسية' || compName === 'Nama Invest ERP';
            if (needsSetup) {
              window.location.href = '/company-setup';
              return;
            }
          }
        } catch { /* proceed to dashboard */ }
      }

      if (defaultPage) {
        window.location.href = defaultPage;
      } else if (ADMIN_ROLES.includes(data.user?.role)) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/pos";
      }
    } catch (err) {
      console.error("[LOGIN] Error:", err);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(t("sys.str_4022"));
      } else {
        setError(
          t("sys.str_4023") +
            (err instanceof Error ? err.message : t("sys.str_4024")),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: tempUserId, token: mfaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("sys.str_4027") || "رمز التحقق غير صحيح");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("lastActivity", Date.now().toString());
      const isSecure2FA = window.location.protocol === 'https:';
      document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${isSecure2FA ? '; Secure' : ''}`;

      const defaultPage = data.user?.defaultPage;
      const ADMIN_ROLES = ['admin', 'owner', 'system_admin'];
      if (defaultPage) {
        window.location.href = defaultPage;
      } else if (ADMIN_ROLES.includes(data.user?.role)) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/pos";
      }
    } catch (err) {
      setError(t("sys.str_4028") || "حدث خطأ في الاتصال");
      setLoading(false);
    }
  };

  if (show2FA) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">🔐</div>
            <div className="login-logo-text">التحقق بخطوتين</div>
            <div className="login-subtitle">يرجى إدخال رمز التحقق (TOTP) أو الرمز الاحتياطي للمتابعة</div>
          </div>
          <form onSubmit={handle2FASubmit}>
            <div className="input-group">
              <label className="input-label">رمز التحقق</label>
              <input
                type="text"
                className="input"
                placeholder="أدخل الرمز هنا"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                required
                autoFocus
                maxLength={10}
              />
            </div>
            {error && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", padding: "10px", marginBottom: "16px", color: "#F87171", fontSize: "13px", textAlign: "center" }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", padding: "14px", fontSize: "16px", marginTop: "8px" }}>
              {loading ? "جاري التحقق..." : "تأكيد"}
            </button>
            <button type="button" onClick={() => setShow2FA(false)} className="btn btn-secondary" style={{ width: "100%", padding: "14px", fontSize: "16px", marginTop: "12px", background: "rgba(99, 102, 241, 0.1)", color: "#6366f1", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              العودة لتسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">{t("sys.str_4010")}</div>
          <div className="login-logo-text">{companyName}</div>
          <div className="login-subtitle">{t("sys.str_4011")}</div>
        </div>

        {!isDesktop && !showLocalForm ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'center',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              <SignIn 
                appearance={{
                  elements: {
                    rootBox: { width: '100%' },
                    card: { 
                      boxShadow: 'none', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      width: '100%',
                    },
                    headerTitle: { display: 'none' },
                    headerSubtitle: { display: 'none' },
                    socialButtonsBlockButton: { 
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                    },
                    formButtonPrimary: {
                      background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                      borderRadius: '8px',
                    },
                    footer: { display: 'none' },
                    footerAction: { display: 'none' },
                  },
                }}
                routing="hash"
                fallbackRedirectUrl="/sso-callback"
              />
            </div>
            
            <div style={{ display: "flex", alignItems: "center", margin: "10px 0", width: "100%", color: "#64748b" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border-color, #e2e8f0)" }}></div>
              <span style={{ margin: "0 10px", fontSize: "14px", fontWeight: 600 }}>أو</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border-color, #e2e8f0)" }}></div>
            </div>

            <button 
              onClick={() => setShowLocalForm(true)}
              className="btn btn-secondary"
              style={{
                width: "100%", padding: "14px", fontSize: "16px",
                background: "rgba(99, 102, 241, 0.1)", color: "#6366f1",
                border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "8px",
                cursor: "pointer", fontWeight: "bold"
              }}
            >
              دخول الموظفين (اسم المستخدم)
            </button>
          </div>
        ) : (
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">{t("sys.str_4012")}</label>
            <input
              type="text"
              className="input"
              placeholder={t("sys.str_4025")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label">{t("sys.str_4013")}</label>
            <input
              type="password"
              className="input"
              placeholder={t("sys.str_4026")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "16px",
                color: "#F87171",
                fontSize: "13px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          <button
            id="login-btn-auto"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "16px",
              marginTop: "8px",
            }}
          >
            {loading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span className="login-spinner" />
                {t("sys.str_4014")}
              </span>
            ) : (
              "تسجيل الدخول"
            )}
          </button>

          {isDesktop && (
            <button
              type="button"
              onClick={() => setShowFaceLogin(true)}
              className="btn btn-secondary"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "16px",
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "rgba(99, 102, 241, 0.1)",
                color: "#6366f1",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              <Camera size={20} />
              الدخول السريع بالكاميرا (Face ID)
            </button>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "20px 0",
              color: "#64748b",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "var(--border-color, #e2e8f0)",
              }}
            ></div>
            <span
              style={{ margin: "0 10px", fontSize: "14px", fontWeight: 600 }}
            >
              {isDesktop ? "تطبيق سطح المكتب" : isSubdomain ? "تسجيل دخول صاحب الحساب" : t("sys.str_4015")}
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "var(--border-color, #e2e8f0)",
              }}
            ></div>
          </div>

          {isDesktop && (
            <div style={{
              textAlign: 'center',
              padding: '16px',
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖥️</div>
              <div style={{ color: '#6366f1', fontWeight: 600, fontSize: '14px' }}>
                وضع سطح المكتب — يعمل بدون إنترنت
              </div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                فترة تجريبية 7 أيام • ZATCA والفوترة الإلكترونية تعمل عند توفر الإنترنت
              </div>
            </div>
          )}

          {isSubdomain && !isDesktop && (
            <button 
              type="button"
              onClick={() => setShowLocalForm(false)}
              className="btn btn-secondary"
              style={{
                width: "100%", padding: "12px", fontSize: "14px", marginTop: "16px",
                background: "transparent", color: "#64748b",
                border: "1px solid #e2e8f0", borderRadius: "8px",
                cursor: "pointer", fontWeight: "600"
              }}
            >
              العودة لتسجيل دخول صاحب الحساب
            </button>
          )}
        </form>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid var(--border)",
            color: "var(--text-muted)",
            fontSize: "12px",
          }}
        >
          {t("sys.str_4017")}
        </div>
      </div>

      {/* Face Login Modal */}
      {showFaceLogin && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#1e293b', padding: '24px', borderRadius: '16px', width: '400px',
            border: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative'
          }}>
            <button 
              onClick={() => setShowFaceLogin(false)} 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <Camera size={48} color="#6366f1" style={{ marginBottom: '16px' }} />
            <h2 style={{ color: 'white', marginBottom: '8px', fontSize: '20px' }}>الدخول ببصمة الوجه</h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '24px', fontSize: '14px' }}>
              سيتم تفعيل الكاميرا للتعرف على وجهك. تأكد من إضاءة المكان بشكل جيد.
            </p>
            <div style={{
              width: '300px', height: '300px', background: 'black', borderRadius: '50%',
              overflow: 'hidden', border: '4px solid #6366f1', position: 'relative',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
            }}>
              {/* placeholder for video feed */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                جاري تهيئة الذكاء الاصطناعي...
              </div>
            </div>
            <button onClick={() => {
                setShowFaceLogin(false);
                setError("ميزة التعرف على الوجه ستُتاح في الإصدار القادم. استخدم اسم المستخدم وكلمة المرور.");
            }} style={{
              marginTop: '24px', background: '#6366f1', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
            }}>
              بدء الفحص
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#02040a",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "1.25rem",
            fontFamily: "Noto Sans Arabic,sans-serif",
          }}
        >
          {t("sys.str_4018")}
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
