# تقرير فحص HR / Payroll / CRM / POS / Portals — Namasoft ERP

**تاريخ:** 2026-05-04 | **عدد المكونات المفحوصة:** 40 (34 موديول + 6 محركات)

---

## 1. الموظفون (HR Employees)
**API:** `src/app/api/hr/employees/route.ts`
**الحالة:** ✅ FULL

**الجاهز:** CRUD + الفروع + IBAN + الراتب
**الفجوات:**
- لا حقل Iqama/National ID صريح
- لا تصنيف Saudi/Expat في schema
- لا End Date للعقد
- لا Active/Resigned/Retired status
- لا Org/Department Hierarchy

---

## 2. حساب الرواتب (Payroll Calculate)
**API:** `src/app/api/hr/payroll/calculate/route.ts`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Overtime/Premium Pay
- لا Retroactive Calculation
- لا Multi-Currency
- لا Cost Center Allocation
- لا Self-Service Portal

---

## 3. توليد مسير الرواتب (Payroll Generate)
**API:** `src/app/api/hr/payroll/generate/route.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا Payment Status Tracking (Submitted/Approved/Rejected)
- لا Batch Management بالبنك
- لا Selective Payroll
- لا Salary Slip PDF
- لا End-to-End Workflow

---

## 4. التأمينات (GOSI)
**API:** `src/app/api/hr/gosi/route.ts` | **Engine:** `src/lib/gosi-engine.ts`
**الحالة:** ✅ FULL

**الجاهز:** معدلات GOSI 2024 + Saudi/Non-Saudi + SANED + Hazards
**الفجوات:**
- لا تحديد جنسية تلقائي (hardcoded)
- لا فئات خاصة (عسكريين)
- لا Batch GOSI File Export
- لا ربط مباشر مع GOSI portal

---

## 5. الإجازات (Leaves)
**API:** `src/app/api/hr/leaves/route.ts` | **Engine:** `src/lib/leave-engine.ts`
**الحالة:** ✅ FULL

**الجاهز:** 11 نوع + Accrual + Carryover + قانون العمل السعودي
**الفجوات:**
- لا Approval Workflow متعدد المستويات
- لا Partial Days
- لا Substitute Assignment
- لا تكامل مع Attendance

---

## 6. الحضور (Attendance)
**API:** `src/app/api/attendance/route.ts` + `face-id/route.ts`
**الحالة:** ✅ FULL (مع ملاحظة)

**الفجوات:**
- Face ID = Mock عشوائي (ليس AI حقيقي)
- لا Overtime tracking
- لا Biometric Integration حقيقي
- لا Real-time GPS
- لا Shift Auto-Assignment

---

## 7. رصيد الإجازات (Leave Balance)
**API:** `src/app/api/hr/leaves/balance/route.ts`
**الحالة:** 🟡 PARTIAL

---

## 8. Accrual الإجازات
**API:** `src/app/api/hr/leaves/accrual/route.ts`
**الحالة:** ✅ FULL

**الفجوات:** لا جدولة تلقائية (Cron)، لا Dry-Run

---

## 9. التدريب (Training)
**API:** `src/app/api/hr/training/route.ts`
**الحالة:** 🔴 STUB

---

## 10. التقييمات (Evaluations)
**API:** `src/app/api/hr/evaluations/route.ts`
**الحالة:** 🔴 STUB

---

## 11. السلف (Loans)
**API:** `src/app/api/hr/loans/route.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:** لا Approval، لا Interest Calc

---

## 12. نهاية الخدمة (EOS)
**API:** `src/app/api/hr/eos/route.ts` | **Engine:** `src/lib/saudi-eos-engine.ts`
**الحالة:** ✅ FULL

**الجاهز:** المواد 84-87 من نظام العمل السعودي
**الفجوات:** لا تسجيل MOL، لا تحويل الإجازات غير المستخدمة

---

## 13. WPS (حماية الأجور)
**API:** `src/app/api/hr/wps/route.ts` | **Engine:** `src/lib/wps-generator.ts`
**الحالة:** ✅ FULL

**الجاهز:** SIF v3 + 17 بنك + Mudad 2026
**الفجوات:** لا Mudad API integration، لا Batch Retry، لا Receipt Tracking

---

## 14. ملف GOSI
**API:** `src/app/api/hr/gosi/file/{route,submit}/route.ts`
**الحالة:** 🟡 PARTIAL

---

## 15. انتهاء صلاحية الوثائق
**API:** `src/app/api/hr/documents/expiry/route.ts` | **Engine:** `src/lib/document-expiry.ts`
**الحالة:** ✅ FULL

**الجاهز:** 16 نوع وثيقة + 4 مستويات تنبيه + Email/WhatsApp
**الفجوات:** لا تكامل مع جهات التجديد، لا Document OCR

---

## 16. صفحة الحضور
**Page:** `src/app/(dashboard)/attendance/page.tsx`
**الحالة:** ✅ FULL

---

## 17. صفحة المناوبات
**Page:** `src/app/(dashboard)/shifts/page.tsx`
**الحالة:** ✅ FULL

---

## 18. CRM Leads
**API:** `src/app/api/crm/leads/route.ts` | **Page:** `src/app/(dashboard)/crm/leads/page.tsx`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Lead Scoring
- لا Activity Timeline
- لا Account/Opportunity Hierarchy
- لا Pipeline Kanban
- لا Forecast by Quarter

---

## 19. WhatsApp
**API:** `src/app/api/crm/whatsapp/*` | **Engine:** Meta Cloud API
**الحالة:** ✅ FULL

**الفجوات:**
- لا Batch Broadcasting إنتاجي
- لا Message Template Manager
- لا Conversation History
- لا Media Upload
- لا Auto-reply Rules

---

## 20-22. WhatsApp Broadcast/Sessions/Webhook
**الحالة:** 🟡 PARTIAL

---

## 23. POS Checkout
**API:** `src/app/api/pos/route.ts` + `checkout/`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Discount Management متقدم
- لا Receipt Printing template
- لا Session Management (open/close cash drawer)
- لا Refund/Return UI
- لا Card Payment Integration
- لا Customer Credit

---

## 24. POS Products
**API:** `src/app/api/pos/products/route.ts`
**الحالة:** 🟡 PARTIAL (لا pagination)

---

## 25. POS Pending Orders
**الحالة:** 🔴 STUB

---

## 26. POS Restaurant Floor
**الحالة:** 🟡 PARTIAL (لا تجميع نهائي)

---

## 27. Fleet Dashboard
**Page:** `src/app/(dashboard)/fleet/page.tsx`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Real-time GPS Tracking
- لا Cost-per-KM Analysis
- لا Driver Assignment
- لا Preventive Maintenance Schedule
- لا Multi-Location

---

## 28-29. Fleet Trips/Fuel
**الحالة:** 🟡 PARTIAL

---

## 30. Portals Parent
**الحالة:** 🟡 PARTIAL

**الفجوات:** لا درجات/غياب، لا رسائل من المدرسة

---

## 31. Portals Tenant
**الحالة:** 🟡 PARTIAL

**الفجوات:** لا دفع، لا فواتير رقمية

---

## 32. B2B Shop
**الحالة:** ✅ FULL (Basic)

**الفجوات:** لا أسعار مخصصة، لا Catalog Management

---

## 33-34. B2B Login/Checkout
**الحالة:** 🟡 PARTIAL

---

## 35. Email
**Engine:** `src/lib/email.ts`
**الحالة:** ✅ FULL (SMTP/SendGrid/SES + Templates)

**الفجوات:** لا Scheduling، لا Tracking، لا Personalization Tags

---

## 36. SMS
**Engine:** `src/lib/sms.ts`
**الحالة:** ✅ FULL (Taqnyat/Unifonic)

**الفجوات:** لا Scheduling، لا Delivery Confirmation

---

## 37. Telegram Bot
**Engine:** `src/lib/telegram-bot.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:** لا Inline Keyboard، لا Command Parser شامل

---

## 38. Hijri Dates
**Engine:** `src/lib/hijri.ts`
**الحالة:** ✅ FULL

---

## 39-40. Subscriptions / Subscription Status
**الحالة:** 🟡 PARTIAL

**الفجوات:** لا Billing Cycle، لا Invoice Generation

---

## ملخص

| الحالة | العدد |
|------|------|
| ✅ FULL | 18 |
| 🟡 PARTIAL | 14 |
| 🔴 STUB | 2 |

## الفجوات الكبرى مقابل الأنظمة العالمية

- **مقابل Workday:** Talent Management، Multi-Currency
- **مقابل SAP HCM:** Cost Center Allocation، Compensation Management
- **مقابل BambooHR:** Employee Self-Service، Org Chart، Performance Management
- **مقابل Salesforce:** Opportunity Pipeline، Forecasts
- **مقابل HubSpot:** Email Automation، Form Builder
- **مقابل Aliphia/DEXEF:** ربط مباشر مع نظام العمل الموحد + رفع تلقائي للحكومة
