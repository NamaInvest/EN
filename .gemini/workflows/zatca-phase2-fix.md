---
description: Complete ZATCA Phase 2 integration from scratch - CSR generation, onboarding, and QR code setup
---

# ZATCA Phase 2 Complete Setup

## Prerequisites
// turbo-all

1. Install required npm packages:
```bash
npm install qrcode zatca-xml-js
```

2. Verify `zatca_settings` table exists in PostgreSQL:
```sql
-- Run zatca-migration.sql from ZATCA_Kit if table doesn't exist
-- Key columns: seller_name, seller_name_en, tax_number, commercial_reg,
--   street, district, city, city_en, postal_code, building_number,
--   certificate, private_key, csid, csid_secret, environment,
--   onboarding_status, phase, invoice_type_code, location_address
```

3. Verify settings have required ZATCA fields:
```sql
SELECT key, value FROM settings WHERE key IN (
  'zatca_enabled', 'tax_number', 'zatca_crn', 'zatca_environment',
  'zatca_street', 'zatca_district', 'zatca_city', 'zatca_building',
  'zatca_postal_code', 'company_name_en'
);
```

## Environment & OTP Matching (CRITICAL!)

> The #1 cause of `Invalid-OTP` is ENVIRONMENT MISMATCH.

| Environment Setting | API Endpoint | OTP Source |
|---|---|---|
| `sandbox` | `/e-invoicing/developer-portal` | `sandbox.zatca.gov.sa` |
| `simulation` | `/e-invoicing/simulation` | simulation portal |
| `production` | `/e-invoicing/core` | `fatoora.zatca.gov.sa` |

**OTP must be from the SAME portal as the environment setting!**

## API URLs (gw-fatoora.zatca.gov.sa)
```
Sandbox:    https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal
Simulation: https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation
Production: https://gw-fatoora.zatca.gov.sa/e-invoicing/core
```

> WARNING: The `zatca-xml-js` library v0.1.9 uses outdated URL `gw-apic-gov.gazt.gov.sa`.
> ALWAYS use our own `callZATCAAPI` function with correct URLs above.

## Onboarding Flow (4 Steps)

### Step 1: Save Settings
- Fill all fields in settings page (tax number, CRN, address, environment)
- `zatca_settings` syncs automatically from main `settings` table

### Step 2: Onboard with OTP
1. Go to the matching OTP portal (see table above)
2. Login → Onboard New Solution Unit → Generate OTP
3. **IMMEDIATELY** enter OTP in website and click "ربط مع ZATCA"
4. Production OTPs expire in **minutes** - be fast!
5. On success: status changes to `compliance_csid`

### Step 3: Compliance Check
- System sends 3 test invoices (388, 381, 383) to ZATCA
- All must pass → status becomes `compliance_passed`

### Step 4: Production CSID
- System sends `compliance_request_id` to `/production/csids`
- Gets Production Token → status becomes `connected` ✅

## CSR Config Fields (from ZATCA SDK)
```properties
csr.common.name=PRD-{CRN}-{TAX_NUMBER}   # TST- for sandbox
csr.serial.number=1-{ORG}|2-{BRANCH}|3-{UUID}
csr.organization.identifier={TAX_NUMBER}
csr.organization.unit.name={BRANCH_NAME}
csr.organization.name={ORG_NAME_EN}
csr.country.name=SA
csr.invoice.type=1100
csr.location.address={LOCATION_ADDRESS}
csr.industry.business.category={INDUSTRY}
```

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Invalid-OTP` | Environment doesn't match OTP portal | Match environment setting with portal |
| `ENOTFOUND gw-apic-gov.gazt.gov.sa` | zatca-xml-js using old URL | Use our callZATCAAPI, not library's |
| `Invalid CSR` | OpenSSL subjectAltName fails | Use zatca-xml-js EGS for CSR |
| `requestID: -2` | Test cert with production endpoint | Use same environment everywhere |
| `string too long` | serialNumber > 64 chars | Shorten org/branch names |
| `arToEnMap corrupted` | File upload via PowerShell pipe | Always use SCP, never pipe |

## Key Files
- `src/app/api/zatca/route.ts` — All ZATCA logic
- `ZATCA_Kit/zatca-routes.js` — Reference implementation
- `ZATCA_Kit/zatca-sign-invoice.js` — Invoice signing subprocess
- `ZATCA_Kit/zatca-migration.sql` — Database schema
