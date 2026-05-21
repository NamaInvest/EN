# Migration Cockpit - User Guide

## Overview
The Namasoft Migration Cockpit is designed to safely import your historical data from competitor ERP systems (QuickBooks, Wafeq, Daftra, SAP) into Namasoft.

## The "Dry-Run First" Principle
By default, **ALL** migrations run in "Dry-Run" mode first. 
In this mode, the system will:
1. Parse your uploaded files.
2. Verify mapping of Chart of Accounts (COA) to the Saudi SOCPA standards.
3. Validate data integrity (e.g. VAT numbers, required fields).
4. Simulate the creation of journal entries.
**It will NOT write anything to the database.**

## Step-by-Step Guide

### 1. Preparation
Download the corresponding template for your source system from the `templates/` folder (e.g., `coa-mapping-wafeq.xlsx`). 
Ensure your accounts are mapped correctly to Namasoft's default SOCPA tree.

### 2. Upload Data
Go to **Admin > Migration Cockpit** (`/admin/migration`).
Select your Source System, upload the ZIP or CSV files exported from your old system, and click **Start Migration**.

### 3. Review Results
The system will process the dry run. Check the table at the bottom of the page.
If the status is `COMPLETED_DRY_RUN` with 0 errors, you are safe to proceed.
If there are errors, download the error log, fix the data in your old system or Excel, and re-upload.

### 4. Execute Actual Migration
Once the dry-run is clean, click **Execute Actual**. The system will now commit the data to the database in batches.
A final `Trial Balance` validation script (`validate.ts`) will run automatically to ensure debits and credits match perfectly.

### 5. Rollback
If you discover a fundamental mistake after the migration, you have 7 days to request a rollback. Click **Rollback** on the migration run record. This will soft-delete all records created during that specific migration run.
