# 63 — Anomaly Detection | كشف الشذوذ

## 🟠 الأولوية: عالي

## 🔍 الموجود
- /api/ai/fraud-monitoring/ basic

## 🎯 الخطة

### 63.1 — Statistical Anomaly Detection (5 أيام)
- Z-score
- IQR (Interquartile Range)
- Moving average + standard deviation
- Per-tenant baselines

### 63.2 — ML-based (8 أيام)
- Isolation Forest
- Local Outlier Factor (LOF)
- Autoencoders (للأنماط المعقدة)
- One-Class SVM

### 63.3 — Use Cases (10 أيام)

#### Sales
- Unusual discount %
- Sales above credit limit
- Returns spike
- Refund pattern (potential fraud)

#### Purchases
- Price spike
- Duplicate vendor invoices
- Maverick spend (off-contract)
- Round-number invoices (potential fraud)

#### Cash
- Large cash transactions
- Cash deficit
- Bank reconciliation discrepancies
- Suspicious transfers

#### HR
- Overtime spike
- Salary changes outside review cycle
- Mass terminations
- Unusual leave patterns

#### Inventory
- Stock variance > threshold
- Slow-moving items spike
- Negative inventory
- Theft patterns (loss in specific bins)

### 63.4 — Real-time vs Batch (3 أيام)
- Critical (cash > 100K) → real-time
- Daily summaries → batch
- Per-tenant configurable

### 63.5 — Alert Engine (5 أيام)
- Severity levels (info, warning, critical)
- Notification channels (email, WhatsApp, Telegram)
- De-duplication
- Escalation paths

### 63.6 — Audit Trail (3 أيام)
- All alerts logged
- Investigations tracked
- Resolutions recorded
- Compliance reports

### 63.7 — Continuous Learning (5 أيام)
- User feedback (true/false positive)
- Model retraining
- Threshold auto-tuning
- Per-tenant adaptation

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Anomalies detected | manual | تلقائي |
| False positive rate | غير مقاس | < 10% |
| Time to detection | days | < 1 hour |
| Fraud prevented (SAR) | غير متابع | tracked |

## ⏱️ المدة: 39 يوم عمل
