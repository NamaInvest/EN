# Industry: Retail (Chains)
## 1. Ready-made Prompt
"Build a comprehensive Retail Chain Vertical for NamaSoft ERP. Include Multi-branch POS, centralized inventory with auto-replenishment, barcode/RFID scanning support, loyalty programs, and daily shift reconciliation. The UI must be optimized for touchscreen tablets."

## 2. Work Scenario
A customer enters branch A, purchases via POS. System deducts stock from Branch A, adds loyalty points, and checks if stock is below the minimum limit. If yes, it auto-generates an internal transfer request from the Main Warehouse. Shift closes at midnight, auto-posting consolidated JEs.

## 3. Data Flow
`POS Transaction` -> `Inventory Deduct` -> `Loyalty Update` -> `ZATCA E-Invoice` -> `Daily Shift Close` -> `GL Consolidation`.

## 4. UI / KPIs
- **UI:** High-contrast Touch POS, Shift Monitor Dashboard.
- **KPIs:** Sales per Square Meter, Sell-Through Rate, Footfall Conversion, Average Basket Size.