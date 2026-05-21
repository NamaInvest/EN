# 🗄️ Database Architecture (ERD)

Welcome to the Nama Invest ERP Database Schema overview. Since the schema contains over 600 models, it has been automatically split into modular diagrams for readability. 

## 🗺️ Module Diagrams

### 1. 💼 Accounting Module
![Accounting ERD](./accounting.svg)

### 2. 🛒 Sales & Customers
![Sales ERD](./sales.svg)

### 3. 📦 Purchases & Suppliers
![Purchases ERD](./purchases.svg)

### 4. 🧮 Inventory & Logistics
![Inventory ERD](./inventory.svg)

### 5. 🏭 Manufacturing & Production
![Manufacturing ERD](./manufacturing.svg)

### 6. 👥 HR & Payroll
![HR ERD](./hr.svg)

### 7. 🏦 Treasury & Banking
![Treasury ERD](./treasury.svg)

### 8. 🏢 Fixed Assets
![Fixed Assets ERD](./fa.svg)

### 9. 🤖 AI Capabilities
![AI ERD](./ai.svg)

### 10. 🇸🇦 ZATCA E-Invoicing
![ZATCA ERD](./zatca.svg)

### 11. 🛡️ Master Tenant & Security
![Master Tenant ERD](./master_tenant.svg)

### 12. 🔗 Common & Uncategorized
![Common ERD](./common.svg)

---

## 🏷️ Badge Legend

- **`🔴 Tenant`**: Tenant Isolated (Multi-tenant Foreign Key).
- **`🟡 Controlled`**: Controlled Account/Entity.
- **`[SD]`**: Soft Delete Enabled (`deletedAt`).
- **`External Module`**: Table referenced from another module (Foreign Key link).

> **Note**: This file and all SVGs are auto-generated via `.github/workflows/erd.yml` and `.husky/pre-commit` hooks.
