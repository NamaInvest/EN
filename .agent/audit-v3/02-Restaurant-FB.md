# Industry: Restaurant / F&B
## 1. Ready-made Prompt
"Build a Restaurant/F&B Vertical for NamaSoft ERP. Include Table Management, Kitchen Display System (KDS), Recipe costing (BOM for food), aggregators integration (Jahez, HungerStation), and expiration tracking for perishables."

## 2. Work Scenario
Waiter takes order on tablet. Order hits KDS. Kitchen prepares. Raw materials (ingredients) are deducted from sub-inventory based on Recipe BOM. Customer pays (split bill). Integration pulls external orders from Jahez directly into KDS.

## 3. Data Flow
`Table Order/Jahez` -> `KDS Queue` -> `Recipe BOM Deduct (FIFO)` -> `Payment/Split Bill` -> `ZATCA B2C` -> `COGS JE`.

## 4. UI / KPIs
- **UI:** Visual Floor Plan (Tables), KDS Grid, Recipe Builder.
- **KPIs:** RevPASH (Revenue Per Available Seat Hour), Food Cost Percentage, Table Turnover Rate.