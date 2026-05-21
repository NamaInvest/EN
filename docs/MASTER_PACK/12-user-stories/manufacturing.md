# User Stories: Manufacturing

### 2.4 Manufacturing — US-MFG

#### US-MFG-001 — إنشاء أمر تصنيع من BOM

```
As a production planner
I want to issue a Manufacturing Order from a BOM
So that materials are reserved and routing is scheduled.

AC:
  Scenario: Issue MO
    Given BOM for "Cake 1kg" requires: flour 0.5kg, sugar 0.3kg, eggs 5
    When I create MO for qty=10
    Then material requirement = flour 5kg, sugar 3kg, eggs 50
    And availability check runs against current stock
    And shortage list (if any) is shown
    And MO status = "PLANNED"
```

---
