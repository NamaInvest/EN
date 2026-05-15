# [MODULE_NAME] — Requirements / المتطلبات

> **Module Code**: `[MODULE_CODE]`
> **Priority**: 🔴 P0 / 🟠 P1 / 🟡 P2 / 🔵 P3
> **Estimated Effort**: [X] weeks
> **Owner**: [team/person]
> **Reference Systems**: SAP [module], Oracle [module], NetSuite [module]

---

## 1. الهدف والقيمة (Goal & Business Value)

### ما المشكلة؟
[وصف المشكلة الحالية في Namasoft]

### القيمة المضافة
- ✅ [قيمة 1]
- ✅ [قيمة 2]
- ✅ [قيمة 3]

### الامتثال
- ZATCA / SOCPA / PDPL / IFRS [رقم] / Saudi Labor Law

---

## 2. الجداول الرئيسية (Main Tables)

### Table 1: `[table_name]`
| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| id | String (cuid) | ✅ | auto | Primary key |
| tenantId | String | ✅ | - | Multi-tenant isolation |
| ... | ... | ... | ... | ... |

### Table 2: `[table_name_2]`
| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|

### Indexes
- `@@index([tenantId, createdAt])`
- `@@index([tenantId, status])`
- `@@unique([tenantId, code])`

---

## 3. الشاشات (UI Screens)

### Screen 1: List Page `/[module]`
**القوائم (Lists)**:
| Column | Sortable | Filterable | Description |
|--------|----------|-----------|-------------|
| Code | ✅ | ✅ | Document number |
| ... | ... | ... | ... |

**الأزرار (Buttons)**:
| Button | Action | Permission | Icon |
|--------|--------|-----------|------|
| New | Open create form | `[module].create` | + |
| Export | Download Excel/PDF | `[module].export` | ⬇ |
| Import | Upload CSV | `[module].import` | ⬆ |
| Bulk Actions | Multi-select operations | `[module].bulk` | ⋮ |

**الفلاتر (Filters)**:
- Date range
- Status (multi-select)
- Branch
- Created by
- Search (code, name, customer)

### Screen 2: Detail Page `/[module]/[id]`
[نفس البنية]

### Screen 3: Form Page `/[module]/new` و `/[module]/[id]/edit`

**الحقول (Fields)**:
| Field | Type | Required | Validation | Help text |
|-------|------|----------|-----------|-----------|
| code | text | auto | - | Auto-generated |
| name | text | ✅ | min 3, max 100 | Display name |
| ... | ... | ... | ... | ... |

**Tabs / Sections**:
1. Main Info
2. Details / Lines
3. Accounting
4. Attachments
5. History / Audit

---

## 4. الفريمات (UI Frames / Component Tree)

```
<ModulePage>
  <PageHeader title actions={[NewBtn, ExportBtn]} />
  <FiltersBar />
  <DataTable
    columns={[...]}
    rows={data}
    onRowClick={navigate}
    pagination
    sorting
    selection
  />
  <BulkActionsBar visible={hasSelection} />
</ModulePage>

<ModuleDetail>
  <DetailHeader breadcrumbs status actions />
  <Tabs>
    <Tab name="main"><MainInfo /></Tab>
    <Tab name="lines"><LinesTable /></Tab>
    <Tab name="accounting"><JournalView /></Tab>
    <Tab name="audit"><AuditTrail /></Tab>
  </Tabs>
</ModuleDetail>
```

---

## 5. القوائم الجانبية (Sidebar Menu)

```
[Module Group]
├── List / القائمة
├── New / جديد
├── Reports / التقارير
│   ├── Summary Report
│   ├── Detailed Report
│   └── Aging Report
├── Settings / الإعدادات
│   ├── Templates
│   ├── Numbering
│   └── Approval Rules
└── Audit Log / سجل التدقيق
```

---

## 6. الصلاحيات (Permissions)

| Permission Code | Description |
|----------------|-------------|
| `[module].view` | View list and details |
| `[module].create` | Create new records |
| `[module].edit` | Edit existing records (DRAFT only) |
| `[module].delete` | Soft delete |
| `[module].post` | Post to GL |
| `[module].reverse` | Create reversal |
| `[module].approve` | Approve workflow |
| `[module].export` | Export data |
| `[module].import` | Import data |
| `[module].admin` | Full admin |

---

## 7. State Machine

```
DRAFT → SUBMITTED → APPROVED → POSTED → [CLOSED | REVERSED]
                       ↓
                    REJECTED → DRAFT
```

---

## 8. Acceptance Criteria

- [ ] AC1: User can create new [entity] with required fields
- [ ] AC2: Validation prevents save with invalid data
- [ ] AC3: Numbering is auto-generated (zero-gap, SERIALIZABLE)
- [ ] AC4: Multi-tenant isolation enforced
- [ ] AC5: Audit trail captures all changes
- [ ] AC6: Approval workflow triggered as configured
- [ ] AC7: GL posting balanced (Debit = Credit, tolerance 0.01)
- [ ] AC8: Reversal creates new entry, never modifies posted
- [ ] AC9: Period close prevents posting to closed periods
- [ ] AC10: ZATCA/SOCPA/PDPL compliance verified

---

## 9. Out of Scope

- [ما لن يُنفّذ في هذه المرحلة]

---

## 10. Dependencies

- **Upstream**: [موديولات تعتمد هي عليها]
- **Downstream**: [موديولات سيعتمد عليها هذا الموديول]
- **External APIs**: [أي تكاملات خارجية]
