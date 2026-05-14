# 27 - الخزينة والبنوك (Treasury & Banking)

> Bank Accounts + Reconciliation + Checks + Petty Cash + Cash Flow + Forecast

---

## 🏦 الحسابات البنكية

### النموذج:
```prisma
BankAccount {
    accountNo, accountHolderName
    bankId              // ربط بـ Bank
    bankName, bankCode  // مثال: RJHI
    iban                // SA + 22 char
    swift               // للحوالات الدولية
    currency            // SAR / USD / ...
    accountType: 'CURRENT' | 'SAVINGS' | 'INVESTMENT'
    balance             // الرصيد الدفتري
    overdraftLimit      // إن وجد
    status: 'ACTIVE' | 'CLOSED' | 'FROZEN'
    branchId
    openedAt, closedAt
    isPrimary
}

BankTransaction {
    bankAccountId
    date, amount
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'FEE' | 'INTEREST'
    reference           // رقم العملية البنكية
    description
    relatedJournalLineId // ربط بقيد
    status: 'PENDING' | 'CLEARED' | 'BOUNCED'
}
```

---

## 🔄 التسوية البنكية (Bank Reconciliation)

### السيناريو:
```
1. استيراد كشف الحساب البنكي:
   POST /api/accounting/bank-statements/upload
   - صيغ: CSV / OFX / Direct API (Open Banking)
   - يُنشأ BankStatement + BankStatementLines
   
2. Auto-Match:
   POST /api/accounting/bank-recon/auto-match
   - مطابقة بـ Reference Number (الأقوى)
   - مطابقة بـ Amount + Date (±3 days)
   - مطابقة بـ Description fuzzy
   
3. Manual Match:
   - UI تعرض غير المُطابق
   - المحاسب يطابق يدوياً
   
4. Adjustments:
   - رسوم بنكية: Dr Bank Fees / Cr Bank
   - فوائد: Dr Bank / Cr Interest Income
   - معاملات لم تُسجل: Dr/Cr appropriate
   
5. Finalize:
   POST /api/accounting/bank-recon/{id}/finalize
   - status: COMPLETED
   - JE adjustments تُرحّل
```

### Engine (`src/lib/bank-reconciliation.ts`):

```typescript
async function autoMatch(statementId: number) {
    const lines = await getStatementLines(statementId);
    const journalLines = await getUnreconciledJournalLines(account, period);
    
    const matches = [];
    
    for (const sLine of lines) {
        // 1. Reference match (highest confidence)
        const refMatch = journalLines.find(j => j.reference === sLine.reference);
        if (refMatch) {
            matches.push({ statementLineId: sLine.id, journalLineId: refMatch.id, confidence: 1.0 });
            continue;
        }
        
        // 2. Amount + Date (±3 days)
        const amountDateMatch = journalLines.find(j => 
            Math.abs(j.amount - sLine.amount) < 0.01 &&
            Math.abs(differenceInDays(j.date, sLine.date)) <= 3
        );
        if (amountDateMatch) {
            matches.push({ statementLineId: sLine.id, journalLineId: amountDateMatch.id, confidence: 0.8 });
            continue;
        }
        
        // 3. Fuzzy description
        const fuzzyMatch = journalLines
            .map(j => ({ j, score: similarity(j.description, sLine.description) }))
            .filter(m => m.score > 0.7)
            .sort((a, b) => b.score - a.score)[0];
        if (fuzzyMatch) {
            matches.push({ statementLineId: sLine.id, journalLineId: fuzzyMatch.j.id, confidence: fuzzyMatch.score });
        }
    }
    
    return matches;
}
```

### النماذج:
```prisma
BankStatement {
    bankAccountId, statementNo
    fromDate, toDate
    openingBalance, closingBalance
    status: 'IMPORTED' | 'RECONCILED'
}

BankStatementLine {
    statementId, reference
    date, amount, description
    type, balance
}

BankReconciliation {
    bankAccountId, period
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
    reconciledAmount
    unmatchedAmount
    completedAt
}

BankReconMatch {
    reconciliationId
    journalLineId, statementLineId
    matchType: 'AUTO' | 'MANUAL'
    confidence  // 0-1
    matchedBy, matchedAt
}
```

---

## 💵 الخزينة (Cash Management)

### النموذج:
```prisma
Treasury {
    userId, amount
    date, narration
    type: 'INCOMING' | 'OUTGOING' | 'TRANSFER'
    reference
    branchId
    deletedAt
}

PettyCashFund {
    fundName, currentBalance
    fundLimit, replenishmentLevel
    custodianEmployeeId
    branchId
}

PettyCashTransaction {
    fundId, amount, date
    description, category
    receiptAttachment
    approvedBy
}
```

### Petty Cash Flow:
```
1. إنشاء عهدة:
   POST /api/treasury/petty-cash
   { fundName, initialAmount, custodian }
   JE: Dr Petty Cash / Cr Bank
   
2. مصاريف صغيرة:
   POST /api/treasury/petty-cash/{id}/expense
   { amount, category, description, receipt }
   JE: Dr Specific Expense / Cr Petty Cash
   
3. إعادة التعبئة:
   POST /api/treasury/petty-cash/{id}/replenish
   - عند وصول الحد الأدنى
   JE: Dr Petty Cash / Cr Bank
```

---

## 📋 الشيكات (Checks)

### النماذج:
```prisma
CheckTransaction {
    checkNo
    type: 'RECEIVED' | 'ISSUED'
    customerId         // إذا received من عميل
    supplierId         // إذا issued لمورد
    bankAccountId      // الحساب المستخدم
    amount, currency
    issueDate, dueDate
    status: 'PENDING' | 'DEPOSITED' | 'CLEARED' | 'BOUNCED' | 'CANCELLED' | 'CASHED'
    relatedInvoiceId
    rejectionReason
}
```

### Lifecycle للشيكات المستلمة:
```
1. استلام شيك من عميل:
   POST /api/finance/checks
   { type: 'RECEIVED', customerId, checkNo, amount, dueDate }
   - status: PENDING
   - JE: Dr Checks Under Collection (1115) / Cr AR
   
2. الإيداع في البنك:
   POST /api/finance/checks/{id}/deposit
   - status: DEPOSITED
   - JE: Dr Bank / Cr Checks Under Collection
   
3. المقاصة (1-3 أيام):
   POST /api/finance/checks/{id}/clear
   - status: CLEARED
   - الرصيد البنكي محدث فعلياً
   
4. إذا ارتد (Bounced):
   POST /api/finance/checks/{id}/bounce
   - status: BOUNCED
   - JE عكسي:
     Dr  AR                       1000  (إعادة المديونية)
     Dr  Bank Fees                  50  (رسوم البنك)
         Cr  Bank                       1050
   - إنشاء dunning أو legal action
```

### Lifecycle للشيكات الصادرة:
```
1. إصدار شيك لمورد:
   POST /api/finance/checks
   { type: 'ISSUED', supplierId, checkNo, amount, dueDate }
   - status: PENDING
   - JE: Dr AP / Cr Checks Issued (2115)
   
2. عند صرف الشيك من المورد:
   POST /api/finance/checks/{id}/cashed
   - status: CASHED
   - JE: Dr Checks Issued / Cr Bank
   
3. إذا ألغي:
   POST /api/finance/checks/{id}/cancel
   - JE عكسي
```

---

## 📊 Cash Flow Statement

### المنهجيات:

#### Direct Method:
- يصنف كل bank transactions لـ:
  - **Operating Activities:** المبيعات، المشتريات، الرواتب، الإيجار
  - **Investing Activities:** شراء/بيع أصول، استثمارات
  - **Financing Activities:** قروض، توزيعات أرباح، capital

#### Indirect Method:
```
Net Income                              230,000
+ Depreciation                           20,000
+ Increase in AP                         15,000
- Increase in AR                        (40,000)
- Increase in Inventory                 (30,000)
+ Decrease in Prepayments                 5,000
= Net Cash from Operating              200,000

- Purchase of Fixed Assets             (100,000)
+ Sale of Fixed Assets                   10,000
= Net Cash from Investing              (90,000)

+ Long-term Loan                         50,000
- Loan Repayment                        (30,000)
- Dividends Paid                        (40,000)
= Net Cash from Financing               (20,000)

= Net Change in Cash                     90,000
+ Opening Cash                          100,000
= Closing Cash                          190,000
```

### الـ Engine (`src/lib/cash-flow-forecasting.ts` — 17KB):
- ينتج Direct أو Indirect
- يدعم Forecasting (تنبؤ مستقبلي)

### المسارات:
- `/api/finance/cash-flow`
- `/api/reports/cashflow`
- `/treasury/cash-flow`
- `/finance/cash-flow/forecast`

---

## 🔮 Cash Forecasting

### المنطق:
```typescript
async function forecastCashFlow(days: number) {
    let runningBalance = await getCurrentCash();
    const forecast = [];
    
    for (let i = 1; i <= days; i++) {
        const date = addDays(new Date(), i);
        
        // Inflows متوقعة:
        const expectedInvoiceCollections = await getExpectedAR(date);
        const recurringIncomes = await getRecurringIncomes(date);
        
        // Outflows متوقعة:
        const expectedPayablePayments = await getExpectedAP(date);
        const payrollCheck = isPayrollDate(date) ? await getMonthlyPayroll() : 0;
        const recurringExpenses = await getRecurringExpenses(date);
        const checkDueDates = await getChecksDueDate(date);
        
        const netFlow = (expectedInvoiceCollections + recurringIncomes) - 
                       (expectedPayablePayments + payrollCheck + recurringExpenses + checkDueDates);
        
        runningBalance += netFlow;
        
        forecast.push({
            date,
            inflows: expectedInvoiceCollections + recurringIncomes,
            outflows: expectedPayablePayments + payrollCheck + recurringExpenses + checkDueDates,
            netFlow,
            runningBalance
        });
    }
    
    return forecast;
}
```

### التنبيهات:
- إذا runningBalance < threshold → تنبيه!
- إذا negative → خطر سيولة!

---

## 📈 تقارير الخزينة

| التقرير | الوصف |
|---|---|
| **Cash Position** | الرصيد الحالي بكل البنوك |
| **Liquidity Ratio** | السيولة الحالية، السريعة، النقدية |
| **Aging of Receivables** | أعمار الذمم المدينة |
| **Aging of Payables** | أعمار الذمم الدائنة |
| **Bank Statements** | كشوف البنوك |
| **Checks Status** | حالة الشيكات (Issued/Received) |
| **Daily Cash Position** | للـ CFO اليومي |
| **Cash Flow Forecast** | تنبؤ 30/60/90 يوم |

### المسارات:
- `/treasury/cash-position`
- `/treasury/liquidity`
- `/treasury/cash-flow`
- `/treasury/cash-forecast`

---

## 🌐 Open Banking Integration (مستقبلي)

### الفكرة:
- ربط مباشر بالبنوك السعودية عبر API
- استيراد لحظي للمعاملات
- تنفيذ تحويلات من النظام مباشرة

### البنوك الداعمة (Open Banking):
- مصرف الراجحي
- البنك الأهلي
- البنك السعودي الفرنسي
- (تتوسع تدريجياً)

### الحالة في النظام:
- 🟡 Schema جاهز
- ❌ التكامل الفعلي ناقص

---

## 💱 العملات والـ FX

### Multi-Currency Banking:
- يمكن وجود حسابات بنكية بعملات مختلفة (SAR, USD, EUR, ...)
- كل معاملة بالعملة الأصلية + المعدل وقت التسجيل
- شهرياً (cron): FX Revaluation للحسابات غير المحلية

### FX Revaluation:
```typescript
// /api/cron/fx-revaluation
for (const bankAccount of foreignAccounts) {
    const currentRate = await getCurrentRate(bankAccount.currency);
    const oldValue = bankAccount.balance × bankAccount.lastRate;
    const newValue = bankAccount.balance × currentRate;
    const fxDifference = newValue - oldValue;
    
    if (Math.abs(fxDifference) > 0.01) {
        await postJournalEntry({
            description: `FX Revaluation - ${bankAccount.bankName}`,
            lines: [
                fxDifference > 0
                    ? { account: 'BANK', debit: fxDifference }
                    : { account: 'BANK', credit: -fxDifference },
                fxDifference > 0
                    ? { account: 'FX_GAIN', credit: fxDifference }
                    : { account: 'FX_LOSS', debit: -fxDifference }
            ]
        });
        
        bankAccount.lastRate = currentRate;
        await bankAccount.save();
    }
}
```

---

## 🎯 Best Practices

1. ✅ **Bank Reconciliation شهرياً** على الأقل
2. ✅ **Petty Cash Limit** صغير (< 5000 SAR)
3. ✅ **شيكات تحتاج موافقتين** للمبالغ > 50K
4. ✅ **متابعة استحقاق الشيكات** الصادرة
5. ✅ **Cash Forecast أسبوعياً** للـ CFO
6. ✅ **Safe lock** بقيود فيزيائية للنقد
7. ✅ **Multi-signatory** للحسابات الكبيرة
8. ❌ **لا cash في الخزنة > حد معين**
9. ❌ **لا تأخر تسوية الشيكات المرتدة**
10. ❌ **لا تتجاهل overdraft alerts**
