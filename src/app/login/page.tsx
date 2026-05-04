"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Camera, X } from "lucide-react";
import { SignIn } from "@clerk/nextjs";

import { Suspense } from "react";
import { useTranslation } from "@/lib/i18n";

function LoginForm() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("نما انفست");
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [isDesktop, setIsDesktop] = useState(process.env.NEXT_PUBLIC_IS_DESKTOP === '1');
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
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    const isDesktopMode = isLocalhost || !!(window as any).namaDesktop;
    if (isDesktopMode) {
      setIsDesktop(true);
      setIsSubdomain(true); // Desktop uses JWT auth like subdomains
    } else if (host !== 'namainvist.com' && host !== 'www.namainvist.com' && host.endsWith('.namainvist.com')) {
      setIsSubdomain(true);
    }

    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const name = data.find?.(
          (s: { key: string }) => s.key === "company_name",
        );
        if (name?.value) setCompanyName(name.value);
      })
      .catch(() => {});

    // Temporary 1-hour auto-login bypass
    const bypassExpiry = new Date("2026-03-20T01:10:00+03:00").getTime();
    if (Date.now() < bypassExpiry && !localStorage.getItem("token")) {
      setUsername("admin");
      setPassword("admin");
      setTimeout(() => {
        const btn = document.getElementById("login-btn-auto");
        if (btn) btn.click();
      }, 800);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("[LOGIN] Starting login...");

      // Generate or retrieve device token
      let deviceToken = localStorage.getItem("deviceToken");
      if (!deviceToken) {
        deviceToken = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          },
        );
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

      document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
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
        setError(data.error || "رمز التحقق غير صحيح");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("lastActivity", Date.now().toString());
      document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;

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
      setError("حدث خطأ في الاتصال");
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

          {isDesktop ? (
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
          ) : isSubdomain ? (
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
                forceRedirectUrl="https://namainvist.com/dashboard"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => alert("Google Login is currently disabled")}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "16px",
                background: "white",
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                fontWeight: 600,
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#f8f9fa")}
              onMouseOut={(e) => (e.currentTarget.style.background = "white")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              {t("sys.str_4016")}
            </button>
          )}
        </form>

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
                alert("جاري دمج مكتبة face-api.js للتعرف على وجه الكاشير. يتطلب تحميل ملفات النماذج (Models).");
                setShowFaceLogin(false);
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

