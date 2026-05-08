# 82 — Global Search | البحث الشامل

## 🟠 الأولوية: عالي

## 🔍 الفجوات
- البحث محصور في كل صفحة
- لا global search (Cmd+K)
- لا fuzzy search
- لا Arabic search optimization
- لا facets

## 🎯 الخطة

### 82.1 — Search Engine Choice (3 أيام)
| الخيار | السعر | Arabic Support |
|--------|------|----------------|
| **Meilisearch** | مجاني (self-host) | جيد |
| **Typesense** | مجاني | جيد |
| **Elasticsearch** | عالي | ممتاز |
| **Algolia** | مكلف | ممتاز |
| **PostgreSQL FTS** | مجاني | جيد |

**التوصية:** Meilisearch (سهل، مجاني، أداء ممتاز)

### 82.2 — Indexes Setup (5 أيام)
```yaml
indexes:
  customers:
    fields: [name, nameEn, vatNumber, phone, email]
    searchable: [name, nameEn, vatNumber]
    filterable: [tenantId, isActive, segment]
    sortable: [name, createdAt, totalSales]

  invoices:
    fields: [invoiceNo, customerName, amount, date, status]
    searchable: [invoiceNo, customerName]
    filterable: [tenantId, status, dateRange]

  products:
    fields: [name, sku, barcode, description]
    searchable: [name, sku, barcode]

  employees, journals, etc...
```

### 82.3 — Real-time Indexing (4 أيام)
- Sync on create/update/delete
- Background re-indexing
- Failure handling

### 82.4 — Global Search UI (Cmd+K) (5 أيام)
- Modal triggered by Cmd+K / Ctrl+K
- Cross-entity search
- Recent searches
- Suggestions
- Keyboard navigation
- Quick actions

### 82.5 — Faceted Search (4 أيام)
- Filters (status, date, branch, amount range)
- Aggregations (count per facet)
- Multi-select

### 82.6 — Arabic Search Optimization (4 أيام)
- Tashkeel removal
- Alef variants normalization
- Hamza variations
- Synonyms (دكان، محل، متجر)
- Stemming
- Stop words

### 82.7 — Saved Searches (3 أيام)
- Save common queries
- Notifications when results change
- Share with team

### 82.8 — Search Analytics (3 أيام)
- Top searches
- Zero-result queries (gaps)
- Click-through rate
- Performance metrics

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Global search | لا | Cmd+K |
| Search latency | بطيء | < 50ms |
| Zero-result rate | غير مقاس | < 5% |
| User adoption | غير مقاس | > 70% |

## ⏱️ المدة: 31 يوم عمل
