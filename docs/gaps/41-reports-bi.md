# النقص #41: Reports + BI + Custom Builder + Dashboards — مواصفات

> **المرجعيات:** Power BI、Tableau、Looker、SAP Analytics Cloud、Qlik、Domo

---

## 1. البرومنت

```
وسّع Reports + BI:

موجود: 16+ pre-built reports, /reports/builder, /reports/bi-export, custom-report-engine

النواقص:
A) 100+ standard reports (financial, operational, management)
B) Custom report builder (drag-drop fields)
C) Scheduled reports + auto-distribute
D) Pivot tables + cross-tabs
E) Drill-down anywhere (GL → JE → invoice → customer)
F) Multi-currency reporting
G) Comparative reports (vs previous period, vs budget, vs forecast)
H) BI export (Power BI, Tableau, Excel)
I) Dashboards (configurable per user)
J) KPIs library
K) Alerts on KPI thresholds
L) Embedded analytics (per page contextual reports)

APIs (40+), UI (15 pages), Tests 70+
```

---

## 2. السيناريوهات (8)

### A — Custom Report Builder
```
1. /reports/builder → [+ New Report]
2. Choose data source: Sales Invoices
3. Drag fields:
   - Rows: Customer, Salesperson
   - Columns: Month
   - Values: Total Sales (sum), Invoice Count
4. Filter: This year, Status=Posted
5. Save as "Sales by Customer + Salesperson Monthly"
6. Schedule: monthly, email to CFO + Sales Mgr
```

### B — Scheduled Reports
```
- Daily sales: 7 AM email to managers
- Weekly aging: Monday 8 AM to AR team
- Monthly P&L: 5th of next month to CFO
- Quarterly board: 15 days after Q-end
- All auto-generated + delivered
```

### C — Drill-down
```
- View Income Statement → Sales Revenue 5M
- Click → see by month
- Click month → see by customer
- Click customer → see invoices
- Click invoice → full detail with audit trail
```

### D — Multi-period Comparison
```
- Q1 2026 vs Q1 2025
- Show: amounts, % change, variance reason
- Side-by-side or chart
```

### E — Pivot Analysis
```
- Sales: rows=Region, cols=Product Category, values=Revenue
- Filter: by salesperson, time period
- Sort, group, total
- Export to Excel
```

### F — KPI Dashboard
```
- User selects dashboard layout
- Adds widgets: Revenue, Margin, AR Aging, Cash, Open POs
- Each widget configurable (period, comparison, drill-down)
- Refreshes automatically
- Mobile-responsive
```

### G — Alert on KPI
```
- KPI: AR Aging > 60 days exceeds 5%
- Threshold breached → email + push to AR Mgr
- Drill to which customers
```

### H — Power BI Integration
```
- Tenant connects Power BI
- Direct query API
- Live data
- All Namasoft data available
- Custom dashboards in Power BI
```

---

## 3. تدفق البيانات

```
[Custom Report]
POST /reports/custom { dataSource, dimensions, measures, filters }
   ↓ build query (Prisma groupBy + aggregations)
   ↓ apply filters
   ↓ execute
   ↓ format result
   ↓ render or export

[Scheduled]
Cron based on schedule:
   ↓ run report
   ↓ generate PDF/Excel
   ↓ email/Slack/WhatsApp delivery

[BI Export]
GET /reports/bi-export?format=powerbi&dataset=sales
   ↓ stream JSON/CSV/parquet
   ↓ auth via API key
```

---

## 4. Schema (إضافات)

```prisma
model Report {
  id              Int       @id @default(autoincrement())
  reportCode      String    @unique
  name            String
  description     String?
  
  category        String    // 'FINANCIAL' | 'SALES' | 'PURCHASES' | 'INVENTORY' | 'HR' | 'AI' | 'CUSTOM'
  
  type            String    // 'STANDARD' | 'CUSTOM' | 'SAVED_QUERY' | 'PIVOT'
  
  dataSource      String    // entity name or composite
  
  // For custom builder
  configuration   Json      // {dimensions, measures, filters, groupBy, sortBy}
  
  // Layout
  layoutType      String    @default("TABLE")  // TABLE | CHART | PIVOT | DASHBOARD
  chartConfig     Json?
  
  // Access
  ownerUserId     String?
  visibility      String    @default("PRIVATE")  // PRIVATE | TEAM | PUBLIC | ROLE_BASED
  allowedRoleIds  Int[]
  allowedUserIds  String[]
  
  // Schedule
  scheduleEnabled Boolean   @default(false)
  scheduleId      Int?
  
  // Stats
  runCount        Int       @default(0)
  lastRunAt       DateTime?
  
  createdAt       DateTime  @default(now())
  createdByUserId String
}

model ReportRun {
  id              BigInt    @id @default(autoincrement())
  reportId        Int
  
  parameters      Json
  result          Json?     // cached result
  
  format          String    // 'JSON' | 'PDF' | 'EXCEL' | 'CSV'
  fileUrl         String?
  
  rowCount        Int?
  durationMs      Int?
  
  triggeredBy     String    // 'MANUAL' | 'SCHEDULE' | 'API'
  userId          String?
  
  status          String    // 'SUCCESS' | 'FAILED'
  errorMessage    String?
  
  runAt           DateTime  @default(now())
}

model ReportSchedule {
  id              Int       @id @default(autoincrement())
  reportId        Int
  
  cronExpression  String
  
  enabled         Boolean   @default(true)
  
  recipients      Json      // {emails, slack, whatsapp}
  format          String    @default("PDF")
  
  parameters      Json?
  
  lastRunAt       DateTime?
  nextRunAt       DateTime?
  
  successCount    Int       @default(0)
  failureCount    Int       @default(0)
}

model Dashboard {
  id              Int       @id @default(autoincrement())
  dashboardCode   String    @unique
  name            String
  description     String?
  
  ownerUserId     String?
  visibility      String    @default("PRIVATE")
  
  layout          Json      // [{x, y, width, height, widgetType, widgetConfig}]
  
  refreshInterval Int?      // seconds, 0 = manual
  
  isHomeDefault   Boolean   @default(false)
  
  pinnedToRoles   Int[]
}

model DashboardWidget {
  id              Int       @id @default(autoincrement())
  widgetCode      String    @unique
  name            String
  
  type            String    // 'KPI' | 'CHART' | 'TABLE' | 'GAUGE' | 'MAP' | 'LIST' | 'IFRAME'
  category        String
  
  reportId        Int?      // backed by a report
  
  defaultConfig   Json
  
  applicableRoles String[]
}

model Kpi {
  id              Int       @id @default(autoincrement())
  kpiCode         String    @unique
  name            String
  description     String?
  
  category        String    // 'FINANCIAL' | 'OPERATIONAL' | 'CUSTOMER' | 'EMPLOYEE'
  
  formula         String    @db.Text  // SQL or expression
  
  unit            String?   // 'SAR' | '%' | 'days' | 'count'
  
  targetValue     Decimal?  @db.Decimal(20,4)
  thresholdYellow Decimal?  @db.Decimal(20,4)
  thresholdRed    Decimal?  @db.Decimal(20,4)
  direction       String    @default("HIGHER_IS_BETTER")  // HIGHER_IS_BETTER | LOWER_IS_BETTER
  
  refreshFrequency String   @default("DAILY")  // REAL_TIME | HOURLY | DAILY | WEEKLY
  
  lastValue       Decimal?  @db.Decimal(20,4)
  lastValueAt     DateTime?
}

model KpiAlert {
  id              Int       @id @default(autoincrement())
  kpiId           Int
  
  triggeredAt     DateTime  @default(now())
  value           Decimal   @db.Decimal(20,4)
  threshold       Decimal   @db.Decimal(20,4)
  severity        String    // 'WARNING' | 'CRITICAL'
  
  recipients      String[]
  acknowledgedAt  DateTime?
  resolvedAt      DateTime?
}

model BiConnection {
  id              Int       @id @default(autoincrement())
  tenantId        Int?
  
  name            String
  platform        String    // 'POWER_BI' | 'TABLEAU' | 'LOOKER' | 'METABASE' | 'GENERIC_API'
  
  apiKey          String    // encrypted
  permissions     String[]  // which datasets allowed
  
  active          Boolean   @default(true)
  
  lastConnectedAt DateTime?
  callsCount      BigInt    @default(0)
}

model ReportTemplate {
  id              Int       @id @default(autoincrement())
  name            String
  category        String
  industry        String?
  
  configuration   Json
  
  isOfficial      Boolean   @default(false)
}
```

---

## 5. Forms (8)

A: Custom Report Builder (drag-drop)
B: Schedule Setup
C: Dashboard Builder
D: Widget Configuration
E: KPI Definition
F: KPI Threshold Alert
G: BI Connection Setup
H: Filter Builder (advanced)

---

## 6. Tables (8)

A: All Reports
B: Run History
C: Scheduled Reports
D: Dashboards
E: Widgets Library
F: KPIs (current values)
G: KPI Alerts History
H: BI Connections

---

## 7. Buttons (28+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-report-create | + تقرير | 🟢 anyone |
| btn-report-run | تشغيل | 🟢 owner/viewer |
| btn-report-clone | استنساخ | ⬜ viewer |
| btn-report-share | مشاركة | 🟦 owner |
| btn-report-publish | نشر للجميع | 🟦 admin |
| btn-report-archive | أرشفة | 🟡 owner |
| btn-report-export-pdf | PDF | ⬜ viewer |
| btn-report-export-excel | Excel | ⬜ viewer |
| btn-report-export-csv | CSV | ⬜ viewer |
| btn-report-schedule | جدولة | 🟢 owner |
| btn-schedule-pause | إيقاف الجدولة | 🟡 owner |
| btn-schedule-run-now | تشغيل الآن | 🟦 owner |
| btn-dashboard-create | + لوحة | 🟢 anyone |
| btn-dashboard-add-widget | + widget | 🟢 owner |
| btn-dashboard-set-default | افتراضي | 🟦 self |
| btn-dashboard-share | مشاركة | 🟦 owner |
| btn-widget-config | إعدادات widget | 🟦 owner |
| btn-widget-resize | تغيير الحجم | ⬜ owner |
| btn-widget-remove | إزالة | 🔴 owner |
| btn-kpi-create | + KPI | 🟢 admin |
| btn-kpi-set-target | تعيين هدف | 🟦 cfo |
| btn-kpi-set-threshold | تعيين العتبات | 🟦 cfo |
| btn-kpi-alert-acknowledge | تأكيد | 🟢 receiver |
| btn-bi-connect-power-bi | ربط Power BI | 🟢 admin |
| btn-bi-connect-tableau | ربط Tableau | 🟢 admin |
| btn-bi-revoke-key | إلغاء المفتاح | 🔴 admin |
| btn-drill-down | تفصيل | ⬜ viewer |
| btn-pivot-flip | تبديل أبعاد | ⬜ viewer |

---

## 8. Search & Filters

- Reports: category, owner, visibility, scheduled
- Runs: report, status, date, user
- Dashboards: visibility, owner
- KPIs: category, breached, direction
- BI: platform, active

---

## 9. Reports (Standard 100+)

**Financial (25):** Trial Balance, P&L, BS, CF (direct/indirect), Equity Changes, AR Aging, AP Aging, Cash Position, Budget vs Actual, etc.

**Sales (15):** Sales Register, by Customer, by Product, by Salesperson, by Region, Margin Analysis, Forecast, Backlog, Quote Win Rate, etc.

**Purchases (10):** PO Aging, Spend by Category, Vendor Performance, 3WM Exceptions, etc.

**Inventory (12):** Stock Status, Movement Detail, Aging, Slow-Moving, Reorder, ABC, etc.

**HR (10):** Headcount, Payroll Summary, Attendance, Leave Liability, Turnover, etc.

**Operations (10):** Production Plan vs Actual, OEE, Quality, Maintenance, etc.

**Tax (5):** VAT Return, WHT Summary, Zakat, ZATCA Status, etc.

**Compliance (8):** Audit Trail, SoD Violations, Document Expiry, etc.

**AI (5):** AI Cost, Forecast Accuracy, Fraud Alerts, etc.

---

## 10. Dashboards

**Pre-built:**
- CFO Dashboard
- Sales Dashboard
- Operations Dashboard
- HR Dashboard
- AR/AP Dashboard
- Inventory Dashboard
- Manufacturing Dashboard
- Tax Compliance
- AI Insights
- Executive Summary

---

## 11. Notifications

- Scheduled report ran (success/failure)
- KPI threshold breached
- New report shared with you
- Dashboard updated
- BI connection issue

---

## 12. Permissions

| Action | User | Manager | Admin |
|--------|------|---------|-------|
| Run shared reports | ✓ | ✓ | ✓ |
| Create custom | ✓ | ✓ | ✓ |
| Share with team | ✗ | ✓ | ✓ |
| Publish public | ✗ | ✗ | ✓ |
| Schedule | own | own | all |
| KPI configuration | ✗ | ✗ | ✓ |
| BI connection | ✗ | ✗ | ✓ |

---

## 13. Integrations

- Power BI
- Tableau
- Looker
- Metabase
- Email + Slack + WhatsApp (delivery)
- Excel/Google Sheets export

---

## 14. Shortcuts

- `Ctrl+R` Run report
- `Ctrl+E` Export
- `Ctrl+D` Dashboard

---

## 15. Mobile / Print

- Mobile dashboards (responsive)
- Print: PDFs always print-ready
- Email reports auto-formatted

---

## 16. Audit

- Report runs logged
- Sensitive data access logged
- BI exports logged
- Schedule changes audited

---

## 17. Tests

```typescript
describe('Custom Report', () => { /* drag-drop, query gen */ })
describe('Scheduled', () => { /* cron, delivery */ })
describe('Drill-down', () => { /* link to source */ })
describe('Pivot', () => { /* cross-tab */ })
describe('KPI Threshold', () => { /* alerting */ })
describe('BI Export', () => { /* API auth, data */ })
describe('Multi-currency', () => { /* translation */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Report with millions of rows | streaming + pagination |
| Slow report | timeout + suggest optimization |
| Schedule recipient inactive | skip + alert owner |
| KPI formula error | flag + alert admin |
| BI key compromised | rotate + audit |
| Cross-tenant data in report | strict isolation |

---

**نهاية #41** • 8 سيناريوهات • 9 جداول • 8 forms • 8 grids • 28 button • 100+ standard reports
