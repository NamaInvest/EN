# توثيق محرك إدارة الشيكات (Cheque Management Engine)

تم إنجاز **المرحلة 23.4** (من وحدة الخزينة والبنوك) والمتعلقة بإدارة دورة حياة الشيكات الآجلة (PDC) والشيكات العادية، لتلبية متطلبات السوق السعودي في إدارة السيولة وحماية الأصول.

## 🛠️ ما تم إنجازه تقنياً:

### 1. دورة حياة الشيك (Cheque Lifecycle)
تم بناء `ChequeManagementEngine` في `src/lib/cheque-management-engine.ts` لإدارة جميع الحالات الممكنة للشيك:
- `PENDING` (قيد الانتظار/آجل).
- `CLEARED` (مُحصّل/مدفوع).
- `BOUNCED` (مرتجع/مرفوض).
- `CANCELLED` (ملغى).

### 2. الربط المحاسبي (Automated Journaling)
يقوم المحرك أوتوماتيكياً باعتراض تغير حالة الشيك وإنشاء قيود يومية تتوافق مع المعايير المحاسبية:
- **عند التحصيل (Cleared):** 
  - في الشيكات الواردة: من حساب (البنك) إلى حساب (شيكات برسم التحصيل - PDC Receivable).
  - في الشيكات الصادرة: من حساب (أوراق الدفع - PDC Payable) إلى حساب (البنك).
- **عند الارتجاع (Bounced):** يتم عكس القيد وإثبات المديونية المرتجعة على العميل، أو الدائنية للمورد.

### 3. نظام التنبيهات (PDC Reminders)
تم تزويد المحرك بدالة `notifyDueCheques()` لتعمل كـ (Cron Job) يومي، تقوم بالبحث عن الشيكات الآجلة التي تستحق خلال الأيام الـ 7 القادمة، وتنبيه أمين الصندوق لاتخاذ الإجراء (إيداع/تحصيل).

### 4. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**1. لتسجيل شيك جديد مستلم من عميل:**
```typescript
import { ChequeManagementEngine } from '@/lib/cheque-management-engine';

await ChequeManagementEngine.registerCheque({
    type: 'INCOMING',
    chequeNumber: 'CHQ-100293',
    amount: 15000,
    currency: 'SAR',
    dueDate: new Date('2026-06-01'),
    partyId: 101, // Customer ID
    bankId: 5, // Bank ID
    tenantId: 'tenant-1'
});
```

**2. لمعالجة تحصيل شيك آجل (يتم عبر واجهة موظف البنك أو الخزينة):**
```typescript
await ChequeManagementEngine.processCheque({
    chequeId: 50,
    newStatus: 'CLEARED',
    bankAccountId: 10, // حساب البنك الفعلي
    tenantId: 'tenant-1',
    userId: 1,
    clearingDate: new Date()
});
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
