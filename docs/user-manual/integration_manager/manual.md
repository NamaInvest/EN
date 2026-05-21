# دليل المستخدم — مدير التكاملات (Integration Manager)

> الإصدار: 1.0 · 2026-05-21

## 1. الأدوار والمسؤوليات

أنت مسؤول عن:
- إدارة Webhooks (`/settings/webhooks`)
- إعداد SSO (`/settings/sso`)
- متابعة التكاملات الخارجية (Salla, Zid, WhatsApp, Telegram)
- مراقبة failCount + lastDeliveredAt للـ webhooks

## 2. المهام اليومية

### 2.1 مراجعة Webhooks الفاشلة
1. افتح **[Webhooks](/settings/webhooks)**
2. ابحث عن أي webhook بـ ⚠️ "X فشل"
3. لو failCount > 5 خلال 24 ساعة:
   - تحقق من URL — هل الـ endpoint يعمل؟ (`curl -X POST`)
   - راجع SSL certificate (لا يقبل النظام HTTP في الإنتاج)
   - تحقق من الجهة المستقبلة — هل تقبل HMAC signing؟

### 2.2 إضافة Webhook جديد
1. اضغط "webhook جديد"
2. أدخل:
   - **URL** (يجب HTTPS في الإنتاج)
   - **الوصف** (مثل "Slack invoices integration")
   - **الأحداث** — اختر فقط ما تحتاجه (لا تختر الكل!)
3. اضغط "إنشاء"
4. **⚠️ مهم جداً:** سيظهر **secret** مرة واحدة فقط:
   - **انسخه فوراً** (زر النسخ بجانبه)
   - احفظه في مكان آمن (Password Manager)
   - أعطه للمطوّر على جهتك المستقبلة
   - اضغط "فهمت — احفظت الـ secret"

### 2.3 تدوير Secret (Rotate)
لو تسرّب الـ secret أو غادر مطوّر:
1. اضغط 🔄 على الـ webhook المعني
2. **انسخ الـ secret الجديد فوراً**
3. حدّثه في الجهة المستقبلة قبل انتهاء أول delivery (≤ 5 دقائق)

## 3. التعامل مع SSO

### 3.1 إعداد SSO لأول مرة
1. افتح **[SSO Settings](/settings/sso)**
2. اضغط "إعداد موفّر SSO"
3. اختر النوع:
   - **Microsoft Entra ID (Azure AD)** — للشركات اللي تستخدم Microsoft 365
   - **Google Workspace** — لو الشركة على Google
   - **Okta** — Enterprise-grade IAM
   - **SAML 2.0** — أي IdP يدعم SAML
   - **OIDC** — modern OAuth providers
4. احصل من مدير الـ IdP:
   - Client ID
   - Client Secret
   - Metadata URL (لـ SAML) أو Auth/Token URLs (لـ OIDC)
5. أكمل ربط الحقول:
   - `email` → عادة `email` أو `preferred_username`
   - `firstName` → `given_name`
   - `lastName` → `family_name`
6. اضغط "تسجيل"
7. **اختبر قبل التفعيل** — جرّب من حساب اختبار
8. اضغط "تفعيل" بعد التأكد

### 3.2 إيقاف SSO (Emergency)
في حالة طوارئ (مثل تعطّل IdP):
1. افتح `/settings/sso`
2. اضغط "إيقاف"
3. سيدخل المستخدمون بكلمات المرور التقليدية مؤقتاً

## 4. المهام الأسبوعية

- **يوم الأحد**: مراجعة كل webhooks + تأكد آخر تسليم كان خلال 7 أيام
- **يوم الثلاثاء**: مراجعة SSO logs (`/admin/siem` filter source=mfa)
- **يوم الخميس**: حذف webhooks غير المستخدمة

## 5. أخطاء شائعة

| الخطأ | السبب | التعافي |
|---|---|---|
| webhook failCount > 50 | الـ endpoint مات | اتصل بالمطوّر + عطّل الـ webhook |
| SSO يرفض الدخول | Client Secret منتهي | جدّده من IdP + حدّث في `/settings/sso` |
| التواقيع HMAC غير صحيحة | secret مختلف بين الجهتين | rotate secret + شارك الجديد |
| Salla webhook لا يصل | URL في Salla مش الصح | راجع settings → integrations → Salla |

## 6. اختصارات

- `Ctrl+R` — تحديث القائمة
- `Esc` — إغلاق modal
- `Ctrl+C` — نسخ secret (بعد تحديده)

## 7. متى أصعّد للمدير العام؟

- تسرّب secret (طوارئ أمنية)
- SSO معطّل > 1 ساعة
- > 100 webhook فشل في يوم
- محاولات تسجيل دخول مشبوهة (راجع SIEM)

## 8. الأسئلة الشائعة

1. **س: هل أحفظ secret في الـ git؟** ج: **مطلقاً لا**. استخدم env vars أو vault.
2. **س: كم webhook أستطيع إنشاء؟** ج: لا حد فني — حد عملي 50 لأداء جيد.
3. **س: هل النظام يعيد المحاولة لو فشل التسليم؟** ج: نعم — 3 محاولات exponential backoff.
4. **س: ما الحدث الأهم لـ ERP؟** ج: `invoice.posted` و `payment.received`.
5. **س: SAML أم OIDC؟** ج: OIDC أحدث وأسهل. SAML للأنظمة القديمة.
6. **س: كيف أتأكد التوقيع صحيح؟** ج: استخدم crypto.timingSafeEqual في Node.js.
7. **س: هل النظام يدعم WebSockets؟** ج: لا — Webhooks فقط (HTTP POST).
8. **س: ماذا لو endpoint بطيء؟** ج: timeout = 10 ثانية. صمّم endpoint async.
9. **س: هل أحذف webhook قديم؟** ج: نعم — لكن تأكد أنه فعلاً غير مستخدم.
10. **س: هل SSO يعمل مع MFA؟** ج: نعم — تعتمد إعدادات الـ IdP.
11. **س: نسيت سجلت من؟** ج: راجع `/admin/siem` filter source=audit.
12. **س: كيف أعرف من غيّر webhook؟** ج: audit_logs table — ابحث عن action=UPDATE_WEBHOOK.
13. **س: هل أستخدم نفس secret لكذا webhook؟** ج: **لا**. كل واحد له secret خاص.
14. **س: الـ secret طوله كم؟** ج: 64 hex chars (256-bit).
15. **س: SSO يحجب وصولي للوحة الإدارة؟** ج: لا — admin/owner لهم emergency password.
