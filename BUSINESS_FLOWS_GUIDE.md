# دليل الفلوهات (Business Flows) المطلوبة للنظام
# Business Flows & Workflow Diagrams Guide

> **لماذا الفلوهات ضرورية؟**
> البرومنت يقول "ماذا" تبني، الفلو يقول "كيف يعمل". بدون فلو واضح:
> - المطورون يبنون كود غير متناسق
> - المحاسب لا يعرف متى يدخل البيانات
> - العميل لا يعرف الخطوة التالية
> - المراجع لا يستطيع التدقيق

---

## 📋 الفلوهات الـ 18 الأساسية التي تحتاجها

### مجموعة A: العمليات التجارية الرئيسية (Business Processes)
1. **Quote-to-Cash** (دورة المبيعات الكاملة)
2. **Procure-to-Pay** (دورة المشتريات الكاملة)
3. **Hire-to-Retire** (دورة الموظف من التعيين للترك)
4. **Record-to-Report** (دورة المحاسبة من القيد للتقرير)
5. **Plan-to-Produce** (دورة الإنتاج)
6. **Acquire-to-Retire (Assets)** (دورة الأصل من الشراء للتخريد)
7. **Order-to-Cash POS** (دورة بيع نقاط البيع)

### مجموعة B: فلوهات الموافقات (Approval Workflows)
8. **Journal Entry Approval Flow**
9. **Purchase Order Approval Flow**
10. **Vendor Onboarding Approval Flow**
11. **Leave Request Approval Flow**

### مجموعة C: فلوهات الحالات (State Machines)
12. **Invoice Lifecycle States**
13. **Manufacturing Order States**
14. **Check Lifecycle**
15. **Fixed Asset Lifecycle**

### مجموعة D: فلوهات الإقفال والامتثال
16. **Period Close Flow**
17. **ZATCA E-Invoice Submission Flow**
18. **WPS Salary Submission Flow**

---

## 🎨 الفلو رقم 1: Quote-to-Cash (دورة المبيعات)

```mermaid
flowchart TD
    A[عميل محتمل Lead] --> B{مهتم؟}
    B -- لا --> Z1[Lost - أرشيف]
    B -- نعم --> C[فرصة Opportunity]
    C --> D[عرض سعر Quotation]
    D --> E{موافق على السعر؟}
    E -- لا --> D2[تعديل عرض السعر]
    D2 --> E
    E -- نعم --> F[طلب بيع Sales Order]
    F --> G{المخزون متوفر؟}
    G -- لا --> G1[طلب شراء/إنتاج]
    G1 --> G
    G -- نعم --> H[حجز المخزون Reserve]
    H --> I[إذن صرف Delivery Note]
    I --> J[فاتورة بيع Sales Invoice]
    J --> J2[ZATCA Sign + QR]
    J2 --> K[القيد المحاسبي:<br/>DR: AR/Cash<br/>CR: Revenue + VAT]
    K --> L{تم الدفع؟}
    L -- لا --> L1[فاتورة مفتوحة AR]
    L1 --> M[متابعة Dunning]
    M --> L
    L -- جزئي --> N[سند قبض جزئي]
    N --> L
    L -- نعم كاملاً --> O[سند قبض كامل]
    O --> P[إغلاق Open Item]
    P --> END[انتهت الدورة ✓]
```

---

## 🎨 الفلو رقم 2: Procure-to-Pay (دورة المشتريات)

```mermaid
flowchart TD
    A[طلب شراء داخلي PR] --> B{موافقة المدير؟}
    B -- لا --> Z[رفض]
    B -- نعم --> C{المبلغ > 50,000؟}
    C -- نعم --> C1[موافقة المدير المالي]
    C1 --> D
    C -- لا --> D[طلب عروض أسعار RFQ]
    D --> E[استلام عروض الموردين]
    E --> F[مقارنة العروض Quote Comparison]
    F --> G[اختيار المورد]
    G --> H[أمر شراء PO]
    H --> I[إرسال للمورد]
    I --> J[استلام البضاعة GRN]
    J --> J1{فحص الجودة QC؟}
    J1 -- فشل --> J2[مرتجع للمورد]
    J1 -- نجح --> K[إثبات المخزون<br/>DR: Inventory<br/>CR: GR/IR]
    K --> L[فاتورة المورد]
    L --> M[Three-Way Match]
    M --> M1{متطابق؟}
    M1 -- لا --> M2[Hold للمراجعة]
    M2 --> M
    M1 -- نعم --> N[ترحيل الفاتورة<br/>DR: GR/IR<br/>CR: AP]
    N --> O[انتظار تاريخ الاستحقاق]
    O --> P[Payment Run]
    P --> Q[سند صرف]
    Q --> R[القيد:<br/>DR: AP<br/>CR: Bank]
    R --> END[انتهت الدورة ✓]
```

---

## 🎨 الفلو رقم 3: Hire-to-Retire (دورة الموظف)

```mermaid
flowchart TD
    A[نشر إعلان وظيفي] --> B[استقبال طلبات]
    B --> C[فرز السير الذاتية]
    C --> D[مقابلات]
    D --> E{قبول؟}
    E -- لا --> Z1[رفض]
    E -- نعم --> F[عرض عمل Offer Letter]
    F --> G[توقيع العقد]
    G --> H[Onboarding<br/>- Iqama<br/>- مستندات<br/>- بنك<br/>- GOSI تسجيل]
    H --> I[إنشاء سجل الموظف]
    I --> J[تعيين راتب وبدلات]
    J --> K[العمل اليومي:<br/>- حضور<br/>- أداء<br/>- إجازات]
    K --> L[رواتب شهرية]
    L --> L1[GOSI خصم]
    L --> L2[Loans خصم]
    L --> L3[Net Salary]
    L3 --> M[WPS File Generation]
    M --> N[تحويل البنك]
    N --> O[Payslip]
    O --> P{استمرار؟}
    P -- نعم --> K
    P -- استقالة/انتهاء --> Q[End of Service Calculation]
    Q --> R[تسوية نهائية:<br/>- EOS<br/>- إجازات متراكمة<br/>- خصم سلف<br/>- رواتب مستحقة]
    R --> S[إخراج من GOSI]
    S --> T[إغلاق سجل الموظف]
    T --> END[انتهت الدورة ✓]
```

---

## 🎨 الفلو رقم 4: Record-to-Report (المحاسبة)

```mermaid
flowchart TD
    A[المعاملات اليومية] --> A1[فواتير بيع]
    A --> A2[فواتير شراء]
    A --> A3[سندات قبض/صرف]
    A --> A4[حركات مخزون]
    A --> A5[رواتب]
    A --> A6[إهلاك أصول]
    
    A1 --> B[Auto-Journal Engine]
    A2 --> B
    A3 --> B
    A4 --> B
    A5 --> B
    A6 --> B
    
    B --> C[General Ledger - GL]
    
    D[قيود يدوية Manual JE] --> D1{موافقة؟}
    D1 -- لا --> Z[Pending]
    D1 -- نعم --> C
    
    C --> E{نهاية الفترة؟}
    E -- لا --> A
    E -- نعم --> F[Period Close Process]
    
    F --> F1[1. توقف القيود الفرعية]
    F1 --> F2[2. FX Revaluation]
    F2 --> F3[3. Allocations Run]
    F3 --> F4[4. Depreciation Run]
    F4 --> F5[5. Accruals]
    F5 --> F6[6. Sub-ledger Match]
    F6 --> F7[7. Closing Entries]
    F7 --> F8[8. قفل الفترة]
    
    F8 --> G[التقارير المالية]
    G --> G1[Trial Balance]
    G --> G2[Balance Sheet]
    G --> G3[Income Statement]
    G --> G4[Cash Flow]
    G --> G5[Statement of Equity]
    G --> G6[Notes]
    
    G1 --> H[مراجعة المحاسب]
    G2 --> H
    G3 --> H
    G4 --> H
    G5 --> H
    G6 --> H
    
    H --> END[تقارير معتمدة ✓]
```

---

## 🎨 الفلو رقم 5: Plan-to-Produce (الإنتاج)

```mermaid
flowchart TD
    A[Sales Forecast] --> B[Master Production Schedule MPS]
    B --> C[MRP Run]
    C --> D{المواد متوفرة؟}
    D -- لا --> D1[Purchase Requisition]
    D1 --> D2[دورة الشراء]
    D2 --> E
    D -- نعم --> E[Manufacturing Order MO]
    E --> F[Capacity Check]
    F --> G[Schedule على Work Centers]
    G --> H[Release MO]
    H --> I[Issue Materials<br/>DR: WIP<br/>CR: Inventory]
    I --> J[Production Process]
    J --> K[Labor Tracking]
    J --> L[Machine Hours]
    J --> M[Quality Inspection]
    M --> M1{Pass؟}
    M1 -- لا --> M2[Rework or Scrap]
    M1 -- نعم --> N[Receive Finished Goods<br/>DR: FG Inventory<br/>CR: WIP]
    N --> O[Variance Analysis<br/>Actual vs Standard]
    O --> P[Close MO]
    P --> END[منتج جاهز للبيع ✓]
```

---

## 🎨 الفلو رقم 6: Acquire-to-Retire (الأصول الثابتة)

```mermaid
flowchart TD
    A[CapEx Approval] --> B[Purchase Order للأصل]
    B --> C[استلام الأصل GRN]
    C --> D{قابل للاستخدام مباشرة؟}
    D -- لا --> D1[CWIP - Capital Work in Progress]
    D1 --> D2[إضافة تكاليف لاحقة:<br/>- Installation<br/>- Testing]
    D2 --> D3{مكتمل؟}
    D3 -- لا --> D2
    D3 -- نعم --> E[Capitalize<br/>DR: Fixed Asset<br/>CR: CWIP]
    D -- نعم --> E
    E --> F[Asset Master Record]
    F --> G[تحديد:<br/>- طريقة الإهلاك<br/>- العمر الإنتاجي<br/>- Salvage Value<br/>- Custodian]
    G --> H[Monthly Depreciation Run<br/>DR: Dep Expense<br/>CR: Accum Dep]
    H --> I{أحداث؟}
    I -- صيانة --> I1[Capitalize or Expense?]
    I1 --> H
    I -- نقل --> I2[Asset Transfer]
    I2 --> H
    I -- انخفاض قيمة --> I3[Impairment Test<br/>DR: Impairment Loss]
    I3 --> H
    I -- إعادة تقييم --> I4[Revaluation<br/>OCI Surplus]
    I4 --> H
    I -- استمرار --> H
    I -- نهاية العمر --> J[Disposal Decision]
    J --> J1{نوع التخلص؟}
    J1 -- بيع --> K1[Sale<br/>DR: Cash + Accum Dep<br/>CR: Asset + Gain]
    J1 -- خردة --> K2[Scrap<br/>DR: Accum Dep + Loss<br/>CR: Asset]
    J1 -- تبرع --> K3[Donation]
    K1 --> END[الأصل مغلق ✓]
    K2 --> END
    K3 --> END
```

---

## 🎨 الفلو رقم 7: POS (نقاط البيع)

```mermaid
flowchart TD
    A[العميل عند الكاشير] --> B[فتح Shift]
    B --> B1[Starting Cash]
    B1 --> C[إضافة منتجات]
    C --> C1[Scan Barcode أو بحث]
    C1 --> D{نقاط ولاء؟}
    D -- نعم --> D1[تطبيق نقاط]
    D --> E{كوبون؟}
    E -- نعم --> E1[تطبيق كوبون]
    E --> F[حساب الإجمالي + VAT]
    F --> G[Payment]
    G --> G1[Cash]
    G --> G2[Mada/Card]
    G --> G3[STC Pay]
    G --> G4[Multi-payment]
    G1 --> H[طباعة الإيصال]
    G2 --> H
    G3 --> H
    G4 --> H
    H --> H1[ZATCA QR Code]
    H1 --> I[تقليص المخزون<br/>StockMovement out]
    I --> J[Auto Journal:<br/>DR: Cash/Card<br/>CR: Revenue + VAT]
    J --> K{نهاية الوردية؟}
    K -- لا --> A
    K -- نعم --> L[Close Shift]
    L --> L1[Counted Cash]
    L1 --> L2[Reconciliation]
    L2 --> L3{Match؟}
    L3 -- لا --> L4[Cash Variance Report]
    L3 -- نعم --> M[إيداع في الخزينة]
    L4 --> M
    M --> END[وردية مغلقة ✓]
```

---

## 🎨 الفلو رقم 8: Journal Entry Approval

```mermaid
flowchart TD
    A[مستخدم ينشئ JE] --> B[Save as Draft]
    B --> C{Auto-balance check}
    C -- غير متوازن --> C1[خطأ - أعد المحاولة]
    C1 --> A
    C -- متوازن --> D{المبلغ}
    D -- < 5,000 --> E[Auto-approve]
    D -- 5,000-50,000 --> F[Send to Manager]
    D -- > 50,000 --> G[Send to CFO]
    F --> F1{موافقة المدير؟}
    F1 -- رفض --> Z[Reject + Comment]
    F1 -- موافقة --> H
    G --> G1{موافقة CFO؟}
    G1 -- رفض --> Z
    G1 -- موافقة --> H
    H[Status: Approved]
    H --> I[Post to GL]
    I --> J[Update Account Balances]
    J --> K[Audit Log Entry]
    K --> END[JE ترحل ✓]
    E --> I
    Z --> A
```

---

## 🎨 الفلو رقم 9: Period Close

```mermaid
flowchart TD
    Start([بداية إغلاق الفترة]) --> A[Day -3: Pre-Close Notification]
    A --> B[Day -2: تجميد المعاملات الفرعية]
    B --> B1[إغلاق POs الجديدة]
    B --> B2[إغلاق GRNs]
    B --> B3[إغلاق فواتير]
    B1 --> C
    B2 --> C
    B3 --> C
    C[Day -1: مراجعة الفواتير المعلقة]
    C --> D[Day 0: بدء الإقفال]
    D --> E[1. Bank Reconciliation]
    E --> F[2. AR Reconciliation]
    F --> G[3. AP Reconciliation]
    G --> H[4. Inventory Count]
    H --> I[5. Fixed Asset Verification]
    I --> J[6. FX Revaluation]
    J --> J1[Foreign Balance × Closing Rate]
    J1 --> J2[Post FX Gain/Loss]
    J2 --> K[7. Allocations Run]
    K --> K1[Overhead → Cost Centers]
    K1 --> L[8. Depreciation Run]
    L --> M[9. Accruals]
    M --> M1[Salaries Accrual]
    M --> M2[Utilities Accrual]
    M --> M3[Interest Accrual]
    M1 --> N
    M2 --> N
    M3 --> N
    N[10. Reclassifications]
    N --> O{Year-End؟}
    O -- نعم --> P1[Closing Entries:<br/>Revenue → Income Summary<br/>Expenses → Income Summary<br/>Income Summary → Retained Earnings]
    O -- لا --> P2[Skip]
    P1 --> Q
    P2 --> Q
    Q[11. Sub-ledger to GL Match]
    Q --> R{التطابق؟}
    R -- لا --> R1[Investigate Differences]
    R1 --> Q
    R -- نعم --> S[12. Trial Balance Check]
    S --> S1{Balanced؟}
    S1 -- لا --> S2[خطأ في النظام!]
    S2 --> Stop([توقف])
    S1 -- نعم --> T[13. Generate Reports]
    T --> U[14. CPA Review]
    U --> V[15. CFO Approval]
    V --> W[16. Hard Lock Period]
    W --> END[الفترة مغلقة ✓]
```

---

## 🎨 الفلو رقم 10: ZATCA E-Invoice

```mermaid
flowchart TD
    A[إنشاء فاتورة بيع] --> B[احسب الإجمالي + VAT]
    B --> C[توليد UUID]
    C --> D[احسب ICV<br/>Invoice Counter Value]
    D --> E[احصل على PIH<br/>Previous Invoice Hash]
    E --> F[توليد QR Code TLV]
    F --> G[توليد UBL 2.1 XML]
    G --> H[Cryptographic Signing]
    H --> H1{B2B/B2C؟}
    H1 -- B2B Standard --> I1[Clearance Mode<br/>Real-time submission]
    H1 -- B2C Simplified --> I2[Reporting Mode<br/>خلال 24 ساعة]
    I1 --> J1[إرسال إلى ZATCA API]
    J1 --> K1{موافقة ZATCA؟}
    K1 -- مرفوضة --> K1R[تصحيح وإعادة الإرسال]
    K1R --> J1
    K1 -- مقبولة --> L1[تحديث Status: CLEARED]
    L1 --> M[طباعة الفاتورة مع QR]
    I2 --> J2[Queue للإرسال]
    J2 --> K2[إرسال خلال 24h]
    K2 --> L2[تحديث Status: REPORTED]
    L2 --> M
    M --> N[تخزين في ZATCARecord]
    N --> O[تحديث PIH للفاتورة التالية]
    O --> END[الفاتورة معتمدة ✓]
```

---

## 🎨 الفلو رقم 11: WPS Salary Submission

```mermaid
flowchart TD
    A[نهاية الشهر] --> B[Run Payroll Calculation]
    B --> C[لكل موظف:]
    C --> D[احسب Gross Salary]
    D --> E[خصم GOSI 9%]
    E --> F[خصم Loans/Advances]
    F --> G[خصم أخرى]
    G --> H[Net Salary]
    H --> I[تجميع كل الموظفين]
    I --> J[توليد WPS SIF File]
    J --> J1[Header: Company info]
    J --> J2[Records: Employee + IBAN + Amount]
    J --> J3[Trailer: Hash + Total]
    J1 --> K[رفع على Mudad Portal]
    J2 --> K
    J3 --> K
    K --> L{موافقة Mudad؟}
    L -- مرفوض --> L1[تصحيح ومحاولة مرة أخرى]
    L1 --> J
    L -- مقبول --> M[إرسال للبنك]
    M --> N[تحويل الرواتب للموظفين]
    N --> O[Generate Payslips]
    O --> P[إرسال Payslip بالإيميل]
    P --> Q[Auto Journal:<br/>DR: Salary Expense<br/>CR: Bank<br/>CR: GOSI Payable]
    Q --> END[الرواتب صرفت ✓]
```

---

## 🎨 الفلو رقم 12: Invoice State Machine

```mermaid
stateDiagram-v2
    [*] --> Draft: إنشاء جديد
    Draft --> PendingApproval: Submit
    Draft --> Cancelled: Cancel
    PendingApproval --> Approved: موافقة
    PendingApproval --> Rejected: رفض
    Rejected --> Draft: Edit & Resubmit
    Approved --> Posted: Post to GL
    Posted --> ZATCA_Pending: ZATCA Submit
    ZATCA_Pending --> ZATCA_Cleared: Cleared
    ZATCA_Pending --> ZATCA_Failed: Failed
    ZATCA_Failed --> ZATCA_Pending: Retry
    ZATCA_Cleared --> PartiallyPaid: Partial Payment
    ZATCA_Cleared --> FullyPaid: Full Payment
    PartiallyPaid --> FullyPaid: Final Payment
    FullyPaid --> [*]: Closed
    Posted --> Reversed: Issue Credit Note
    Reversed --> [*]
    Cancelled --> [*]
```

---

## 🎨 الفلو رقم 13: Manufacturing Order States

```mermaid
stateDiagram-v2
    [*] --> Planned: Create MO
    Planned --> Released: Release
    Planned --> Cancelled: Cancel
    Released --> InProgress: Start Production
    InProgress --> OnHold: Issue
    OnHold --> InProgress: Resume
    InProgress --> QualityCheck: Production Done
    QualityCheck --> Completed: Pass QC
    QualityCheck --> Rework: Fail QC
    Rework --> InProgress: Restart
    Completed --> Closed: Close MO
    Cancelled --> [*]
    Closed --> [*]
```

---

## 🎨 الفلو رقم 14: Bank Reconciliation

```mermaid
flowchart TD
    A[استلام كشف بنك] --> B[Import File<br/>MT940/CAMT/CSV]
    B --> C[Parse Transactions]
    C --> D[مقارنة مع GL]
    D --> E[Auto-Match Engine]
    E --> E1[Exact Amount + Date Match]
    E --> E2[Reference Match]
    E --> E3[AI Fuzzy Match - Gemini]
    E1 --> F{مطابق 100%؟}
    E2 --> F
    E3 --> F
    F -- نعم --> G[Mark as Matched]
    F -- لا --> H[Pending Manual Review]
    H --> I[المحاسب يراجع]
    I --> I1{نوع المعاملة؟}
    I1 -- رسوم بنكية --> I2[Post Bank Charges]
    I1 -- فوائد --> I3[Post Interest Income]
    I1 -- تحويل غير معروف --> I4[Suspense Account]
    I1 -- خطأ --> I5[Adjustment Entry]
    I2 --> J
    I3 --> J
    I4 --> J
    I5 --> J
    G --> J[تحديث Reconciliation]
    J --> K{كل المعاملات matched؟}
    K -- لا --> H
    K -- نعم --> L[Generate Reconciliation Report]
    L --> M[CFO Sign-off]
    M --> END[Reconciliation مكتملة ✓]
```

---

## 🎨 الفلو رقم 15: Customer Onboarding

```mermaid
flowchart TD
    A[طلب اشتراك جديد] --> B[Sign-up Form]
    B --> C[Email Verification]
    C --> D[OTP Phone Verification]
    D --> E[KYC Documents Upload<br/>- CR<br/>- VAT Certificate<br/>- ID]
    E --> F{المستندات موافق عليها؟}
    F -- لا --> F1[طلب توضيح]
    F1 --> E
    F -- نعم --> G[إنشاء Tenant DB]
    G --> H[Setup Wizard]
    H --> H1[Company Info]
    H --> H2[Chart of Accounts]
    H --> H3[Branches]
    H --> H4[Initial Users]
    H1 --> I
    H2 --> I
    H3 --> I
    H4 --> I
    I[Initial Data Import<br/>- Customers<br/>- Vendors<br/>- Products]
    I --> J[ZATCA Onboarding<br/>CSR + CSID]
    J --> K[Training Session]
    K --> L[Go Live]
    L --> M[Support Channel Setup]
    M --> END[العميل نشط ✓]
```

---

## 🎨 الفلو رقم 16: Approval Routing Engine

```mermaid
flowchart TD
    A[Document Submitted] --> B[Approval Engine]
    B --> C[تحديد ApprovalRule]
    C --> D{نوع المستند؟}
    D -- JE --> E1[JE Rules]
    D -- PO --> E2[PO Rules]
    D -- Salary --> E3[Salary Rules]
    D -- Asset Disposal --> E4[Asset Rules]
    E1 --> F[احسب المبلغ + Cost Center]
    E2 --> F
    E3 --> F
    E4 --> F
    F --> G[تحديد Approval Levels]
    G --> H[Send to Level 1]
    H --> I{استجابة؟}
    I -- موافقة --> J{المستوى الأخير؟}
    I -- رفض --> Z[Notify Requester]
    I -- timeout 24h --> Y[Escalate to Manager]
    Y --> H
    J -- لا --> K[Next Level]
    K --> H
    J -- نعم --> L[Final Approved]
    L --> M[Execute Document]
    M --> END[تم ✓]
    Z --> END2[مرفوض]
```

---

## 🎨 الفلو رقم 17: Three-Way Matching

```mermaid
flowchart TD
    A[Vendor Invoice Received] --> B[OCR/Manual Entry]
    B --> C[Find Linked PO]
    C --> D{PO موجود؟}
    D -- لا --> Z1[Hold - PO Required]
    D -- نعم --> E[Find Linked GRNs]
    E --> F{GRN موجود؟}
    F -- لا --> Z2[Hold - Goods Not Received]
    F -- نعم --> G[Compare 3 Documents]
    G --> H{السعر:<br/>PO vs Invoice}
    H -- ضمن tolerance --> I
    H -- خارج tolerance --> Z3[Hold - Price Variance]
    I{الكمية:<br/>GRN vs Invoice}
    I -- ضمن tolerance --> J
    I -- خارج tolerance --> Z4[Hold - Qty Variance]
    J{الإجمالي:<br/>صحيح؟}
    J -- نعم --> K[Auto-Approve]
    J -- لا --> Z5[Hold - Total Mismatch]
    K --> L[Post to AP<br/>DR: GR/IR<br/>CR: AP]
    L --> END[مطابقة كاملة ✓]
    Z1 --> M[Manual Review]
    Z2 --> M
    Z3 --> M
    Z4 --> M
    Z5 --> M
    M --> M1{قبول الفرق؟}
    M1 -- نعم --> K
    M1 -- لا --> N[Vendor Dispute]
    N --> END2[نزاع]
```

---

## 🎨 الفلو رقم 18: Architecture Flow (نظرة عامة)

```mermaid
flowchart LR
    subgraph "Frontend"
        UI[Next.js Pages]
        Mobile[PWA Mobile]
        POS[POS Terminal]
    end
    
    subgraph "API Layer"
        API[Next.js API Routes]
        Auth[Clerk Auth]
        AI[AI Layer - Gemini]
    end
    
    subgraph "Business Logic"
        AutoJ[Auto-Journal Engine]
        Approval[Approval Engine]
        Numbering[Numbering Engine]
        Period[Period Close Engine]
        FX[FX Revaluation]
        Tax[Tax Engine]
    end
    
    subgraph "Data Layer"
        Prisma[Prisma ORM]
        Master[Master DB]
        Tenant1[Tenant 1 DB]
        Tenant2[Tenant 2 DB]
        TenantN[Tenant N DB]
    end
    
    subgraph "External Services"
        ZATCA[ZATCA API]
        WhatsApp[WhatsApp Cloud]
        Email[Email SES]
        Banks[Banks API]
        Mudad[Mudad WPS]
        GOSI[GOSI]
        Mada[Mada Payment]
    end
    
    UI --> API
    Mobile --> API
    POS --> API
    API --> Auth
    API --> AI
    API --> AutoJ
    API --> Approval
    API --> Numbering
    API --> Period
    API --> FX
    API --> Tax
    AutoJ --> Prisma
    Approval --> Prisma
    Period --> Prisma
    FX --> Prisma
    Tax --> Prisma
    Prisma --> Master
    Master --> Tenant1
    Master --> Tenant2
    Master --> TenantN
    Tax --> ZATCA
    API --> WhatsApp
    API --> Email
    API --> Banks
    API --> Mudad
    API --> GOSI
    POS --> Mada
```

---

## 🛠️ الأدوات لرسم الفلوهات

### 1. Mermaid (مجاني، الأبسط)
- يعمل في GitHub, Notion, ملفات MD
- موقع: mermaid.live
- لا يحتاج تثبيت

### 2. Draw.io / Diagrams.net (مجاني)
- موقع: app.diagrams.net
- للرسم اليدوي والتعديلات الدقيقة
- يصدّر PNG, PDF, SVG
- **الأفضل لـ ERD ومخططات معمارية معقدة**

### 3. Lucidchart (مدفوع)
- احترافي
- تعاون فريق
- BPMN templates جاهزة

### 4. Whimsical (مدفوع، 10$/شهر)
- جميل وسريع
- للرسم التخطيطي السريع

### 5. Figma (مجاني للمستخدم الواحد)
- للـ user flows والـ mockups معاً

---

## 📐 معايير الرسم التي يجب اتباعها

### BPMN 2.0 Notation (المعيار الرسمي)

| الرمز | المعنى |
|-------|--------|
| ⬭ Circle | Start / End event |
| 🟦 Rectangle | Task / Activity |
| 🔷 Diamond | Decision / Gateway |
| ➡️ Arrow | Flow direction |
| 📄 Document | يدل على وثيقة منتجة |
| 👤 Person/Pool | الفاعل (المستخدم/النظام) |
| 🔁 Loop | تكرار |

### Best Practices
1. **اتجاه واحد:** يبدأ من الأعلى/اليسار، ينتهي بالأسفل/اليمين
2. **لا تتعدى 15 خطوة في فلو واحد** — قسم لفلوهات أصغر
3. **الفروع (decisions) يجب أن تكون واضحة** بسؤال واحد
4. **اللون:** أخضر = مسار سعيد، أحمر = خطأ، أصفر = استثناء
5. **swim lanes:** قسم بأدوار (محاسب، مدير، نظام)

---

## 📦 ماذا تفعل الآن؟

### الترتيب الأمثل لاستخدام كل الوثائق:

```
1. WHAT_YOU_STILL_NEED.pdf
   → فهم ما تحتاجه إجمالاً (فريق، ميزانية، أدوات)

2. BUSINESS_FLOWS_GUIDE.pdf (هذا الملف)
   → ارسم/راجع الفلوهات قبل البرمجة
   → اعرضها على CPA للتحقق من المنطق المحاسبي
   → اعرضها على 3-5 عملاء حاليين للتأكد أن الفلو يطابق عملهم

3. GLOBAL_ERP_GAP_ANALYSIS.pdf
   → بعد تأكيد الفلوهات، استخدم البرومنت لبناء الكود

4. التطبيق
   - كل ميزة جديدة = فلو + برومنت + كود + اختبار
```

### ❌ الخطأ الشائع
أن تبدأ بكتابة الكود **قبل** رسم الفلو. النتيجة:
- إعادة كتابة 70% من الكود لاحقاً
- العميل يقول "ليس هذا ما طلبت"
- المحاسب يقول "هذا منطق خاطئ"

### ✅ التسلسل الصحيح
```
عميل/متطلب → فلو ورسم → موافقة → برومنت → كود → اختبار → نشر
```

---

## 🎯 أولوية الفلوهات حسب الأهمية

### يجب رسمها قبل البرمجة (Critical):
1. ✅ Quote-to-Cash
2. ✅ Procure-to-Pay
3. ✅ Period Close
4. ✅ ZATCA E-Invoice
5. ✅ Approval Routing

### يجب رسمها قبل المرحلة 1:
6. ✅ Record-to-Report
7. ✅ Three-Way Matching
8. ✅ Bank Reconciliation
9. ✅ JE Approval
10. ✅ Invoice State Machine

### يجب رسمها قبل المرحلة 4-7:
11. ✅ Acquire-to-Retire (Assets)
12. ✅ Plan-to-Produce
13. ✅ Hire-to-Retire
14. ✅ WPS Salary
15. ✅ Manufacturing Order States

### يمكن تأجيلها:
16. POS Flow
17. Customer Onboarding
18. Architecture Diagram

---

## 💡 نصيحة ذهبية

**اطبع كل فلو على A3 وعلقه على جدار المكتب.**

كل مطور، كل محاسب، كل عميل عندما يدخل المكتب يرى **كيف يفترض أن يعمل النظام**.

عندما يقترح أحد تغييراً، يقول: "بدل هذه الخطوة بهذه" — ليس "غير الكود".

هذا يجبر الفريق على التفكير في **العملية أولاً**، وليس الكود.

---

**انتهى الدليل**
