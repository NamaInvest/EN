# خطة Finance Isolated DB Integration

## الهدف
اختبار القيود والفترات والتقارير المالية داخل قاعدة اختبار معزولة فقط.

## شروط التشغيل
- TEST_MODE=true
- TEST_DATABASE_URL موجود وآمن
- لا DATABASE_URL إنتاجي
- لا migrate
- لا db push
- لا SQL مباشر
- قاعدة Disposable أو Transaction Rollback
- tenant-scoped seed
- no external integrations
- no live financial posting

## السيناريوهات المالية المقترحة

F-DB-001:
Journal balanced posting validation داخل Test DB.

F-DB-002:
Unbalanced journal rejected.

F-DB-003:
Closed period write rejected.

F-DB-004:
Preview endpoint does not mutate.

F-DB-005:
Audit expectation available or mockable.

F-DB-006:
Tenant scoped financial data.

F-DB-007:
Open item allocation rollback.

F-DB-008:
FX preview read-only behavior.

## Seed Requirements
- Tenant
- User
- Role/Permission
- FiscalPeriod
- ChartOfAccounts
- JournalDraft
- LockedPeriod
- OpenItem
- FxRate
- AuditExpectation

## Rollback Strategy
- transaction rollback
أو
- disposable DB reset

## Stop Conditions
- DB guard failure
- missing TEST_MODE
- missing TEST_DATABASE_URL
- production-like URL
- migration required
- schema mismatch requiring db push
- any live posting risk
