# User Stories: POS

### 2.2 POS — US-POS

#### US-POS-001 — فتح وردية كاشير

```
As a cashier
I want to open a session with a starting cash float
So that variance is calculated correctly at end of shift.

AC:
  Scenario: Open session
    Given no open session for cashier in this terminal
    When I enter starting float = 500 SAR
    Then a new session is created (status=OPEN)
    And starting cash = 500 SAR is recorded
    And I can begin sales

  Scenario: Cannot open second session
    Given I already have an OPEN session
    When I try to open another
    Then I get "Already open: session #1234, please close it first"
```

#### US-POS-002 — إغلاق الوردية وحساب الفروقات

```
AC:
  Scenario: End-of-shift cash count
    Given session opened with float=500 and cash sales=2350
    When I close session and declare cash on hand = 2840
    Then variance = 2840 - (500 + 2350) = -10 SAR (short)
    And session status = "CLOSED"
    And a JE posts the cash difference to "Cash Over/Short"
```

---
