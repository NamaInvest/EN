# Industry: Healthcare / Clinic
## 1. Ready-made Prompt
"Build a Healthcare Clinic Vertical. Include Electronic Medical Records (EMR), Appointment scheduling, Insurance Claims (TPA integration), Pharmacy dispensing with drug interactions, and Doctor commission calculation."

## 2. Work Scenario
Patient books via portal. Reception verifies Insurance. Doctor writes EMR and prescribes medication. Pharmacy dispenses medicine (deducting batches). System generates Claim to Bupa/Tawuniya and calculates doctor's 15% cut.

## 3. Data Flow
`Appointment` -> `Insurance Verify` -> `EMR/Diagnosis` -> `Prescription/Pharmacy` -> `Insurance Claim` -> `Doctor Commission JE`.

## 4. UI / KPIs
- **UI:** Visual Calendar, EMR Charting Screen, ICD-10 Coding Form.
- **KPIs:** Patient Wait Time, Claim Rejection Rate, Revenue per Doctor, Bed Occupancy.