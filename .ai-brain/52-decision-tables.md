# 52 - جداول القرارات (Decision Tables)

> متى أستخدم ماذا؟ — قواعد القرار للحالات الشائعة

---

## 💰 متى VAT 15% vs 0% vs Exempt vs Reverse Charge؟

| الحالة | الفئة | المعدل | الكود |
|---|---|---|---|
| منتج عادي بيع داخل السعودية | Standard | 15% | S |
| تصدير لخارج السعودية | Zero-Rated | 0% | Z |
| النقل الدولي للبضائع | Zero-Rated | 0% | Z |
| الأدوية المعتمدة في SFDA list | Zero-Rated | 0% | Z |
| الذهب الاستثماري (99% نقاء+) | Zero-Rated | 0% | Z |
| الخدمات الصحية (مرخصة MOH) | Exempt | 0% | E |
| الخدمات التعليمية | Exempt | 0% | E |
| الخدمات المالية (فوائد) | Exempt | 0% | E |
| الإيجار السكني | Exempt | 0% | E |
| منح حكومية | Out of Scope | 0% | O |
| تعويضات تأمين | Out of Scope | 0% | O |
| شراء خدمة من مورد أجنبي | Reverse Charge | 15% | RC |
| استيراد بضاعة | Import VAT | 15% | (يدفع للجمارك) |

---

## 👥 متى يحتاج Approval ومن المعتمد؟

| نوع المستند | المبلغ | المعتمد |
|---|---|---|
| **JE** | < 1,000 | المحاسب نفسه |
| **JE** | 1,000-10,000 | Senior Accountant |
| **JE** | 10,000-50,000 | Controller |
| **JE** | 50,000-100,000 | CFO |
| **JE** | > 100,000 | CEO |
| **PO** | < 5,000 | Department Manager |
| **PO** | 5,000-50,000 | CFO |
| **PO** | 50,000-200,000 | CEO |
| **PO** | > 200,000 | Board |
| **PR** | < 1,000 | Direct Supervisor |
| **PR** | 1,000-10,000 | Department Manager |
| **PR** | > 10,000 | (يتحول لـ PO approval) |
| **Vacation** | 1-5 days | Manager |
| **Vacation** | 6-15 days | Manager + HR |
| **Vacation** | > 15 days | CEO |
| **Loan** | < 5,000 | HR Manager |
| **Loan** | 5,000-20,000 | CFO |
| **Loan** | > 20,000 | CEO |
| **Discount** | < 10% | Salesperson |
| **Discount** | 10-20% | Sales Manager |
| **Discount** | > 20% | CFO |
| **Credit Limit** | New customer | CFO |
| **Credit Limit Change** | Any | CFO |
| **New Vendor** | Any | CFO + Compliance |

---

## 📄 متى Credit Note vs Debit Note vs Reversal؟

| الموقف | الإجراء |
|---|---|
| العميل أرجع منتج (الفاتورة POSTED) | **Credit Note** |
| الفاتورة فيها خطأ (لم تُرحّل بعد) | **تعديل مباشر** |
| الفاتورة POSTED مع خطأ في المبلغ (نقص) | **Debit Note** |
| الفاتورة POSTED مع خطأ في المبلغ (زيادة) | **Credit Note** |
| الفاتورة POSTED مع خطأ في حساب | **Reversal Entry** + قيد جديد |
| الفاتورة بعد ZATCA Clearance | ❌ لا تعديل! استخدم Credit Note |
| منتج تالف بعد التسليم | **Credit Note** |
| العميل ألغى الطلب | **Cancel** (إذا DRAFT) أو **Credit Note** (إذا POSTED) |
| تخفيض السعر بعد البيع | **Credit Note** |
| فاتورة مكررة بالخطأ | **Credit Note** + delete duplicate |

---

## 🏦 متى Wire Transfer vs Check vs Cash vs Card؟

| الموقف | الطريقة المفضلة |
|---|---|
| دفع لمورد كبير (> 10K) | Wire Transfer / Check |
| دفع لمورد صغير (< 1K) | Cash |
| دفع رواتب | WPS (Bank Transfer) |
| استلام من عميل (> 5K) | Bank Transfer / Check |
| استلام من POS | Cash / Card |
| دفع للموظفين (Petty Cash) | Cash |
| دفع ضرائب | Bank Transfer |
| دفع للحكومة | SADAD |
| تحويل بين بنوكنا | Internal Transfer |
| دفعة دولية | Wire Transfer (SWIFT) |
| دفعة للأجنبي (مع WHT) | Wire Transfer (مع خصم WHT) |

---

## 📦 متى FIFO vs LIFO vs Average vs Standard Cost؟

| نوع المنتج | الطريقة الموصى بها |
|---|---|
| منتجات قابلة للانتهاء (أدوية، أغذية) | **FEFO** (extension of FIFO) |
| منتجات عادية | **FIFO** (الأكثر استخداماً) |
| منتجات بأسعار متقلبة | **Weighted Average** |
| منتجات معيارية (تصنيع) | **Standard Cost** |
| منتجات فريدة (سيارات، إلكترونيات) | **Serial-based** |
| للضرائب في السعودية | **FIFO** (IFRS-compliant) |

---

## ⏰ متى Daily vs Weekly vs Monthly vs Quarterly؟

### العمليات اليومية:
- ✅ Bank Recon (للحركات الكبيرة)
- ✅ Cash counting
- ✅ POS sessions closing
- ✅ Inventory cycle counts (1-2 SKU/day)
- ✅ AI CFO insights
- ✅ Audit log review

### الأسبوعية:
- ✅ AR Aging
- ✅ AP scheduling
- ✅ Vendor performance review
- ✅ Sales pipeline review

### الشهرية:
- ✅ Period Close
- ✅ Payroll
- ✅ WPS
- ✅ GOSI
- ✅ WHT Form 14
- ✅ Depreciation
- ✅ FX Revaluation
- ✅ ECL provisioning
- ✅ Financial Statements

### الربعية:
- ✅ VAT Return (إذا < 40M revenue)
- ✅ Board Meeting
- ✅ Budget Review
- ✅ Strategic Review

### السنوية:
- ✅ Year-End Close
- ✅ Annual Tax Return
- ✅ Zakat Assessment
- ✅ Audit (External)
- ✅ Performance Reviews
- ✅ Strategic Planning
- ✅ Pen-test (Security)

---

## 🇸🇦 متى B2B Clearance vs B2C Reporting؟

| الموقف | الإرسال |
|---|---|
| العميل شركة (لديه VAT) | **B2B — Clearance** (Synchronous, قبل التسليم) |
| العميل فرد (لا VAT) | **B2C — Reporting** (Async, خلال 24h) |
| العميل شركة لكن < 1000 SAR | يمكن B2C (Simplified) |
| Credit Note | نفس نوع الفاتورة الأصلية |
| Debit Note | نفس نوع الفاتورة الأصلية |
| فاتورة قطاع حكومي | **B2B** دائماً |
| فاتورة إيجار سكني | **B2C** (لأنه exempt من VAT) |

---

## 🎰 متى Hard Delete vs Soft Delete؟

| النموذج | الحذف |
|---|---|
| SalesInvoice (POSTED) | ❌ ممنوع — استخدم Credit Note |
| SalesInvoice (DRAFT) | ✅ Soft Delete |
| JournalEntry (POSTED) | ❌ ممنوع — Reversal |
| Customer (with history) | Soft Delete |
| Customer (no transactions) | Hard Delete possible |
| Product (with sales) | Soft Delete |
| Employee (with payroll) | Soft Delete (status: TERMINATED) |
| User | Soft Delete (مع revoke session) |
| AuditLog | ❌ ممنوع نهائياً |
| Sample/Test data | Hard Delete في dev فقط |

---

## 🏢 متى أحتاج فرع جديد vs قسم vs مركز تكلفة؟

| الكيان | الاستخدام |
|---|---|
| **Branch** | موقع جغرافي مختلف، استقلالية تشغيلية |
| **Department** | تقسيم وظيفي داخل الفرع (Sales, HR, Finance) |
| **Cost Center** | لتتبع المصروفات (per project/team) |
| **Profit Center** | كيان مسؤول عن الربح (line of business) |
| **Project** | مشروع محدد زمنياً |
| **Segment** | بُعد إضافي (geographic, channel) |

### مثال:
- شركة لها 3 branches (Riyadh, Jeddah, Dammam)
- كل branch له 4 departments (Sales, Operations, Finance, HR)
- كل department هو Cost Center
- Sales department + Operations = Profit Center (Retail)
- بعض الـ campaigns = Projects
- الـ Online vs Retail = Segments

---

## 💵 متى Capitalize vs Expense؟

| المصروف | المعالجة |
|---|---|
| إصلاح بسيط للسيارة | **Expense** (Maintenance) |
| تجديد كامل للسيارة (يطيل العمر) | **Capitalize** (يُضاف للأصل) |
| استبدال إطارات | **Expense** |
| استبدال محرك | **Capitalize** |
| طلاء جديد للمبنى | **Expense** (Maintenance) |
| إضافة طابق جديد | **Capitalize** |
| شراء أصل > 5000 SAR | **Capitalize** (الحد الأدنى للـ Fixed Asset) |
| شراء أصل < 5000 SAR | **Expense** (Supplies) |
| تدريب موظف | **Expense** |
| ترخيص برمجي (سنوي) | **Prepaid** (يستهلك على 12 شهر) |
| موقع إلكتروني (تطوير) | **Capitalize** (إذا > 5 سنوات استخدام) |

---

## 🇸🇦 متى GOSI Saudi vs GCC vs Expat؟

| الموظف | الاشتراك |
|---|---|
| سعودي + GOSI subject | 10% emp + 12% empl |
| سعودي بدون GOSI (مدير عام، إلخ) | 0% — معفى |
| خليجي (GCC) | 9% emp + 11% empl |
| أجنبي مقيم | 0% emp + 2% empl (Hazards) |
| موظف بعمر < 18 | 0% — لا اشتراك |
| موظف بعمر > 60 | حسب الحالة |

---

## 🎁 متى EOS كامل vs مخفض؟

### Article 84 (الكامل):
- ✅ تسريح من قبل المنشأة
- ✅ وفاة
- ✅ عجز
- ✅ نهاية عقد محدد المدة
- ✅ تقاعد

### Article 85 (مخفض):
- < 2 سنة: لا EOS (resignation)
- 2-5 سنوات: 1/3 المستحق
- 5-10 سنوات: 2/3 المستحق
- 10+ سنوات: كامل

---

## 📊 متى ZATCA Phase 1 QR vs Phase 2؟

| الفاتورة | الـ QR |
|---|---|
| كل الفواتير منذ ديسمبر 2021 | **Phase 1** (5 TLV tags) |
| كل الفواتير منذ يناير 2023 | **Phase 2** (9 TLV tags + signed) |
| فاتورة POS سريعة (offline) | **Phase 1** (وقت لاحق يُحدّث Phase 2) |
| فاتورة B2B Clearance | **Phase 2** (متطلب) |
| فاتورة B2C Reporting | **Phase 2** (متطلب) |

---

## 🤖 متى AI vs Rule-based؟

| المهمة | الأفضل |
|---|---|
| حساب VAT | **Rule-based** (دقة 100% مطلوبة) |
| تطبيق Loyalty | **Rule-based** |
| Approval workflow | **Rule-based** |
| توقع المبيعات | **AI** (Statistical/ML) |
| كشف الاحتيال | **Hybrid** (Rules + AI) |
| تصنيف معاملات بنكية | **AI** (Gemini) |
| OCR للفواتير | **AI** (Gemini Vision) |
| Bank Reconciliation auto-match | **Hybrid** |
| Customer support chatbot | **AI** (RAG) |
| Sales coaching | **AI** (Personalized) |

---

## 🔐 متى MFA إجباري؟

| الإجراء | MFA |
|---|---|
| Login admin/CFO | ✅ إجباري |
| Login regular user | ⚠️ Recommended |
| Post JE > 100K | ✅ |
| Approve Payment Run | ✅ |
| Add/Remove user permissions | ✅ |
| Change tax settings | ✅ |
| ZATCA onboarding | ✅ |
| Delete customer/vendor | ✅ |
| Period close | ✅ |
| Issue desktop license | ✅ |

---

## 🎯 متى Cash vs Credit (للعملاء)؟

### Cash:
- ✅ عميل جديد
- ✅ مبلغ < threshold
- ✅ عميل في Credit Hold
- ✅ POS (افتراضي)

### Credit (Net 30/60/90):
- ✅ عميل معتمد + tested
- ✅ شركات كبيرة (B2B)
- ✅ عقود استراتيجية
- ✅ ضمن الـ credit limit
- ✅ historical good payment behavior

### Credit Limit Calculation:
```
Credit Limit = Min(
    Annual Sales Volume × 0.1,  // 10% من المبيعات السنوية
    Customer Equity × 0.05,      // 5% من حقوق ملكية العميل
    Maximum Allowed (per industry)
)
```

---

## 🇸🇦 متى أرفع لـ ZATCA / Mudad / GOSI؟

### ZATCA:
- **Reporting (B2C):** خلال 24 ساعة
- **Clearance (B2B):** قبل التسليم (immediate)
- **VAT Return:** شهرياً (>40M revenue) أو ربعياً
- **Form 14 (WHT):** شهرياً، خلال 10 أيام
- **Zakat:** سنوياً، خلال 120 يوم من نهاية السنة المالية

### Mudad (WPS):
- **SIF File:** قبل الـ 5 من الشهر التالي
- **العقوبة:** غرامات + حظر تأشيرات

### GOSI:
- **Monthly File:** قبل الـ 15 من الشهر التالي
- **Dispute:** خلال 30 يوم

### Qiwa:
- **عقد جديد:** خلال 7 أيام من بدء العمل
- **إنهاء:** فوراً عند الـ termination
- **تغيير المهنة:** عبر الـ portal

---

## 🎯 خلاصة: قاعدة ذهبية

### في أي قرار:
1. **اتبع الـ Decision Table** أولاً
2. **استشر CPA** للمحاسبيات الحساسة
3. **استشر Legal** للقانونيات
4. **استشر CFO** للماليات
5. **اقرأ الـ Brain** قبل الإنشاء
6. **اختبر في staging** قبل production
7. **سجل في Audit Log**
8. **تواصل** عند الشك
