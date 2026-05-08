# 28 — Sales & POS | المبيعات ونقاط البيع

## 🟠 الأولوية: عالي | الاكتمال: 60%

## 🔍 الموجود
- SalesOrder, SalesInvoice, DeliveryNote
- Quotation
- POS basic
- Customer management

## 🔴 الفجوات
- Quote-to-Cash flow غير مكتمل
- لا Sales Pipeline / CRM
- POS UX ضعيف
- لا Multi-store/Multi-terminal management
- لا Loyalty / Rewards programs
- لا Promotions engine متقدم
- لا Returns / Exchanges مؤتمت
- لا Gift cards / Vouchers
- Pricing rules بسيطة
- لا Sales targets & commissions

## 🎯 الخطة

### 28.1 — Quote-to-Cash Flow (5 أيام)
- Quote → SO → DN → Invoice
- State machine enforcement
- Approval based on margin

### 28.2 — Mini CRM (8 أيام)
- Leads, Opportunities, Pipeline
- Contact management
- Activities (calls, emails, meetings)
- Forecast accuracy

### 28.3 — POS Modernization (10 أيام)
- Touch-optimized UI
- Offline mode (PWA)
- Multiple payment methods
- Split payments
- Layaway / Lay-buy
- Suspended sales
- Returns at POS

### 28.4 — Loyalty Program (6 أيام)
- Points earning rules
- Tiers (Silver/Gold/Platinum)
- Redemption rules
- Birthday rewards
- Referral program

### 28.5 — Promotions Engine (5 أيام)
- Buy X get Y
- Bundle discounts
- Time-based (happy hour)
- Customer-specific
- Conditional rules

### 28.6 — Pricing Rules (4 أيام)
- Price lists per customer/group
- Volume discounts
- Contract pricing
- Bid pricing
- FX-based prices

### 28.7 — Returns & Exchanges (4 أيام)
- Reason codes
- Refund methods (cash, credit note, voucher)
- Restocking fees
- Auto-update inventory

### 28.8 — Sales Targets & Commissions (5 أيام)
- Per salesperson, region, product
- Tiered commissions
- Auto-calculation per period
- Dispute mechanism

### 28.9 — Multi-Store Management (5 أيام)
- Store hierarchy
- Inter-store transfers
- Centralized vs decentralized pricing
- Consolidated reports

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Average transaction value | غير مقاس | tracked |
| POS transaction time | غير محدد | < 30s |
| Loyalty enrollment | لا | > 40% |
| Quote-to-order conversion | غير مقاس | tracked |

## ⏱️ المدة: 52 يوم عمل
