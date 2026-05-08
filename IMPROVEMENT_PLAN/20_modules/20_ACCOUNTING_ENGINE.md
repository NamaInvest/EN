# 20 — Accounting Engine | محرك المحاسبة

## 🟠 الأولوية: عالي | الاكتمال: 65%

## 🔍 الموجود
- [src/lib/auto-journal.ts](../../src/lib/auto-journal.ts)
- Chart of Accounts (SOCPA template)
- JournalEntry + JournalLine models
- DocumentStateMachine
- NumberSequence
- Account hierarchy

## 🔴 الفجوات
| الفجوة | الخطورة |
|--------|--------|
| **Period Close Engine ضعيف** | 🔴 |
| لا Multi-book accounting (statutory + management) | 🟠 |
| لا FX Revaluation تلقائي شهري | 🔴 |
| Sub-ledger reconciliation يدوي | 🟠 |
| لا Allocation Rules engine | 🟠 |
| Consolidation متعدد الشركات ضعيف | 🟠 |
| لا Year-end closing automation | 🔴 |
| Reversing entries غير مؤتمتة | 🟡 |
| Recurring journal entries غير مؤتمتة | 🟡 |
| Cost Center / Profit Center / Segment reporting ضعيف | 🟠 |

## 🎯 الخطة

### 20.1 — Period Close Engine (10 أيام)
```typescript
// src/services/accounting/period-close.service.ts
export class PeriodCloseService {
  async runChecklist(periodId: string): Promise<CloseChecklistResult> {
    // 14 step مراجعة وفقاً لـ SOCPA
    return await Promise.all([
      this.verifyBankReconciliation(),
      this.verifyARSubledger(),
      this.verifyAPSubledger(),
      this.verifyInventoryCount(),
      this.verifyFixedAssetsDepreciation(),
      this.verifyAccruals(),
      this.verifyPrepayments(),
      this.verifyFXRevaluation(),
      this.verifyVATReconciliation(),
      this.verifyPayrollAccruals(),
      this.verifyIntercompanyElimination(),
      this.verifyTrialBalance(),
      this.verifyClosingEntries(),
      this.verifyRetainedEarnings(),
    ]);
  }
}
```

### 20.2 — FX Revaluation Engine (5 أيام)
- يومي للحسابات النقدية
- شهري لـ AR/AP
- توليد قيود تلقائية (FX Gain/Loss)

### 20.3 — Multi-Book Accounting (8 أيام)
- Statutory Book (SOCPA)
- Management Book (IFRS / Internal)
- Tax Book (ZATCA)
- Cross-book journal entries

### 20.4 — Allocation Rules Engine (6 أيام)
- توزيع المصروفات على Cost Centers
- توزيع نسبي / ثابت / معتمد على KPI
- Dry-run + commit

### 20.5 — Consolidation (10 أيام)
- Multi-entity → Parent
- Intercompany elimination
- Currency translation
- Minority interest

### 20.6 — Recurring + Reversing JEs (4 أيام)
- Schedule (monthly accruals)
- Auto-reversal next period
- Template library

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Period close time | غير محدد | < 1 يوم |
| FX Reval | يدوي | شهري تلقائي |
| Multi-book | لا | 3 books |
| Trial balance reconciliation | يدوي | تلقائي |

## ⏱️ المدة: 43 يوم عمل
