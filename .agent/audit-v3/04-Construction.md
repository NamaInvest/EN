# Industry: Construction & Contracting
## 1. Ready-made Prompt
"Build a Construction Vertical. Include BOQ (Bill of Quantities), Project Progress Billing (Percentage of Completion), Subcontractor retention tracking, Equipment/Fleet allocation, and granular Project P&L."

## 2. Work Scenario
Project awarded based on BOQ. Subcontractors hired with 10% retention. Project manager submits weekly completion certificates. System generates Progress Invoices. Equipment usage is depreciated daily against the project cost center.

## 3. Data Flow
`BOQ/Contract` -> `Milestone/Completion %` -> `Progress Invoice` -> `Subcontractor Bill + Retention` -> `Project P&L JE`.

## 4. UI / KPIs
- **UI:** WBS (Work Breakdown Structure) Tree, BOQ Uploader, Subcontractor Ledger.
- **KPIs:** Cost Performance Index (CPI), Schedule Performance Index (SPI), Earned Value (EV).