# توثيق محرك إدارة السلف والقروض (Employee Loans Engine)

تم إنجاز **المرحلة 27.1** (من وحدة الرواتب - Payroll) والمسؤولة عن حوكمة وأتمتة طلبات السلف والقروض للموظفين، وتتبع عمليات السداد والاقتطاع الشهري.

## 🛠️ ما تم إنجازه تقنياً:

### 1. طلب القرض وتحديد الأقساط (Loan Request)
من خلال `requestLoan`، يقوم النظام باحتساب القسط الشهري الثابت (Monthly Installment) بناءً على إجمالي المبلغ وعدد الأشهر المدخلة، ويحتفظ بالقرض في حالة `PENDING`. 
تم استخدام مكتبة `decimal.js` في خلفية المعالجة لمنع أي أخطاء حسابية تخص الهللات.

### 2. الصرف والقيد المحاسبي (Disbursement)
عند اعتماد السلفة `approveAndDisburse`، تتحول الحالة إلى `ACTIVE`، ويقوم المحرك تلقائياً بإصدار القيد المحاسبي المالي:
- **(Dr. Employee Advances)**
- **(Cr. Bank/Cash)**

### 3. الاقتطاع الشهري الآلي (Auto-Deduction)
أهم ميزة هي دالة `processMonthlyDeduction`. 
هذه الدالة صُممت لتُستدعى تلقائياً من قبل "محرك الرواتب (Payroll Run Engine)" أثناء إغلاق مسير راتب الشهر.
- تبحث الدالة عن القروض النشطة للموظف.
- تقطع القسط الشهري ولا تتجاوز الرصيد المتبقي أبداً.
- تُسجل الدفعة في جدول `loanInstallmentPayment`.
- تُنقص الرصيد، وإذا وصل للصفر يتحول القرض لـ `SETTLED`.

### 4. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**لطلب سلفة لموظف:**
```typescript
import { EmployeeLoanEngine } from '@/lib/employee-loan-engine';

await EmployeeLoanEngine.requestLoan({
    employeeId: 305,
    amount: 15000,
    installmentsCount: 10,
    startDate: new Date('2026-06-01'), // يبدأ الخصم من راتب يونيو
    purpose: 'سلفة زواج',
    tenantId: 'tenant-1',
    requestedById: 305
});
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
