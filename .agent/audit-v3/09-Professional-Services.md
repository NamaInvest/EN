# Industry: Professional Services (Law/Consulting)
## 1. Ready-made Prompt
"Build a Professional Services Vertical. Include Billable Hours tracking, Retainer Management, Matter/Case Management, Expense disbursement (recharging clients), and WIP (Work in Progress) Revenue Recognition."

## 2. Work Scenario
Lawyer logs 4 hours on Case X. Adds $50 court fee expense. System draws from the client's $10,000 Retainer balance. At month-end, system recognizes revenue for the hours worked, generates invoice for expenses, and alerts if retainer is low.

## 3. Data Flow
`Retainer Deposit` -> `Timesheet (Billable Hours)` -> `Expense Disbursement` -> `Revenue Recognition JE` -> `Client Invoice`.

## 4. UI / KPIs
- **UI:** Timesheet Grid, Kanban Board for Cases, Client Trust Account Ledger.
- **KPIs:** Utilization Rate, Realization Rate, Revenue per Employee, WIP-to-Cash Ratio.