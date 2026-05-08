# 64 — Data Migration Tools | أدوات الترحيل

## 🟠 الأولوية: عالي

## ملاحظة
هذا الملف مكمّل لـ [45_ACCOUNTING_MIGRATION.md](../40_integrations/45_ACCOUNTING_MIGRATION.md) — يركز على عمليات الترحيل الداخلية.

## 🎯 الخطة

### 64.1 — Universal Excel Importer (8 أيام)
- Customers, Suppliers, Products, COA, Opening Balances
- Template per entity
- Validation
- Preview
- Bulk insert
- Error handling

### 64.2 — Mapping Engine (5 أيام)
- Source columns → Namasoft fields
- Visual mapping UI
- Save mapping templates
- Re-use across imports

### 64.3 — Data Validation (5 أيام)
- Required fields
- Format validation (email, phone, IBAN)
- Reference integrity (vendor must exist)
- Tax compliance (VAT number format)
- Custom rules per tenant

### 64.4 — Bulk Operations (4 أيام)
- Bulk update (price changes, etc.)
- Bulk delete
- Bulk status change
- Bulk export

### 64.5 — Data Cleansing (5 أيام)
- Duplicate detection (fuzzy matching)
- Standardization (Saudi addresses)
- Phone format normalization
- Tax number validation

### 64.6 — Audit Trail (3 أيام)
- All imports logged
- Diff tracking
- Rollback option (within 24h)

### 64.7 — Data Export Tools (4 أيام)
- Per entity
- Filters
- Format selection (Excel, CSV, JSON)
- Encryption for sensitive data

### 64.8 — GDPR/PDPL Data Export (3 أيام)
- Per-user complete data dump
- Anonymized exports for analytics
- Right to portability

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Import success rate | manual | > 95% |
| Avg import time | manual | < 5 min |
| Data quality post-import | manual | tracked |

## ⏱️ المدة: 37 يوم عمل
