# User Stories: ZATCA

### 2.7 ZATCA — US-ZAT

#### US-ZAT-001 — متسلسل ICV بدون فجوات

```
AC:
  Scenario: Sequential ICV
    Given last invoice ICV = 999
    When I post a new invoice
    Then new invoice's ICV = 1000
    And no gaps in ICV history (verified by audit query)
```

---
