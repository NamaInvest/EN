# 📋 NamaSoft POS & ERP System - Technical Specification
### Comprehensive Application Report

**Version:** 0.1.0  
**Report Date:** 2026-03-08  
**Developer:** Nama Invest  
**Server:** http://95.217.187.44

---

## 1. Overview

NamaSoft is a comprehensive Point of Sale (POS) and Enterprise Resource Planning (ERP) system designed specifically for the Saudi Arabian market. It supports ZATCA (Zakat, Tax and Customs Authority) e-invoicing requirements including Phase 1 and Phase 2 compliance with digital signing and automated reporting to the Fatoora platform.

---

## 2. Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.1.6 | React web framework (Turbopack) |
| React | 19.2.3 | UI component library |
| TypeScript | 5.x | Programming language |
| Prisma ORM | 5.22.0 | Database management |
| PostgreSQL | - | Relational database |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| Recharts | 3.7.0 | Chart & graph library |
| Lucide React | 0.577.0 | Icon library |
| bcryptjs | 3.0.3 | Password hashing |
| jsonwebtoken | 9.0.3 | JWT authentication |
| jsPDF | 4.2.0 | PDF generation |
| QRCode | 1.5.4 | QR code generation |
| Tesseract.js | 7.0.0 | OCR invoice scanning |
| xlsx | 0.18.5 | Excel import/export |
| PM2 | - | Process manager |
| Nginx | - | Reverse proxy server |

---

## 3. Modules & Pages (25 Pages)

### 3.1 Core Modules

| # | Page | Route | Description |
|---|------|-------|-------------|
| 1 | Login | `/login` | User authentication with username/password |
| 2 | Dashboard | `/dashboard` | Daily stats: sales, purchases, profit, inventory |
| 3 | Point of Sale | `/sales` | Full POS screen with barcode scanning & quick search |
| 4 | Products | `/products` | Product management with barcodes & categories |
| 5 | Customers & Suppliers | `/customers` | Customer and supplier data management |
| 6 | Purchases | `/purchases` | Purchase invoices with OCR support |

### 3.2 Finance & Accounting

| # | Page | Route | Description |
|---|------|-------|-------------|
| 7 | Expenses | `/expenses` | Expense tracking and management |
| 8 | Treasury | `/treasury` | Cash flow management (income/expenditure) |
| 9 | Accounting | `/accounting` | Chart of accounts & journal entries |
| 10 | Installments | `/installments` | Installment plans & payment scheduling |

### 3.3 Inventory

| # | Page | Route | Description |
|---|------|-------|-------------|
| 11 | Stock | `/stock` | Inventory levels & low stock alerts |
| 12 | Stock Transfers | `/stock-transfers` | Inter-warehouse transfers |
| 13 | Stocktake | `/stocktake` | Physical inventory count vs system |

### 3.4 Human Resources

| # | Page | Route | Description |
|---|------|-------|-------------|
| 14 | Employees | `/employees` | Employee records & positions |
| 15 | Attendance | `/attendance` | Daily check-in/check-out tracking |
| 16 | Salaries | `/salaries` | Monthly payroll processing |
| 17 | Vacations | `/vacations` | Employee leave management |

### 3.5 Operations

| # | Page | Route | Description |
|---|------|-------|-------------|
| 18 | Price Quotes | `/price-quotes` | Quotation creation & management |
| 19 | Purchase Orders | `/purchase-orders` | Supplier purchase orders |
| 20 | Sales Returns | `/sales-returns` | Customer return processing |
| 21 | Purchase Returns | `/purchase-returns` | Supplier return processing |
| 22 | Promotions | `/promotions` | Promotional offers & coupons |
| 23 | Bookings | `/bookings` | Customer reservations |
| 24 | Maintenance | `/maintenance` | Device repair & service requests |
| 25 | Reports | `/reports` | Financial & operational reports |

### 3.6 Settings

| Page | Route | Description |
|------|-------|-------------|
| Settings | `/settings` | Company info, tax config, ZATCA, printing |

---

## 4. API Endpoints (44 Endpoints)

### 4.1 Sales & Purchases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/sales` | Invoices (auto-creates: stock, treasury, journal, QR) |
| GET/POST | `/api/purchases` | Purchase invoices |
| POST | `/api/purchases/ocr` | OCR scan supplier invoice image |
| GET/POST | `/api/sales-returns` | Sales returns |
| GET/POST | `/api/purchase-returns` | Purchase returns |
| GET/POST | `/api/price-quotes` | Price quotations |
| GET/POST | `/api/purchase-orders` | Purchase orders |

### 4.2 Products & Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/products` | List/add products |
| GET/PUT/DELETE | `/api/products/[id]` | Update/delete product |
| GET/POST | `/api/categories` | Categories |
| GET/POST | `/api/stock-movements` | Stock movement tracking |
| GET/POST | `/api/stock-transfers` | Stock transfers |
| GET/POST | `/api/stocktake` | Physical inventory |

### 4.3 Customers & Suppliers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/customers` | Customers (type=0) & suppliers (type=1) |
| GET/PUT/DELETE | `/api/customers/[id]` | Update/delete customer |

### 4.4 Finance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/expenses` | Expenses |
| GET/POST | `/api/treasury` | Treasury cash flow |
| GET | `/api/treasury/balance` | Treasury balance |
| GET/POST | `/api/installments` | Installments |

### 4.5 Accounting

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/accounting/accounts` | Chart of accounts (41 accounts) |
| GET/POST | `/api/accounting/journal` | Journal entries |
| GET | `/api/accounting/ledger` | General ledger |
| GET | `/api/accounting/trial-balance` | Trial balance |
| GET | `/api/accounting/balance-sheet` | Balance sheet |
| GET | `/api/accounting/income-statement` | Income statement |

### 4.6 Human Resources

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/employees` | Employee management |
| GET/PUT/DELETE | `/api/employees/[id]` | Update/delete employee |
| GET/POST | `/api/attendance` | Attendance tracking |
| GET/POST | `/api/salaries` | Payroll |
| GET/POST | `/api/vacations` | Leave management |

### 4.7 Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/bookings` | Bookings |
| GET/POST | `/api/maintenance` | Maintenance |
| GET/POST | `/api/promotions` | Promotions |
| GET | `/api/dashboard` | Dashboard statistics |
| GET | `/api/reports/[type]` | Reports (sales, purchases, etc.) |

### 4.8 System

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User authentication |
| GET | `/api/settings` | System settings |
| PUT | `/api/settings/[key]` | Update setting |
| POST | `/api/settings/generate-keys` | Generate ZATCA keys |
| POST | `/api/settings/upload-logo` | Upload company logo |
| POST | `/api/zatca` | ZATCA onboarding |
| GET | `/api/zatca/qr` | QR code generation |
| POST | `/api/telegram/webhook` | Telegram bot webhook |
| POST | `/api/telegram/process` | Process Telegram messages |

---

## 5. Database Schema (45 Models)

### 5.1 Model Summary

| Group | Models | Count |
|-------|--------|-------|
| Users | User, Permission, UserPermission | 3 |
| Products | Category, Unit, Product | 3 |
| Customers | Customer | 1 |
| Warehouses | Stock | 1 |
| Sales | SalesInvoice, SalesInvoiceDetail, SalesReturn | 3 |
| Purchases | PurchaseInvoice, PurchaseInvoiceDetail, PurchaseReturn | 3 |
| Inventory | StockMovement, StockTransfer, StockTransferDetail | 3 |
| Finance | Expense, Treasury, Setting | 3 |
| Accounting | Account, JournalEntry, JournalLine | 3 |
| HR | Employee, Attendance, Salary, Vacation | 4 |
| Operations | PriceQuote, PriceQuoteDetail, Booking, Maintenance | 4 |
| Commerce | Quotation, QuotationItem, Installment, InstallmentPayment | 4 |
| Loyalty | LoyaltyPoint, LoyaltyTransaction | 2 |
| Marketing | Promotion, Coupon, CouponUsage, GiftCard | 4 |
| Procurement | PurchaseOrder, PurchaseOrderItem | 2 |
| Stocktaking | Stocktake, StocktakeItem | 2 |
| System | AuditLog | 1 |
| **Total** | | **45** |

### 5.2 Key Relationships

```
User ──┬── SalesInvoice ──── SalesInvoiceDetail ──── Product
       ├── PurchaseInvoice ── PurchaseInvoiceDetail ── Product
       ├── Treasury
       ├── Expense
       └── StockMovement ──── Product

Customer ──┬── SalesInvoice
           ├── PurchaseInvoice
           ├── Installment ──── InstallmentPayment
           ├── LoyaltyPoint
           └── Booking

Employee ──┬── Attendance
           ├── Salary
           └── Vacation

Account ──── JournalLine ──── JournalEntry
```

---

## 6. Advanced Features

### 6.1 ZATCA E-Invoicing
- **Phase 1:** QR Code generation with seller name, VAT number, timestamp, total, and tax
- **Phase 2:** Digital signing using ZATCA-issued Production CSID certificate
- **Integration:** Automatic invoice reporting to Fatoora platform on every sale
- **Compliance:** Full Saudi e-invoicing regulation support

### 6.2 Telegram Bot Integration
- Add expenses via Telegram messages
- Add purchases via Telegram
- Real-time notifications

### 6.3 OCR Invoice Scanning
- Convert supplier invoice images to structured data
- Extract product names, prices, and quantities automatically
- Server-side processing using Tesseract.js

### 6.4 Accounting Reports
- Trial Balance
- Balance Sheet
- Income Statement
- General Ledger
- Sales & Purchase Reports

### 6.5 Loyalty & Promotions System
- Customer loyalty points (Bronze, Silver, Gold tiers)
- Multiple coupon types (percentage, fixed, BOGO)
- Gift cards with balance tracking
- Promotion types: Buy & Get, Percentage, Fixed Amount, Happy Hour

### 6.6 Mobile Responsive Design
- Fully responsive design for all screen sizes
- Mobile-optimized POS screen
- Safe Area support for notched devices
- Breakpoints: 360px, 480px, 768px, 1024px

---

## 7. Infrastructure

| Component | Details |
|-----------|---------|
| Hosting | Hetzner VPS |
| Operating System | Ubuntu Linux |
| Web Server | Nginx (Reverse Proxy) |
| Process Manager | PM2 |
| Database | PostgreSQL |
| URL | http://95.217.187.44 |
| Internal Port | 3000 |

---

## 8. Security

| Feature | Status |
|---------|--------|
| Password Hashing | ✅ bcrypt |
| JWT Authentication | ✅ jsonwebtoken |
| API Data Leak Protection | ✅ passwordHash filtered |
| ZATCA Keys Protection | ✅ Filtered in Settings API |
| Audit Trail | ✅ AuditLog model |
| User Permissions | ✅ Role-based (admin, cashier, accountant) |

---

## 9. Current Data Statistics

| Item | Count |
|------|-------|
| Products | 10,620 |
| Customers | 1 |
| Sales Invoices | 31 |
| Purchase Invoices | 1 |
| Expenses | 9 |
| Treasury Transactions | 42 |
| Chart of Accounts | 41 accounts |
| Journal Entries | 24 |
| Categories | 2 |

---

*This report was automatically generated on 2026-03-08*
