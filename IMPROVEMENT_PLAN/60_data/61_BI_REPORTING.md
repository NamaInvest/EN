# 61 — BI & Reporting | ذكاء الأعمال

## 🟠 الأولوية: عالي

## 🔍 الموجود
- BI Dashboard أساسي
- Recharts

## 🔴 الفجوات
- لا BI tool حقيقي
- المستخدمون لا يستطيعون بناء تقاريرهم
- لا scheduled reports
- لا alerts

## 🎯 الخطة

### 61.1 — BI Tool Setup (5 أيام)
**الخيارات:**
- **Metabase** (open source، عربي جيد، مجاني)
- **Superset** (Apache، أقوى، أعقد)
- **Lightdash** (مع dbt)
- **Looker** (Google، مكلف)

**التوصية:** Metabase embedded داخل Namasoft.

### 61.2 — Embedded Analytics (5 أيام)
```typescript
// Iframe embed with JWT
const embedUrl = generateMetabaseEmbedUrl({
  resource: { dashboard: 1 },
  params: { tenant_id: ctx.tenant.id },
  exp: addMinutes(new Date(), 60),
});
```
- Tenant filtering enforced
- Permission-based dashboard access
- Themes matching Namasoft

### 61.3 — Out-of-the-Box Dashboards (10 أيام)
- Executive Dashboard (CEO/CFO)
- Sales Performance
- Cash Flow & AR Aging
- Inventory Status
- Manufacturing Performance
- HR Analytics
- Procurement Spend
- Branch Comparison

### 61.4 — Self-Service Reports (8 أيام)
- Drag-drop builder
- Pre-defined dimensions/measures
- Filters, groupings
- Export PDF/Excel/CSV
- Save & share

### 61.5 — Scheduled Reports (4 أيام)
- Daily/Weekly/Monthly/Quarterly
- Email delivery (PDF + Excel)
- Slack delivery
- Conditional (only if KPI changes)

### 61.6 — Alerts (5 أيام)
- KPI thresholds
- Anomaly alerts (low sales, high return rate)
- Channel: email, WhatsApp, in-app
- Snooze / acknowledge

### 61.7 — Mobile Dashboards (5 أيام)
- Responsive
- Native mobile app integration
- Push notifications for alerts

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Dashboards available | جزئي | 8+ ready |
| Self-service users | 0 | > 30% |
| Scheduled reports | 0 | per role |
| Alert response time | لا | < 1 hour |

## ⏱️ المدة: 42 يوم عمل
