# 40 — Banks Integration | تكامل البنوك السعودية

## 🔴 الأولوية: حرج

## 🎯 البنوك المستهدفة
| البنك | API | Statement Format | WPS |
|------|-----|------------------|-----|
| الراجحي | mTLS | MT940، CSV | ✅ |
| الأهلي SNB | mTLS | Camt.053 | ✅ |
| الرياض | OAuth2 | CSV | ✅ |
| البلاد | mTLS | CSV | ✅ |
| ساب SAB | OAuth2 | MT940 | ✅ |
| الإنماء | mTLS | XML | ✅ |
| الفرنسي | OAuth2 | CSV | ✅ |
| الجزيرة | mTLS | XML | ✅ |

## 🎯 الخطة

### 40.1 — Statement Import (8 أيام)
كل بنك له format خاص. Parser موحّد:
```typescript
export class BankStatementImporter {
  async import(file: File, bankCode: string): Promise<Transactions[]> {
    const parser = this.getParser(bankCode);
    return await parser.parse(file);
  }
}

class AlRajhiCSVParser implements StatementParser { ... }
class SNBCamtParser implements StatementParser { ... }
// ...
```

### 40.2 — Bank Connectivity (10 أيام)
- mTLS certificate management
- OAuth2 flows
- Token refresh
- Connection monitoring
- Auto-reconnect on failure

### 40.3 — Transaction Sync (8 أيام)
- Daily sync (cron)
- Real-time webhooks (where supported)
- Categorization
- Matching to invoices/payments
- Reconciliation

### 40.4 — Payment Initiation (10 أيام)
- Single payment
- Bulk payment
- Approval workflow
- Confirmation tracking

### 40.5 — Cheque Services (5 أيام)
- Cheque book request
- Status tracking
- Stop payment
- Bouncing notification

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Banks integrated | 0 | 6+ |
| Statement import | manual | daily auto |
| Reconciliation | weekly manual | daily auto |
| Payment automation | لا | 80%+ |

## ⏱️ المدة: 41 يوم عمل
