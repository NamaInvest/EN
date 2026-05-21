# User Stories: Payroll

### 2.5 Payroll — US-PAY

#### US-PAY-001 — تشغيل دورة رواتب شهرية

```
As an HR admin
I want to run monthly payroll
So that all employees are paid accurately and GOSI/SANED are deducted.

AC:
  Scenario: Run May 2026 payroll
    Given 25 active employees with valid contracts
    When I run pay for period 2026-05
    Then each employee gets a payslip with:
      - Gross salary (per contract)
      - GOSI 9% deduction (employee)
      - SANED 1% deduction (Saudi only)
      - Net salary
    And employer GOSI 9% + SANED 1% accrued
    And one JE posts:
      Dr Salaries Expense (gross)
      Dr Employer GOSI Expense
      Cr Salaries Payable
      Cr GOSI Payable
      Cr SANED Payable
    And WPS SIF file is ready to download

  Scenario: Cannot run payroll twice
    Given pay run for 2026-05 status=POSTED
    When I attempt to re-run
    Then I get "Period 2026-05 already run; create adjustment instead"
```

---
