# User Stories: Inventory

### 2.3 Inventory — US-INV

#### US-INV-001 — إصدار حركة مخزون من بيع

```
AC:
  Scenario: Auto stock-out on invoice post
    Given item "Rice 5kg" qty 50 in warehouse "Main"
    And an invoice for 3 units posted
    Then stock movement = -3 in "Main" warehouse
    And remaining qty = 47
    And COGS journal: Dr COGS / Cr Inventory at average cost
```

#### US-INV-002 — تكلفة المتوسط المتحرك (Weighted Average)

```
AC:
  Scenario: Compute weighted avg cost
    Given existing stock: qty=10 @ 100 SAR (avg=100)
    When 5 units received at 110 SAR
    Then new avg = ((10*100) + (5*110)) / 15 = 103.33 SAR
    And next outflow uses 103.33 as cost
```

---
