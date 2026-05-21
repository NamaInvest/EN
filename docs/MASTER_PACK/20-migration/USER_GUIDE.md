# Data Migration User Guide

## Overview
This guide provides instructions on how to migrate your existing ERP data into Namasoft. We support importing data from systems like Wafeq, Quickbooks, Zoho, and Daftra.

## Steps for Migration
1. **Export Data:** Export your data from your legacy system into CSV format.
2. **Upload & Map:** Go to `/admin/migration`. Select your source system and upload the files.
3. **Dry Run (Preview):** Click "Dry Run" to simulate the migration. The system will:
   - Validate the structure.
   - Flag any missing IDs or format issues (e.g., invalid VAT numbers).
   - Ensure the trial balance remains balanced.
4. **Fix Errors:** Fix any highlighted errors in the original CSV files or in the UI mapping.
5. **Execute:** Once the Dry Run shows 0 errors, click "Actually Migrate".
6. **Rollback:** If you encounter unexpected behavior, you can trigger a rollback within 7 days.

## Data Mappings Required
- **Chart of Accounts (COA):** Needs to be mapped to the SOCPA standards.
- **Customers & Suppliers:** Ensure VAT IDs are present for B2B.

## Support
For complex Oracle or SAP migrations, contact Namasoft enterprise support for custom scripts.
