# User Stories: Reports

### 2.8 Reports — US-RPT

#### US-RPT-001 — قائمة الدخل (P&L)

```
AC:
  Scenario: Generate P&L for period
    Given posted JEs in 2026-Q1
    When I run P&L for 2026-Q1
    Then I see:
      Revenue: sum of 4xxx
      Less: Sales returns (4200 contra)
      Net Revenue
      Cost of Goods Sold (5100)
      Gross Profit
      Operating Expenses (5xxx other)
      Operating Income
      ...
    And I can export to PDF (bilingual) or Excel
```

---
