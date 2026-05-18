# Seed Data Architecture

## Goal
To provide a repeatable, idempotent, and non-destructive initialization mechanism that prepares the ERP system for immediate production use, testing, and multi-tenant onboarding.

## The Architecture

### 1. Modularity
The seed scripts are divided functionally (e.g., `core-settings`, `financial-accounts`, `zatca-configurations`, `demo-users`). This allows administrators to seed specific domains without nuking the entire database.

### 2. Idempotency & Upserting
Seed files heavily utilize Prisma's `upsert` mechanism. 
- **Non-Destructive:** Running the seed script multiple times will **not** duplicate records. 
- **Updates over Overwrites:** If a core configuration (like a default ZATCA setting) changes in a new system version, the seed script will update the existing record rather than failing or duplicating.

### 3. Tenant Awareness
While base configurations (like globally supported currencies or system-wide roles) are tenant-agnostic, the seed architecture supports injecting base tenant records. When a new tenant is provisioned, a subset of the seed scripts dynamically executes to populate their specific Chart of Accounts, default warehouses, and POS settings.

### 4. Integrity Constraints
Seed operations execute inside transactional blocks. If the financial chart of accounts fails to seed correctly due to a constraint violation, the entire tenant provisioning sequence is aborted and rolled back to maintain a pristine state.
