# User Stories: Accounting

### 2.6 Accounting — US-ACC

#### US-ACC-001 — قيد يدوي

```
AC:
  Scenario: Save unbalanced JE
    Given a JE draft with Dr 1000 / Cr 900
    When I attempt to save
    Then I get "JOURNAL_NOT_BALANCED: difference 100 SAR"
    And the entry is NOT saved

  Scenario: Post balanced JE
    Given a JE with Dr 1000 / Cr 1000
    When I post
    Then status = POSTED
    And the entry shows in trial balance immediately

  Scenario: Reverse a posted JE
    Given a posted JE
    When I click Reverse
    Then a new JE is created mirroring the original (swapped Dr/Cr)
    And both are linked
    And the original JE remains unchanged
```

#### US-ACC-002 — إقفال فترة محاسبية

```
AC:
  Scenario: Close period with all checklist items passed
    Given period 2026-04 has:
      - 0 draft invoices in this period
      - All bank recs done
      - FX revaluation run
      - All AR/AP aged correctly
    When I click "Close period"
    Then status = CLOSED
    And no further JEs can post to 2026-04
    And the next period 2026-05 opens automatically
```

---
