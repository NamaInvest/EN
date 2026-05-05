const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '.agent', 'audit-v3');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const files = {
  'README.md': `# V3 Vertical Industry Solutions Audit
This directory contains the master blueprints for transitioning NamaSoft ERP into 9 specialized Industry Vertical Solutions. Each file acts as a standalone blueprint comprising:
1. **Ready-made Prompt** for generating the code.
2. **Work Scenario (Business Logic).**
3. **Data Flow & Schema Requirements.**
4. **Tailored UI/Forms/KPIs.**`,

  '01-Retail.md': `# Industry: Retail (Chains)
## 1. Ready-made Prompt
"Build a comprehensive Retail Chain Vertical for NamaSoft ERP. Include Multi-branch POS, centralized inventory with auto-replenishment, barcode/RFID scanning support, loyalty programs, and daily shift reconciliation. The UI must be optimized for touchscreen tablets."

## 2. Work Scenario
A customer enters branch A, purchases via POS. System deducts stock from Branch A, adds loyalty points, and checks if stock is below the minimum limit. If yes, it auto-generates an internal transfer request from the Main Warehouse. Shift closes at midnight, auto-posting consolidated JEs.

## 3. Data Flow
\`POS Transaction\` -> \`Inventory Deduct\` -> \`Loyalty Update\` -> \`ZATCA E-Invoice\` -> \`Daily Shift Close\` -> \`GL Consolidation\`.

## 4. UI / KPIs
- **UI:** High-contrast Touch POS, Shift Monitor Dashboard.
- **KPIs:** Sales per Square Meter, Sell-Through Rate, Footfall Conversion, Average Basket Size.`,

  '02-Restaurant-FB.md': `# Industry: Restaurant / F&B
## 1. Ready-made Prompt
"Build a Restaurant/F&B Vertical for NamaSoft ERP. Include Table Management, Kitchen Display System (KDS), Recipe costing (BOM for food), aggregators integration (Jahez, HungerStation), and expiration tracking for perishables."

## 2. Work Scenario
Waiter takes order on tablet. Order hits KDS. Kitchen prepares. Raw materials (ingredients) are deducted from sub-inventory based on Recipe BOM. Customer pays (split bill). Integration pulls external orders from Jahez directly into KDS.

## 3. Data Flow
\`Table Order/Jahez\` -> \`KDS Queue\` -> \`Recipe BOM Deduct (FIFO)\` -> \`Payment/Split Bill\` -> \`ZATCA B2C\` -> \`COGS JE\`.

## 4. UI / KPIs
- **UI:** Visual Floor Plan (Tables), KDS Grid, Recipe Builder.
- **KPIs:** RevPASH (Revenue Per Available Seat Hour), Food Cost Percentage, Table Turnover Rate.`,

  '03-Manufacturing.md': `# Industry: Manufacturing
## 1. Ready-made Prompt
"Build an Advanced Manufacturing Vertical. Include Multi-level BOMs, MRP Engine (Material Requirements Planning), Shop Floor Routing, Work Centers capacity, Quality Control (In-line & Final), and Standard vs Actual Costing variance analysis."

## 2. Work Scenario
Demand Forecast triggers MRP. MRP creates PRs for raw materials and Work Orders. Floor manager assigns Work Order to Machine A. Time & materials are tracked. QC inspects intermediate goods. Finished Goods are received into WMS, calculating cost variances.

## 3. Data Flow
\`Forecast/SO\` -> \`MRP\` -> \`Work Order\` -> \`WIP Inventory\` -> \`QC Inspection\` -> \`Finished Goods\` -> \`Cost Variance JE\`.

## 4. UI / KPIs
- **UI:** Gantt Chart Scheduler, Work Center Touch-panel, QC Checklist Forms.
- **KPIs:** OEE (Overall Equipment Effectiveness), Scrap Rate, Cycle Time, Yield Variance.`,

  '04-Construction.md': `# Industry: Construction & Contracting
## 1. Ready-made Prompt
"Build a Construction Vertical. Include BOQ (Bill of Quantities), Project Progress Billing (Percentage of Completion), Subcontractor retention tracking, Equipment/Fleet allocation, and granular Project P&L."

## 2. Work Scenario
Project awarded based on BOQ. Subcontractors hired with 10% retention. Project manager submits weekly completion certificates. System generates Progress Invoices. Equipment usage is depreciated daily against the project cost center.

## 3. Data Flow
\`BOQ/Contract\` -> \`Milestone/Completion %\` -> \`Progress Invoice\` -> \`Subcontractor Bill + Retention\` -> \`Project P&L JE\`.

## 4. UI / KPIs
- **UI:** WBS (Work Breakdown Structure) Tree, BOQ Uploader, Subcontractor Ledger.
- **KPIs:** Cost Performance Index (CPI), Schedule Performance Index (SPI), Earned Value (EV).`,

  '05-Healthcare-Clinic.md': `# Industry: Healthcare / Clinic
## 1. Ready-made Prompt
"Build a Healthcare Clinic Vertical. Include Electronic Medical Records (EMR), Appointment scheduling, Insurance Claims (TPA integration), Pharmacy dispensing with drug interactions, and Doctor commission calculation."

## 2. Work Scenario
Patient books via portal. Reception verifies Insurance. Doctor writes EMR and prescribes medication. Pharmacy dispenses medicine (deducting batches). System generates Claim to Bupa/Tawuniya and calculates doctor's 15% cut.

## 3. Data Flow
\`Appointment\` -> \`Insurance Verify\` -> \`EMR/Diagnosis\` -> \`Prescription/Pharmacy\` -> \`Insurance Claim\` -> \`Doctor Commission JE\`.

## 4. UI / KPIs
- **UI:** Visual Calendar, EMR Charting Screen, ICD-10 Coding Form.
- **KPIs:** Patient Wait Time, Claim Rejection Rate, Revenue per Doctor, Bed Occupancy.`,

  '06-Education-School.md': `# Industry: Education / School
## 1. Ready-made Prompt
"Build an Education Vertical. Include Student Information System (SIS), Academic Terms, Bus Routing, Tuition Installments with strict Dunning, and LMS (Learning Management System) integration."

## 2. Work Scenario
Parent enrolls student. System creates Tuition Invoice split into 3 installments. Student assigned to Class 4A and Bus Route B. If installment is late, Dunning engine restricts access to LMS portal automatically.

## 3. Data Flow
\`Enrollment\` -> \`Class/Bus Assignment\` -> \`Installment Plan\` -> \`Dunning/Collection\` -> \`LMS Access Control\`.

## 4. UI / KPIs
- **UI:** Student 360 Profile, Gradebook, Bus Map Tracking, Parent Billing Portal.
- **KPIs:** Collection Rate, Dropout Rate, Average Class Size, Student-to-Teacher Ratio.`,

  '07-Real-Estate.md': `# Industry: Real Estate & Property Management
## 1. Ready-made Prompt
"Build a Real Estate Vertical. Include Unit Management (Commercial/Residential), Lease Contracts with PDC (Post-Dated Checks) tracking, Facility Maintenance ticketing, and IFRS 16 lease accounting."

## 2. Work Scenario
Tenant signs 1-year lease. Hands over 4 PDCs. System records lease, schedules PDC deposit dates. Tenant opens a Maintenance Ticket for AC. Facility team resolves it, cost is charged to the Property owner's ledger.

## 3. Data Flow
\`Property/Unit\` -> \`Lease Contract\` -> \`PDC Vault\` -> \`Amortization JEs (IFRS 16)\` -> \`Maintenance Ticket\` -> \`Owner Statement\`.

## 4. UI / KPIs
- **UI:** Property Interactive Map, PDC Dashboard, Owner Portal.
- **KPIs:** Occupancy Rate, Rental Yield, Maintenance Cost per SqFt, Rent Arrears.`,

  '08-Distribution-Wholesale.md': `# Industry: Distribution / Wholesale
## 1. Ready-made Prompt
"Build a Wholesale Distribution Vertical. Include Route Accounting (Van Sales), B2B Credit Limits, Volume Tiered Pricing, WMS with 3D Bin Locations, and Advanced Replenishment (Min/Max)."

## 2. Work Scenario
Sales rep visits B2B client. Uses mobile app to check client's Credit Limit. Places bulk order with Tier-3 volume discount. WMS directs forklift to specific Aisle/Bin. Fleet delivers and collects payment, updating credit limit instantly.

## 3. Data Flow
\`B2B Order (Mobile)\` -> \`Credit Check\` -> \`WMS Pick/Pack (Bin)\` -> \`Fleet Dispatch\` -> \`Proof of Delivery\` -> \`AR Update\`.

## 4. UI / KPIs
- **UI:** 3D Warehouse Map, B2B Pricing Matrix, Driver Mobile Interface.
- **KPIs:** Order Fill Rate, Order Cycle Time, Inventory Turnover, Gross Margin Return on Investment (GMROI).`,

  '09-Professional-Services.md': `# Industry: Professional Services (Law/Consulting)
## 1. Ready-made Prompt
"Build a Professional Services Vertical. Include Billable Hours tracking, Retainer Management, Matter/Case Management, Expense disbursement (recharging clients), and WIP (Work in Progress) Revenue Recognition."

## 2. Work Scenario
Lawyer logs 4 hours on Case X. Adds $50 court fee expense. System draws from the client's $10,000 Retainer balance. At month-end, system recognizes revenue for the hours worked, generates invoice for expenses, and alerts if retainer is low.

## 3. Data Flow
\`Retainer Deposit\` -> \`Timesheet (Billable Hours)\` -> \`Expense Disbursement\` -> \`Revenue Recognition JE\` -> \`Client Invoice\`.

## 4. UI / KPIs
- **UI:** Timesheet Grid, Kanban Board for Cases, Client Trust Account Ledger.
- **KPIs:** Utilization Rate, Realization Rate, Revenue per Employee, WIP-to-Cash Ratio.`
};

Object.entries(files).forEach(([file, content]) => {
  fs.writeFileSync(path.join(dir, file), content, 'utf8');
});

console.log('V3 Industry Verticals Audit Generated Successfully (10 Files).');
