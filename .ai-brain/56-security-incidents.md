# 56 - الاستجابة للحوادث الأمنية (Security Incident Response)

> Phishing + Account Compromise + Data Breach + DDoS + Ransomware

---

## 🚨 تصنيف الحوادث

### Severity:
| Level | Description | مثال |
|---|---|---|
| **P1 - Critical** | تأثير شامل | Ransomware, مسرّب بيانات كبير |
| **P2 - High** | تأثير قوي | Account compromise، DDoS |
| **P3 - Medium** | تأثير متوسط | Phishing attempt، Weak password |
| **P4 - Low** | تأثير محدود | Failed login attempts |

---

## 🔥 Incident Response Plan

### المراحل الـ 6:

```
1. Preparation   (قبل)
        ↓
2. Detection     (اكتشاف)
        ↓
3. Containment   (احتواء)
        ↓
4. Eradication   (إزالة)
        ↓
5. Recovery      (استعادة)
        ↓
6. Post-Mortem   (دروس مستفادة)
```

---

## 🎯 السيناريوهات الشائعة

### 1. Phishing Attack
**الموقف:** موظف ضغط على رابط في email مشبوه.

```
1. Detection:
   - الموظف يبلغ
   - أو Auto-detection (anomalous login)

2. Containment:
   - فوراً: تعليق حساب الموظف
     await prisma.user.update({
         where: { id: empId },
         data: { sessionToken: null, isLocked: true }
     });
   - إجبار MFA على كل المستخدمين
   - مراقبة الـ AuditLog

3. Investigation:
   - متى دخل الـ phishing site؟
   - ما هي البيانات التي أدخلها؟
   - هل دخل الـ attacker بحساب الموظف؟
   - ما هي العمليات في فترة الـ compromise؟

4. Eradication:
   - إعادة تعيين password
   - إلغاء كل الـ sessions
   - revoke كل الـ API keys
   - مسح أي software ضار من الجهاز

5. Recovery:
   - الموظف يعود لعمله
   - تدريب أمني
   - تنبيه باقي الفريق

6. Post-Mortem:
   - كيف وصل الـ email؟
   - ضع spam filter أقوى
   - تدريب security awareness
```

---

### 2. Account Compromise
**الموقف:** اكتشاف دخول غير عادي لحساب admin.

```
المؤشرات:
- Login من IP غير معتاد
- Login في وقت غير عادي (3 AM)
- إجراءات حساسة فوراً بعد الدخول
- AI Auditor يكشف

1. Containment فوري:
   POST /api/admin/security/lock-user
   { userId: 5 }
   # كل الـ sessions تنتهي

2. Investigation:
   - GET /api/audit-logs?userId=5&period=last24h
   - تحديد كل الإجراءات منذ الـ compromise
   - أي بيانات تم export؟
   - أي تعديلات في الـ settings؟

3. Damage Assessment:
   - فحص كل JE في الفترة
   - فحص الـ permissions changes
   - فحص الـ user creation

4. Rollback (إذا needed):
   - عكس الإجراءات الضارة
   - استعادة backup إذا لزم

5. Eradication:
   - تغيير كل الـ passwords
   - إجبار MFA على الجميع
   - revoke API keys
   - مراجعة access logs

6. Recovery:
   - notify الـ Owner
   - audit report مفصل
   - بلاغ شرعي إذا كانت سرقة

7. Prevention:
   - IP whitelist للـ admins
   - MFA إجباري
   - Anomaly detection AI
   - Geo-fencing
```

---

### 3. Data Breach
**الموقف:** كشف بيانات عملاء (PII).

```
⚠️ CRITICAL — PDPL يلزم بإخطار SDAIA خلال 72 ساعة

1. Detection:
   - علم ضحية
   - dark web monitoring
   - Sentry/Splunk alerts
   - AI Auditor

2. Immediate Containment:
   - وقف الـ leak (إذا ongoing)
   - عزل النظم المتأثرة
   - تجميد الـ access

3. Investigation:
   - ما البيانات المسرّبة؟
     - أسماء؟
     - أرقام هوية؟
     - معلومات بنكية؟
     - معلومات صحية؟
   - عدد الأشخاص المتأثرين
   - مدة الـ exposure
   - الـ attack vector

4. Legal Obligations (PDPL):
   a. خلال 72 ساعة من الـ detection:
      - إخطار SDAIA
      - POST /api/pdpl/breach
      - الـ form الرسمي
   b. إذا high risk:
      - إخطار كل شخص متأثر
      - Email + SMS
      - شرح الـ steps to take

5. Eradication:
   - إصلاح الـ vulnerability
   - تحديث الـ security
   - تشفير البيانات الحساسة
   - تعزيز الـ access controls

6. Recovery:
   - استعادة الـ trust
   - إجراءات تعويضية للضحايا
   - Credit monitoring (للبيانات المالية)
   - Public statement

7. Post-Mortem:
   - الـ root cause
   - الـ timeline
   - Lessons learned
   - Prevention plan
   - تدريب مكثف
   - Pen-test مكثف

8. Insurance:
   - Cyber insurance claim
   - Document everything
```

---

### 4. DDoS Attack
**الموقف:** هجوم حجب الخدمة.

```
المؤشرات:
- الموقع بطيء جداً أو غير متاح
- spike في الـ requests
- patterns غريبة (نفس الـ IP، نفس الـ endpoint)

1. Detection:
   - Cloudflare alerts
   - Uptime monitor
   - APM (Application Performance Monitor)

2. Immediate Response:
   - Cloudflare auto-mitigation (تلقائي)
   - Enable "Under Attack Mode" في Cloudflare
   - Rate limiting aggressive
   - IP blocking للـ malicious IPs

3. Investigation:
   - تحليل الـ traffic patterns
   - تحديد الـ attack type:
     - Volumetric (UDP flood)
     - Application layer (HTTP flood)
     - Protocol (SYN flood)
   - مصدر الـ attack (IPs, countries)

4. Mitigation:
   - Cloudflare WAF rules
   - Tighter rate limits
   - Geo-blocking (إذا attack من بلد محدد)
   - Server scaling (autoscale)

5. Communication:
   - Status page update
   - Customer email
   - Apologies for inconvenience

6. Post-Attack:
   - تحليل الـ traffic
   - تقوية الـ defenses:
     - Better rate limits
     - WAF rules permanent
     - CDN configurations
   - DDoS protection plan
```

---

### 5. Ransomware
**Worst-case scenario**

```
المؤشرات:
- ملفات مشفرة فجأة
- ransom note ظاهرة
- صعوبة الوصول للبيانات

⚠️ DO NOT PAY THE RANSOM ⚠️

1. Immediate Isolation:
   - فصل النظام المصاب من الشبكة
   - إيقاف كل services
   - منع spread

2. Notification:
   - الـ Owner
   - الـ Legal team
   - بلاغ شرعي
   - SDAIA (إذا PDPL data)

3. Investigation:
   - تحديد الـ attack vector
   - تحديد الـ malware family
   - تحديد الـ scope
   - فحص الـ backups (إذا نظيفة)

4. Recovery من Backups:
   - استعادة من backup قبل الـ attack
   - تأكد الـ backup ليس infected
   - Off-site backups (S3) أكثر أماناً
   - Full system rebuild ideally

5. Strengthen:
   - Patch all systems
   - تحديث anti-malware
   - تدريب الفريق
   - Network segmentation
   - Backup strategy تعزيز

6. Legal & PR:
   - تواصل مع السلطات
   - إذا PII تأثرت: PDPL notifications
   - Customer communications
```

---

### 6. SQL Injection / XSS Attempt
**الموقف:** WAF يكشف محاولة SQL injection.

```
1. Detection:
   - Cloudflare WAF blocks
   - Sentry captures
   - Custom monitoring

2. Investigation:
   - تحليل الـ payload
   - مصدر الـ IP
   - الـ endpoint المستهدف

3. Verification:
   - هل الـ attempt نجح؟
   - فحص الـ logs
   - فحص DB integrity

4. Block:
   - Block الـ IP
   - Update WAF rules
   - أبلغ Cloudflare للـ patterns

5. Code Review:
   - الـ endpoint المستهدف
   - تأكد parameterized queries
   - تأكد input validation
   - استخدام Prisma (ORM) safely
```

---

## 🛡 Preventive Measures (المسبقة)

### Technical:
- ✅ MFA لكل admins
- ✅ Password policy قوية (12+ char, complexity)
- ✅ Password rotation كل 90 يوم
- ✅ Session timeout (30 min idle)
- ✅ Rate limiting صارم
- ✅ IP whitelist للـ admin panel
- ✅ WAF (Cloudflare)
- ✅ DDoS protection
- ✅ SSL/TLS only (HSTS)
- ✅ CSP headers
- ✅ HTTPS فقط
- ✅ Encrypted backups
- ✅ Penetration testing سنوي
- ✅ Vulnerability scanning منتظم
- ✅ Security headers
- ✅ Input validation (Zod)
- ✅ Output encoding (لمنع XSS)
- ✅ Prepared statements (Prisma)

### Operational:
- ✅ Security awareness training
- ✅ Phishing simulation
- ✅ Incident response drills
- ✅ Background checks للموظفين
- ✅ Least privilege principle
- ✅ Separation of duties
- ✅ Audit log immutable
- ✅ Regular access reviews
- ✅ Offboarding procedures
- ✅ Vendor security assessment

### Physical:
- ✅ Datacenter security (Hetzner)
- ✅ Office access control
- ✅ Locked cabinets للـ devices
- ✅ CCTV
- ✅ Visitor logs

---

## 📋 Incident Reporting

### النموذج:
```typescript
interface SecurityIncident {
    incidentId: string;
    severity: 'P1' | 'P2' | 'P3' | 'P4';
    type: 'PHISHING' | 'COMPROMISE' | 'BREACH' | 'DDOS' | 'RANSOMWARE' | 'OTHER';
    
    detectedAt: DateTime;
    detectedBy: 'AUTOMATED' | 'USER_REPORT' | 'ADMIN';
    
    description: string;
    affectedSystems: string[];
    affectedUsers: number;
    affectedData: 'NONE' | 'PII' | 'FINANCIAL' | 'CREDENTIALS';
    
    timeline: TimelineEntry[];  // step by step
    
    containedAt: DateTime;
    resolvedAt: DateTime;
    
    rootCause: string;
    actions: Action[];
    lessonsLearned: string;
    
    notifications: {
        sdaia?: { sentAt: DateTime, ref: string },
        users?: { sentAt: DateTime, count: number },
        legal?: { sentAt: DateTime },
        police?: { sentAt: DateTime, ref: string }
    };
    
    cost: {
        downtime: number,
        damage: number,
        recovery: number,
        legal: number
    };
}
```

---

## 📞 Contacts

### Internal:
- **CISO:** (داخلي)
- **DPO:** Data Protection Officer (PDPL)
- **Legal Counsel:** المستشار القانوني
- **Owner:** للقرارات الحرجة

### External:
- **SDAIA (PDPL):** +966-XXX-XXXX
- **CITC (Cybersecurity):** +966-XXX-XXXX
- **Police (Cyber Crimes):** +966-XXX-XXXX
- **NCA (National Cybersecurity Authority):** +966-XXX-XXXX
- **Hetzner Security:** abuse@hetzner.com
- **Cloudflare Security:** abuse@cloudflare.com

### Vendors:
- **Sentry:** للـ error tracking
- **Cloudflare:** للـ DDoS, WAF
- **Penetration Testing Firm:** السعودي

---

## 🎓 Training Schedule

### Monthly:
- Security awareness email
- Phishing simulation
- Best practices reminders

### Quarterly:
- Workshop (1 hour)
- New threats brief

### Annually:
- Full security training (4 hours)
- Incident response drill
- External pen-test report review
