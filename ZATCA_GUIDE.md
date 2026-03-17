# ZATCA Phase 2 E-Invoicing — Complete Integration Guide

> This guide contains everything needed to set up ZATCA Phase 2 e-invoicing
> on a new deployment. Save this file in every project that needs ZATCA.

## Quick Setup (3 Steps)
1. `npm install qrcode zatca-xml-js`
2. Run `zatca-migration.sql` on PostgreSQL
3. Fill settings page (tax number, CRN, address, environment)

---

## Required Settings

| Setting Key | Example | Description |
|---|---|---|
| `tax_number` | `31133090250003` | 15-digit VAT number (starts & ends with 3) |
| `zatca_crn` | `7016739265` | Commercial Registration Number |
| `company_name_en` | `Spider Company for Car Services` | English company name |
| `zatca_environment` | `production` | sandbox / simulation / production |
| `zatca_street` | `King Abdulaziz St` | Street name |
| `zatca_district` | `Al-Khalidiya` | District |
| `zatca_city` | `Najran` | City |
| `zatca_building` | `8809` | Building number |
| `zatca_postal_code` | `662611` | Postal code |

---

## API URLs

```
Sandbox:    https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal
Simulation: https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation
Production: https://gw-fatoora.zatca.gov.sa/e-invoicing/core
```

> ⚠️ zatca-xml-js v0.1.9 uses outdated URL `gw-apic-gov.gazt.gov.sa`
> Always use our own `callZATCAAPI()` function with the correct URLs above.

---

## Environment ↔ OTP Matching (CRITICAL!)

| Environment | OTP Source | Test OTP |
|---|---|---|
| `sandbox` | `sandbox.zatca.gov.sa` | `123345` |
| `simulation` | simulation portal | - |
| `production` | `fatoora.zatca.gov.sa` | Generate fresh! |

> **#1 cause of `Invalid-OTP`**: Environment doesn't match OTP portal!

---

## Onboarding Flow (4 Steps)

```
Step 1: Settings    → Save company data (tax#, CRN, address)
Step 2: OTP+CSR     → Generate OTP from portal → Send to /compliance
Step 3: Compliance  → Sign 3 test invoices (388, 381, 383) → /compliance/invoices
Step 4: Production  → Send requestID → /production/csids → ✅ Connected!
```

### Step 2 Technical Details:
1. Generate CSR via `zatca-xml-js` EGS class
2. Send `{ csr: base64CSR }` to `/compliance` with header `OTP: <otp>`
3. Save `binarySecurityToken`, `secret`, `requestID`
4. Status → `compliance_csid`

### Step 3 Technical Details:
1. Sign 3 invoices using `zatca-xml-js` signing
2. Send each to `/compliance/invoices`
3. All must PASS → Status → `compliance_passed`

### Step 4 Technical Details:
1. Send `compliance_request_id` to `/production/csids`
2. Get Production Token + Secret
3. Status → `connected` ✅

---

## CSR Config (from ZATCA SDK)

```properties
csr.common.name=PRD-{CRN}-{TAX}       # TST- for sandbox/simulation
csr.serial.number=1-{ORG}|2-{BRANCH}|3-{UUID}
csr.organization.identifier={TAX}
csr.organization.unit.name={BRANCH}
csr.organization.name={ORG_EN}
csr.country.name=SA
csr.invoice.type=1100
csr.location.address={ADDRESS}
csr.industry.business.category={INDUSTRY}
```

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Invalid-OTP` | Environment ≠ OTP portal | Match them! |
| `ENOTFOUND gw-apic-gov.gazt.gov.sa` | Library old URL | Use callZATCAAPI |
| `Invalid CSR: PKCS10csr` | Bad CSR format | Use zatca-xml-js EGS |
| `requestID: -2` | Test cert + prod endpoint | Same env everywhere |
| `arToEnMap corrupted` | PowerShell pipe upload | Use SCP only |
| `string too long` | serialNumber > 64 chars | Shorten org name |
| `502 Bad Gateway` | Build failed | `npm run build && pm2 restart` |

---

## Key Dependencies
- `zatca-xml-js` — CSR generation + invoice signing
- `qrcode` — QR code image generation
- `crypto` (builtin) — ECDSA signing, SHA-256
- OpenSSL on server — backup CSR generation

---

## Deploy Checklist
- [ ] `npm install qrcode zatca-xml-js`
- [ ] `zatca_settings` table exists in DB
- [ ] Settings page has ZATCA fields
- [ ] `zatca_environment` matches OTP portal
- [ ] `route.ts` uses `callZATCAAPI` (not library's API)
- [ ] `arToEnMap` has Arabic characters (not empty `{}`)
- [ ] Files uploaded via SCP (never PowerShell pipe)
