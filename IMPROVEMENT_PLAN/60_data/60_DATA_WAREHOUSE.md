# 60 — Data Warehouse | مستودع البيانات

## 🟠 الأولوية: عالي

## 🔍 الفجوات
- التقارير تذهب مباشرة على production DB → بطء
- لا historical analytics
- لا cross-tenant aggregations (للـ admin)
- لا data lineage

## 🎯 الخطة

### 60.1 — DWH Choice (3 أيام)
| الخيار | السعر | الميزات |
|--------|------|--------|
| **DuckDB + Parquet on R2** | مجاني | محلي، سريع |
| **BigQuery** | متغير | scalable |
| **Snowflake** | عالي | enterprise |
| **PostgreSQL replica + columnar** | منخفض | مع pg_analytics |

**التوصية:** DuckDB + Parquet على R2 للبداية، BigQuery لاحقاً.

### 60.2 — ETL Pipeline (10 أيام)
**Tools:**
- Airbyte (open source)
- dbt (transformations)
- Dagster (orchestration)

```yaml
# dbt project structure
models/
  ├── staging/        # Raw → cleaned
  │   ├── stg_invoices.sql
  │   ├── stg_journals.sql
  │   └── ...
  ├── intermediate/   # Joined + filtered
  │   └── int_invoice_with_customer.sql
  └── marts/          # Business-ready
      ├── finance/
      │   ├── fct_revenue.sql
      │   ├── fct_expenses.sql
      │   └── dim_account.sql
      ├── sales/
      └── inventory/
```

### 60.3 — Star Schema (5 أيام)
- Facts (transactions, snapshots)
- Dimensions (date, customer, product, employee)
- Slowly Changing Dimensions (SCD Type 2)

### 60.4 — Real-time Sync (5 أيام)
- CDC (Change Data Capture) من PostgreSQL
- Debezium → Kafka → DWH
- Or simpler: Periodic dbt runs (every hour)

### 60.5 — Multi-tenant Modeling (4 أيام)
- tenantId in every fact/dim
- Row-level security
- Tenant isolation guarantees

### 60.6 — Aggregates & Materialized Views (4 أيام)
- Daily revenue per branch
- Monthly P&L
- Product performance
- Customer LTV

### 60.7 — Data Quality Tests (4 أيام)
- dbt tests (not_null, unique, accepted_values)
- Custom tests (balance sheet must reconcile)
- Alerts on failure
- Daily quality report

### 60.8 — Documentation (3 أيام)
- dbt docs
- Data dictionary
- Lineage graphs

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Report query time | seconds | < 1s |
| Production DB load | high | reduced |
| Historical depth | عشوائي | تلقائي إلى parquet |
| Data freshness | على الفور | < 1 hour |

## ⏱️ المدة: 38 يوم عمل
