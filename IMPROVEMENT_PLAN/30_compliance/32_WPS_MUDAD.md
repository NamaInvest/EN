# 32 — WPS / Mudad | حماية الأجور

## 🔴 الأولوية: حرج

## 🔍 الموجود
- WPSBatch model
- WPS SIF generator
- محرك اختباري `wps-generator.test.ts`

## 🔴 الفجوات
- SIF formats محدودة (بنوك قليلة)
- لا Mudad integration مباشرة
- لا confirmation tracking
- لا rejected payments handling
- لا multi-tenant SIF generation
- Iqama/IBAN validation ضعيفة
- لا historical comparison

## 🎯 الخطة

### 32.1 — Multi-Bank SIF Formats (8 أيام)
كل بنك له format خاص:
| البنك | Format |
|------|--------|
| الراجحي | AR-WPS-V2.txt |
| الأهلي SNB | NCB-SIF-V3.csv |
| الرياض | Riyad-WPS.xml |
| البلاد | Bilad-SIF.txt |
| ساب SAB | SAB-WPS.csv |
| الإنماء | Inma-WPS.txt |

### 32.2 — Mudad Integration (10 أيام)
- API authentication (mTLS)
- Submit batch
- Track status
- Get confirmation
- Handle rejections

### 32.3 — Validation Engine (5 أيام)
- IBAN validation (SA + 22 digits + checksum)
- Iqama validation
- Salary > minimum wage check
- Bank account ownership verification (where possible)
- Format compliance per bank

### 32.4 — Rejection Handling (4 أيام)
- Reasons catalog (invalid IBAN، closed account، insufficient funds)
- Re-submission workflow
- Employee notification
- HR action queue

### 32.5 — Historical Tracking (3 أيام)
- All submissions archive
- Confirmation IDs
- Status timeline
- Reports

### 32.6 — Salary Protection Compliance (3 أيام)
- لا تأخير في الـ submission
- 1st-2nd of month enforcement
- Cabinet decision compliance
- Audit trail

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| WPS submission success | غير متابع | > 99% |
| Days to submit | غير متابع | < 5 days |
| Rejected payments | غير متابع | < 1% |
| Bank format support | محدود | 6+ بنوك |

## ⏱️ المدة: 33 يوم عمل
