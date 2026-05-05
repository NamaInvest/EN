# Industry: Manufacturing
## 1. Ready-made Prompt
"Build an Advanced Manufacturing Vertical. Include Multi-level BOMs, MRP Engine (Material Requirements Planning), Shop Floor Routing, Work Centers capacity, Quality Control (In-line & Final), and Standard vs Actual Costing variance analysis."

## 2. Work Scenario
Demand Forecast triggers MRP. MRP creates PRs for raw materials and Work Orders. Floor manager assigns Work Order to Machine A. Time & materials are tracked. QC inspects intermediate goods. Finished Goods are received into WMS, calculating cost variances.

## 3. Data Flow
`Forecast/SO` -> `MRP` -> `Work Order` -> `WIP Inventory` -> `QC Inspection` -> `Finished Goods` -> `Cost Variance JE`.

## 4. UI / KPIs
- **UI:** Gantt Chart Scheduler, Work Center Touch-panel, QC Checklist Forms.
- **KPIs:** OEE (Overall Equipment Effectiveness), Scrap Rate, Cycle Time, Yield Variance.