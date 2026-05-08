# 85 — Print & Barcode | الطباعة والباركود

## 🟠 الأولوية: عالي (للـ POS والمخزون)

## 🔍 الموجود
- qrcode, qrcode-terminal libraries
- qz-tray (للطباعة المباشرة)

## 🎯 الخطة

### 85.1 — POS Receipt Printing (5 أيام)
- Thermal printers (80mm, 58mm)
- ESC/POS commands
- USB / Network / Bluetooth
- Auto-cut
- Logo + QR

### 85.2 — QZ Tray Integration (3 أيام)
- Direct browser-to-printer
- Bypass print dialog
- Multiple printers (kitchen, bar, receipt)
- Driverless

### 85.3 — Label Printing (5 أيام)
- ZPL (Zebra) — 50mm × 30mm, etc.
- DPL (Datamax)
- EPL
- Item labels
- Shipping labels (AWB)
- Asset tags

### 85.4 — Barcode Generation (3 أيام)
- EAN-13, EAN-8, UPC-A, Code 128, Code 39
- ITF (للكرتون)
- DataMatrix (للمنتجات الصغيرة)
- PDF417 (للوثائق الرسمية)

### 85.5 — QR Codes (3 أيام)
- ZATCA QR (TLV format)
- Payment QR (mada Pay, STC Pay)
- Asset tracking
- Self-checkout
- Customer feedback links

### 85.6 — Barcode Scanning (4 أيام)
- USB scanners (HID — direct keyboard input)
- Camera-based (PWA / mobile)
- Multi-format support
- Continuous scanning mode (للمخزون)

### 85.7 — Print Queue Management (4 أيام)
- BullMQ-based
- Retry on failure
- Multiple printers per branch
- Status tracking
- Reprint capability

### 85.8 — Multi-Printer Setup (3 أيام)
- Receipt printer (cashier)
- Kitchen printer (orders)
- Bar printer (drinks)
- Office printer (reports)
- Per-product/category routing

### 85.9 — Print Templates Editor (5 أيام)
- WYSIWYG
- Variables
- Conditional sections (if VAT > 0)
- Preview
- Per-tenant customization

### 85.10 — Hardware Discovery (3 أيام)
- Auto-detect connected printers
- Test print
- Configuration UI

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Print success rate | غير مقاس | > 99% |
| Scan accuracy | غير مقاس | > 99.9% |
| Print queue depth | غير متابع | < 10 |
| Hardware compat | محدود | شامل |

## ⏱️ المدة: 38 يوم عمل
