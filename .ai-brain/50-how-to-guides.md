# 50 - أدلة "كيف أعمل" (How-To Guides)

> أدلة خطوة-بخطوة للمستخدمين والمطورين

---

## 🛒 كيف أصدر فاتورة B2B؟

### الخطوات:
```
1. الذهاب لـ /sales
2. الضغط "فاتورة جديدة"
3. اختيار العميل:
   - بحث بالاسم أو VAT
   - إذا غير موجود: "إضافة عميل جديد"
     - الاسم، VAT (15 رقم)، CR (10 أرقام)
4. إضافة البنود:
   - مسح الباركود أو بحث
   - الكمية، السعر، الخصم
5. مراجعة الإجماليات:
   - Subtotal
   - VAT (15%)
   - Total
6. تحديد طريقة الدفع وشروطه:
   - نقد / آجل (NET30)
7. حفظ → POSTED
8. النظام تلقائياً:
   - يرسل لـ ZATCA Clearance
   - ينتظر ~5 ثوان
   - يستلم clearance_uuid
9. طباعة الفاتورة A4 مع QR
10. إرسال للعميل (Email / WhatsApp)
```

---

## 💰 كيف أسجّل قيد يدوي؟

```
1. /accounting/journal/new
2. إدخال:
   - التاريخ
   - الوصف
   - بنود متعددة:
     - Account 1: Debit 1000
     - Account 2: Credit 1000
3. التحقق: Dr = Cr ✓
4. حفظ → status: DRAFT
5. إذا المبلغ > 10,000:
   - يحتاج موافقة senior accountant
   - status: PENDING_APPROVAL
6. الموافقة:
   - POST /api/approvals/{id}/approve
   - status: APPROVED
7. الترحيل (Posting):
   - status: POSTED
   - تحديث Account.balance
   - audit log
```

---

## 👤 كيف أضيف موظف جديد؟

```
1. /hr/employees/new
2. البيانات الأساسية:
   - الاسم الرباعي (عربي + إنجليزي)
   - رقم الهوية (سعودي 10 رقم)
   - الجنسية، تاريخ الميلاد، الجنس
3. معلومات العقد:
   - تاريخ التعيين
   - نوع العقد (Permanent/Temporary)
   - المنصب، القسم
   - الراتب الأساسي + البدلات
4. البنك (للـ WPS):
   - اسم البنك (RJHI/SNB/...)
   - IBAN (SA + 22 char)
5. الوثائق:
   - رفع الهوية/الإقامة
   - الجواز
   - الشهادات
6. حفظ → status: ACTIVE
7. النظام:
   - يسجل في GOSI (تلقائياً للسعودي/الخليجي)
   - ينشئ User account
   - يضيف للـ payroll القادم
   - يرسل welcome email
```

---

## 📦 كيف أستلم بضاعة (GRN)؟

```
1. /grn/new
2. اختيار الـ PO:
   - بحث برقم الـ PO أو المورد
3. لكل بند:
   - Quantity Received (الفعلي)
   - Condition: OK / DAMAGED / EXPIRED
   - Batch No (للأدوية/الأغذية)
   - Expiry Date
   - Serial Numbers (للإلكترونيات)
   - Bin (أين خُزن في المستودع)
4. حفظ
5. النظام:
   - يزيد ProductStock
   - StockMovement: GRN
   - JE: Dr Inventory / Cr GR/IR Suspense
   - PO line: receivedQty updated
6. إذا فحص جودة مطلوب:
   - QC Inspection
   - Pass/Fail
   - إذا Fail → إعادة للمورد
```

---

## 💳 كيف أسجل دفعة من عميل؟

```
1. /finance/payments/new
2. اختيار العميل
3. النظام يعرض الفواتير المعلقة (مرتبة بالتاريخ)
4. اختيار:
   - مبلغ الدفعة
   - طريقة الدفع (Cash/Bank Transfer/Check/Card)
   - تخصيص (يدوي أو تلقائي FIFO):
     - فاتورة 1: 5000
     - فاتورة 2: 3000
     - = 8000 SAR
5. حفظ
6. النظام:
   - PaymentTransaction
   - JE: Dr Cash/Bank / Cr AR
   - تحديث Invoice.paidAmount
   - تحديث Invoice.status (PAID / PARTIAL)
   - تحديث Customer.balance
   - إذا الكل دُفع → إغلاق dunning
```

---

## 🏭 كيف أنشئ Manufacturing Order؟

```
1. /manufacturing/orders/new
2. اختيار المنتج النهائي
3. النظام يقترح الـ Recipe (BOM)
4. تحديد الكمية المطلوبة
5. تاريخ الاستحقاق
6. النظام يفحص:
   - المواد الخام المتوفرة
   - قدرة الـ Work Centers
   - إذا نقص → اقتراح PR
7. الإصدار (Release):
   - يحجز المواد
   - يولّد Work Orders للعمليات
8. Material Issue:
   - سحب المواد من المخزون
   - JE: Dr WIP / Cr Raw Materials
9. التنفيذ:
   - تسجيل ساعات العمل
   - تسجيل ساعات الآلة
   - تسجيل الإهدار
10. QC:
    - فحص
    - Pass/Fail
11. الإقفال:
    - JE: Dr Finished Goods / Cr WIP
    - StockMovement: زيادة FG
```

---

## 📊 كيف أحضّر تقرير VAT الشهري؟

```
1. /reports/zatca-vat
2. تحديد الفترة (مثلاً: مايو 2026)
3. النظام يحسب:
   Sales Output VAT:
     - Standard 15%: من كل SalesInvoice
     - Zero-rated: 0%
     - Exempt: 0%
     - Reverse Charge: 15% (self-assessed)
   
   Purchase Input VAT:
     - Standard 15%: من كل PurchaseInvoice
     - Import VAT
     - Reverse Charge Input
4. النتيجة:
   - VAT Collected: 50,000
   - VAT Paid: 30,000
   - Net VAT Payable: 20,000
5. مراجعة المحاسب
6. تقديم لـ ZATCA Portal:
   - رفع التقرير
   - الدفع خلال 30 يوم
7. JE: Dr VAT Payable / Cr Bank
```

---

## 🎁 كيف أحسب EOS لموظف؟

```
1. /hr/employees/{id}/eos
2. إدخال:
   - تاريخ الانتهاء
   - السبب (Resignation/Dismissal/Death)
3. النظام يحسب تلقائياً:
   - Years of Service
   - Article 84-85 calculation
   - تطبيق الـ multiplier حسب السبب
4. عرض التفصيل:
   - Base entitlement (لو فُصل): X
   - Multiplier (حسب السبب): Y
   - Final amount: X × Y = Z
5. التسوية النهائية:
   - راتب آخر شهر
   - مكافأة نهاية الخدمة
   - رصيد الإجازات
   - الـ Loans المتبقية (-)
   - الإجمالي للموظف
6. الموافقة من CFO
7. الصرف:
   - JE: Dr EOS Liability / Cr Bank
   - تحديث Employee.status = TERMINATED
```

---

## 🏦 كيف أعمل Bank Reconciliation؟

```
1. /accounting/bank-recon
2. اختيار البنك والفترة
3. استيراد كشف البنك:
   - رفع CSV/OFX/MT940
   - أو fetch من API (Open Banking)
4. Auto-match:
   - النظام يطابق تلقائياً
   - ~70-80% عادة
5. مراجعة الـ Unmatched:
   - معاملات بنكية بدون قيد:
     - رسوم بنكية → ينشئ JE
     - فوائد → ينشئ JE
   - قيود بدون معاملة:
     - شيك صادر لم يُصرف → Outstanding
     - إيداع لم يصل → In Transit
6. مطابقة يدوية (إذا needed)
7. Finalize:
   - يجب أن يتوازن:
     Book Balance ± Reconciling Items = Bank Balance
8. حفظ
```

---

## 📈 كيف أنشئ ميزانية للقسم؟

```
1. /finance/budget-planning
2. اختيار:
   - السنة المالية
   - القسم (Cost Center)
3. لكل حساب من الـ COA:
   - أضف Monthly target
   - أو import من Excel
4. النظام يحفظ:
   - BudgetLine لكل (account, period, costCenter)
5. خلال السنة:
   - cron يجمع الـ Actual
   - يقارن مع Budget
   - يحسب Variance
6. تقرير Budget Variance:
   - GET /api/reports/budget-variance
   - يعرض:
     - Account
     - Budget
     - Actual
     - Variance
     - % Variance
7. إذا variance > tolerance:
   - إنذار للمدير
   - تحقيق
```

---

## 🌍 كيف أضيف فرع جديد؟

```
1. /branches/new
2. الإدخال:
   - اسم الفرع
   - الموقع، العنوان
   - المدير
   - رقم تسجيلي (لـ ZATCA — كل فرع له قطعة CSID خاصة)
3. النظام:
   - ينشئ Branch
   - ينشئ Stock (مستودع) للفرع
   - يطلب CSID جديد من ZATCA (في الـ background)
4. تكوين:
   - المستخدمين المرتبطين
   - أرقام الترقيم (مثلاً INV-RIY-2026-001)
   - الإعدادات الخاصة (طريقة الدفع، إلخ)
5. اختبار:
   - إصدار فاتورة تجريبية
   - التأكد من ZATCA
6. تفعيل
```

---

## 🇸🇦 كيف أعمل ZATCA Onboarding؟

```
1. /settings/zatca/onboard
2. إدخال:
   - VAT Number
   - CR Number
   - OTP من ZATCA portal
3. النظام:
   a. توليد ECDSA Key Pair
   b. توليد CSR
   c. إرسال لـ ZATCA: /compliance
   d. استلام Compliance CSID
   e. اختبار مع 6 فواتير:
      - 3 B2B (Clearance)
      - 3 B2C (Reporting)
   f. طلب Production CSID
   g. حفظ كل شيء في Settings (مشفر)
4. التحقق:
   - اختبار فاتورة حقيقية
   - التأكد من Clearance
5. Production ready ✓
```

---

## 🔐 كيف أفعّل MFA لمستخدم؟

```
1. المستخدم يدخل بـ Username/Password
2. /profile/security
3. "تفعيل MFA"
4. النظام:
   - يولّد TOTP Secret
   - يعرض QR Code
5. المستخدم:
   - يمسح بـ Google Authenticator / Authy
   - يدخل أول 6-digit code
6. POST /api/auth/mfa/verify
7. النظام:
   - يتحقق من الـ code
   - إذا صحيح: يفعّل MFA
   - يولّد 10 backup codes
   - يعرضها (مرة واحدة فقط!)
8. المستخدم يحفظ الـ backup codes (آمن)
9. من الآن:
   - عند login: يطلب TOTP
   - الـ MFA enforced for sensitive actions
```

---

## 🔄 كيف أنشئ Recurring Invoice؟

```
1. /recurring-invoices/new
2. الإدخال:
   - العميل
   - البنود
   - Frequency: MONTHLY / QUARTERLY / ANNUAL
   - Start Date
   - End Date (أو "ongoing")
3. حفظ
4. cron-trigger-invoices (يومي):
   - يفحص الـ recurring
   - إذا الـ next due date = today
   - يولّد فاتورة عادية
   - JE + ZATCA كالعادي
   - إرسال للعميل
5. تحديث الـ next due date
```

---

## 🚀 كيف أنشر تحديث (للمطورين)؟

```
1. اختبار محلياً:
   npm run validate
   # = typecheck + lint + tests

2. Git:
   git checkout -b feature/x
   git commit -m "feat(module): description"
   git push
   
3. Pull Request:
   - Code review (2+ approvers)
   - CI passes
   - Merge to main

4. النشر:
   ssh root@46.4.188.170
   cd /www/wwwroot/namainvist.com
   git pull
   
5. حسب نوع التغيير:
   # API/lib only:
   node deploy.js --files-only src/...
   
   # UI:
   node deploy.js --build
   
   # Schema:
   node deploy.js --db-push
   
6. Verification:
   curl https://namainvist.com/api/health
   pm2 logs main-site --lines 20
   
7. Monitoring:
   - Sentry لمدة ساعة
   - في حالة errors > threshold → rollback
```

---

## 🔄 كيف أرجع لإصدار سابق (Rollback)؟

```
1. تحديد الـ commit المراد العودة له:
   git log

2. على السيرفر:
   ssh root@46.4.188.170
   cd /www/wwwroot/namainvist.com
   
3. Rollback Code:
   git revert <bad-commit>
   # أو:
   git reset --hard <good-commit>  ⚠️ destructive!
   
4. Rebuild إذا UI:
   npm run build
   
5. Restart:
   pm2 restart main-site
   
6. إذا فيه schema changes:
   # Restore من backup:
   gunzip < /var/backups/.../before-deploy.sql.gz | psql tenant_db
   # ⚠️ خطير، يحتاج planning
   
7. Verification
```

---

## 📞 كيف أتعامل مع شكوى عميل؟

```
1. /support/tickets/new
2. إدخال:
   - العميل
   - الموضوع
   - الوصف
   - الأولوية
   - المرفقات
3. تعيين موظف
4. SLA tracking:
   - Response: 4 ساعات
   - Resolution: 48 ساعة (حسب الأولوية)
5. التواصل:
   - email/WhatsApp
   - phone if needed
6. الحل:
   - تحديد المشكلة
   - الإصلاح
   - تأكيد رضا العميل
7. الإقفال:
   - status: RESOLVED
   - feedback survey
8. متابعة بعد أسبوع:
   - check satisfaction
```

---

## 💼 كيف أعمل Period Close شهري؟

(تفاصيل في `49-scenarios-real-world.md` السيناريو رقم 9)

موجز:
```
1. Pre-close checks (no drafts, GRN matching, etc.)
2. Accruals
3. Prepayments amortization
4. Depreciation
5. FX Revaluation
6. ECL
7. Inventory valuation
8. WHT/GOSI submission
9. Bank Recon
10. AR/AP Aging
11. Trial Balance
12. Statements (P&L, BS, CFS)
13. Notify stakeholders
14. Lock period
```

---

## 🤖 كيف أستخدم AI Copilot؟

```
1. ينقر زر الـ AI (يمين أسفل الشاشة)
2. Chat panel ينفتح
3. اكتب السؤال:
   - "كم مبيعات اليوم؟"
   - "اعطني تقرير المخزون الناقص"
   - "افتح صفحة الفواتير"
4. الـ AI:
   - يفهم النية
   - يستدعي tools المناسبة
   - يعرض النتيجة
5. follow-up questions:
   - "وكم منها نقد؟"
   - "ومن أكبر عميل؟"
6. يمكن طلب أعمال:
   - "أنشئ فاتورة لعميل أحمد بمنتج X كمية 5"
   - يطلب تأكيد قبل التنفيذ
```

---

## 🎯 Best Practices للمستخدمين

### اليومي:
- ✅ فتح Dashboard مع الصباح
- ✅ مراجعة الـ AI CFO Insights
- ✅ متابعة Approvals Inbox
- ✅ تحقق من الـ Notifications
- ✅ إغلاق POS sessions نهاية اليوم

### الأسبوعي:
- ✅ AR Aging review
- ✅ AP scheduling
- ✅ Cash forecast review
- ✅ Inventory check (cycle count)

### الشهري:
- ✅ Period Close
- ✅ Payroll
- ✅ WPS submission
- ✅ GOSI submission
- ✅ WHT Form 14

### الربعي:
- ✅ VAT Return
- ✅ Budget review
- ✅ Vendor scorecards

### السنوي:
- ✅ Year-End Close
- ✅ Zakat Assessment
- ✅ Tax Return
- ✅ Performance Reviews
- ✅ Strategic Planning
