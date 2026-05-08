# 30 — ZATCA Phase 2 | الفوترة الإلكترونية الكاملة

## 🔴 الأولوية: حرج

## 🔍 الموجود
- [src/app/api/zatca/route.ts](../../src/app/api/zatca/route.ts)
- `zatca-xml-js` library
- Settings: zatca_invoice_counter, zatca_last_pih
- ZATCA basic submission

## 🔴 الفجوات
- ICV/PIH chain غير محصّن (gaps محتملة)
- لا Compliance Test Suite
- Phase 2 Standard vs Simplified غير واضحين
- لا Onboarding flow كامل (CSR, CSID renewal)
- لا Production Certificate Renewal
- لا QR validation
- Cleared vs Reported invoices غير واضحين
- لا Archive موثّق (5 years per ZATCA)
- لا XML compliance للـ B2C تحديثات 2025
- لا handling of late submissions

## 🎯 الخطة

### 30.1 — ICV/PIH Chain Hardening (4 أيام)
```typescript
export class ZATCACounterService {
  async getNextICV(tenantId: string): Promise<number> {
    return await prisma.$transaction(async (tx) => {
      // SERIALIZABLE isolation
      const setting = await tx.setting.findUnique({
        where: { tenantId_key: { tenantId, key: 'zatca_icv' } },
      });
      const next = (setting?.value as number || 0) + 1;
      await tx.setting.upsert({
        where: { tenantId_key: { tenantId, key: 'zatca_icv' } },
        update: { value: next },
        create: { tenantId, key: 'zatca_icv', value: next },
      });
      return next;
    }, { isolationLevel: 'Serializable' });
  }

  async getPreviousHash(tenantId): Promise<string> {
    const last = await prisma.salesInvoice.findFirst({
      where: { tenantId, cleared: true },
      orderBy: { icv: 'desc' },
      select: { zatcaHash: true },
    });
    return last?.zatcaHash || '0'.repeat(64);
  }
}
```

### 30.2 — Onboarding Flow (10 أيام)
- Step 1: CSR generation
- Step 2: Compliance CSID (sandbox)
- Step 3: Compliance test (6+ invoice types)
- Step 4: Production CSID
- Step 5: Activation

### 30.3 — Phase 2 Both Modes (5 أيام)
- **Standard (B2B):** Clearance (مصادقة قبل الإصدار)
- **Simplified (B2C):** Reporting (تقرير بعد الإصدار خلال 24 ساعة)
- Auto-detect mode per invoice

### 30.4 — Compliance Test Suite (6 أيام)
- 12+ scenarios:
  - Standard tax invoice
  - Simplified tax invoice
  - Credit note (Standard + Simplified)
  - Debit note
  - Discount on invoice
  - Multiple items
  - Multiple tax rates
  - Foreign currency
  - Export invoice
  - Construction invoice
  - Pharmacy invoice
  - Self-billing

### 30.5 — Certificate Renewal Automation (4 أيام)
- Alert 30 days before expiry
- Auto-renewal flow
- Backup of old certificate
- Zero-downtime switch

### 30.6 — Archive Management (3 أيام)
- 5+ years retention
- Encrypted storage
- Indexed for search
- Audit log access

### 30.7 — QR Validation (2 أيام)
- TLV decoder
- Verify against original
- Public verification page

### 30.8 — Late Submissions Handler (3 أيام)
- Detection (> 24h for Simplified)
- Penalty calculation
- Bulk submission with reason

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| ZATCA submission success | غير مقاس | > 99.5% |
| ICV chain integrity | محتمل gaps | 100% |
| Compliance test pass rate | يدوي | 100% auto |
| Late submissions | غير متابع | < 0.1% |

## ⏱️ المدة: 37 يوم عمل
