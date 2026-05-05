# Industry: Real Estate & Property Management
## 1. Ready-made Prompt
"Build a Real Estate Vertical. Include Unit Management (Commercial/Residential), Lease Contracts with PDC (Post-Dated Checks) tracking, Facility Maintenance ticketing, and IFRS 16 lease accounting."

## 2. Work Scenario
Tenant signs 1-year lease. Hands over 4 PDCs. System records lease, schedules PDC deposit dates. Tenant opens a Maintenance Ticket for AC. Facility team resolves it, cost is charged to the Property owner's ledger.

## 3. Data Flow
`Property/Unit` -> `Lease Contract` -> `PDC Vault` -> `Amortization JEs (IFRS 16)` -> `Maintenance Ticket` -> `Owner Statement`.

## 4. UI / KPIs
- **UI:** Property Interactive Map, PDC Dashboard, Owner Portal.
- **KPIs:** Occupancy Rate, Rental Yield, Maintenance Cost per SqFt, Rent Arrears.