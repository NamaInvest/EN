# Arabic Mojibake / Encoding Corruption Scan Report

- **Total Files Scanned:** 5699
- **Total Suspicious Files:** 8
- **Total Suspicious Strings:** 186

---

## Analysis of Corruption Types & Decoding Strategies

Based on the patterns identified:
1.  **Type A (Windows-1256 Double-Encoding):**
    - *Pattern:* repeated sequences like `ط·آ·ط¢آ·` or `ط·آ¢`.
    - *Cause:* UTF-8 text containing Arabic was read/interpreted as Windows-1256 (Arabic Windows code page) and subsequently saved/re-encoded as UTF-8.
    - *Decoding Strategy:* Convert UTF-8 bytes to Latin-1/Windows-1256 and back to UTF-8. Specifically, the bytes `0xD8 0xA7` (ا) became `طآ` under Windows-1256 interpretation.
2.  **Type B (Windows-1252 / ISO-8859-1 Multi-stage Mojibake):**
    - *Pattern:* `â€ک`, `â‚¬`, `أ¢â€ڑ`, `Ø§`.
    - *Cause:* UTF-8 encoded Arabic letters and Euro symbols decoded as Windows-1252, then re-encoded as UTF-8 (and sometimes re-encoded again).
    - *Decoding Strategy:* Reconstruct the original bytes and decode as UTF-8.

---

## Detailed Findings

### 📄 [08-database-models-full.md](file:///d:/namasoft9-3-main/.ai-brain/08-database-models-full.md)
- **Full Path:** `d:\namasoft9-3-main\.ai-brain\08-database-models-full.md`
- **Suspicious Strings:** 25

| Line | Pattern | Corrupted Snippet | Proposed Decoded / Correct Action | Confidence | Action |
|---|---|---|---|---|---|
| 685 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 695 | `/ط·آ·ط¢آ·/g` | `\| `codeHint` \| `String` \| // first 2 chars in plain (for display "ABط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 1139 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 1222 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 1242 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 1302 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 1401 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 1740 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 1949 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 2509 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 3029 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 3896 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 3909 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 3950 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 3962 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 5126 | `/ط·آ·ط¢آ·/g` | `\| `firstFiveYearsAmount` \| `Decimal` \| @map("first_five_years_amount") @db.Decimal(15, 2) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 5127 | `/ط·آ·ط¢آ·/g` | `\| `remainingYearsAmount` \| `Decimal` \| @map("remaining_years_amount") @db.Decimal(15, 2) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 5185 | `/ط·آ·ط¢آ·/g` | `\| `iban` \| `String` \| // IBAN ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 5545 | `/ط·آ·ط¢آ·/g` | `\| `basisDescription` \| `String` \| // "5 SAR per km ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 6061 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 6103 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 6727 | `/ط·آ·ط¢آ·/g` | `\| `deletedAt` \| `DateTime?` \| // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 7018 | `/ط·آ·ط¢آ·/g` | `\| `emailSubject` \| `String` \| // "ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 9078 | `/ط·آ·ط¢آ·/g` | `\| `embedding` \| `Float[]` \| // migrated to vector(768) via raw SQL ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 9141 | `/ط·آ·ط¢آ·/g` | `\| `recoverability` \| `String?` \| // PROBABLE \| UNCERTAIN ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |

### 📄 [audit_results.json](file:///d:/namasoft9-3-main/audit_results.json)
- **Full Path:** `d:\namasoft9-3-main\audit_results.json`
- **Suspicious Strings:** 1

| Line | Pattern | Corrupted Snippet | Proposed Decoded / Correct Action | Confidence | Action |
|---|---|---|---|---|---|
| 7555 | `/â€/g` | `"label": "{/* The actual panel â€” opens DOWNWARD */}",` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |

### 📄 [FLOAT_FIELDS_AUDIT.json](file:///d:/namasoft9-3-main/FLOAT_FIELDS_AUDIT.json)
- **Full Path:** `d:\namasoft9-3-main\FLOAT_FIELDS_AUDIT.json`
- **Suspicious Strings:** 9

| Line | Pattern | Corrupted Snippet | Proposed Decoded / Correct Action | Confidence | Action |
|---|---|---|---|---|---|
| 7 | `/ط·آ·ط¢آ·/g` | `"line": "factor       Float   @default(1) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 12 | `/ط·آ·ط¢آ·/g` | `"line": "unitStock    Float   @default(0) @map(\"unit_stock\") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 17 | `/ط·آ·ط¢آ·/g` | `"line": "parentQty    Float   @default(1) @map(\"parent_qty\") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 512 | `/ط·آ·ط¢آ·/g` | `"line": "planned     Float    @default(0) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 517 | `/ط·آ·ط¢آ·/g` | `"line": "actual      Float    @default(0) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 707 | `/ط·آ·ط¢آ·/g` | `"line": "mohMaxPrice     Float    @default(0) @map(\"moh_max_price\") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 712 | `/ط·آ·ط¢آ·/g` | `"line": "copayPercent     Float    @default(20) @map(\"copay_percent\") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 727 | `/ط·آ·ط¢آ·/g` | `"line": "insuranceAmount  Float     @map(\"insurance_amount\") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 732 | `/ط·آ·ط¢آ·/g` | `"line": "patientAmount    Float     @map(\"patient_amount\") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |

### 📄 [schema.prisma](file:///d:/namasoft9-3-main/prisma/schema.prisma)
- **Full Path:** `d:\namasoft9-3-main\prisma\schema.prisma`
- **Suspicious Strings:** 58

| Line | Pattern | Corrupted Snippet | Proposed Decoded / Correct Action | Confidence | Action |
|---|---|---|---|---|---|
| 88 | `/ط·آ·ط¢آ·/g` | `deletedAt        DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 100 | `/ط·آ·ط¢آ·/g` | `codeHint         String // first 2 chars in plain (for display "ABط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 633 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 727 | `/ط·آ·ط¢آ·/g` | `deletedAt      DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 752 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 826 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 950 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 1273 | `/ط·آ·ط¢آ·/g` | `// Zakat classification ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 1360 | `/ط·آ·ط¢آ·/g` | `// ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 1380 | `/ط·آ·ط¢آ·/g` | `deletedAt    DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 1640 | `/ط·آ·ط¢آ·/g` | `deletedAt   DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 2289 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 2896 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3918 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3934 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3982 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3997 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 5456 | `/ط·آ·ط¢آ·/g` | `firstFiveYearsAmount Decimal @map("first_five_years_amount") @db.Decimal(15, 2) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 5457 | `/ط·آ·ط¢آ·/g` | `remainingYearsAmount Decimal @map("remaining_years_amount") @db.Decimal(15, 2) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 5523 | `/ط·آ·ط¢آ·/g` | `iban             String // IBAN ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 5993 | `/ط·آ·ط¢آ·/g` | `basisDescription String // "5 SAR per km ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 6676 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 6738 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 7513 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 7851 | `/ط·آ·ط¢آ·/g` | `emailSubject  String // "ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 8494 | `/ط·آ·ط¢آ·/g` | `// Computes the zakat base = (Equity + LT Liabilities) ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 8495 | `/ط·آ·ط¢آ·/g` | `// Then zakatDue = base ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 8709 | `/ط·آ·ط¢آ·/g` | `// ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 8711 | `/ط·آ·ط¢آ·/g` | `// ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10104 | `/ط·آ·ط¢آ·/g` | `// AI-02 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10106 | `/ط·آ·ط¢آ·/g` | `// tokens on every request. Only an ID + expiry is stored ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10123 | `/ط·آ·ط¢آ·/g` | `// AI-07 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10141 | `/ط·آ·ط¢آ·/g` | `// AI-07 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10161 | `/ط·آ·ط¢آ·/g` | `// AI-15 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10170 | `/ط·آ·ط¢آ·/g` | `embedding        Float[] // migrated to vector(768) via raw SQL ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10185 | `/ط·آ·ط¢آ·/g` | `// xP&A ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10200 | `/ط·آ·ط¢آ·/g` | `// P0-02 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10222 | `/ط·آ·ط¢آ·/g` | `// P0-02 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10243 | `/ط·آ·ط¢آ·/g` | `// F-01 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10258 | `/ط·آ·ط¢آ·/g` | `recoverability    String? // PROBABLE \| UNCERTAIN ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10285 | `/ط·آ·ط¢آ·/g` | `// F-02 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10314 | `/ط·آ·ط¢آ·/g` | `// F-03 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10372 | `/ط·آ·ط¢آ·/g` | `// F-04 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10411 | `/ط·آ·ط¢آ·/g` | `// F-05 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10436 | `/ط·آ·ط¢آ·/g` | `// F-06 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10460 | `/ط·آ·ط¢آ·/g` | `// O-01 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10472 | `/ط·آ·ط¢آ·/g` | `// O-02 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10485 | `/ط·آ·ط¢آ·/g` | `// O-03 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10499 | `/ط·آ·ط¢آ·/g` | `// O-05 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10512 | `/ط·آ·ط¢آ·/g` | `// P-01 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10538 | `/ط·آ·ط¢آ·/g` | `// P-02 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10550 | `/ط·آ·ط¢آ·/g` | `// P-03 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10562 | `/ط·آ·ط¢آ·/g` | `// H-01 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10576 | `/ط·آ·ط¢آ·/g` | `// H-02 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10590 | `/ط·آ·ط¢آ·/g` | `// H-03 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10602 | `/ط·آ·ط¢آ·/g` | `// I-01 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10635 | `/ط·آ·ط¢آ·/g` | `// I-02 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 10648 | `/ط·آ·ط¢آ·/g` | `// I-03 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |

### 📄 [schema_decimal_migration.prisma](file:///d:/namasoft9-3-main/prisma/schema_decimal_migration.prisma)
- **Full Path:** `d:\namasoft9-3-main\prisma\schema_decimal_migration.prisma`
- **Suspicious Strings:** 61

| Line | Pattern | Corrupted Snippet | Proposed Decoded / Correct Action | Confidence | Action |
|---|---|---|---|---|---|
| 46 | `/ط·آ·ط¢آ·/g` | `defaultPage          String?               @map("default_page") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 318 | `/ط·آ·ط¢آ·/g` | `factor       Decimal   @default(1) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 320 | `/ط·آ·ط¢آ·/g` | `unitStock    Decimal   @default(0) @map("unit_stock") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 321 | `/ط·آ·ط¢آ·/g` | `parentUnitId Int?    @map("parent_unit_id") // id ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 322 | `/ط·آ·ط¢آ·/g` | `parentQty    Decimal   @default(1) @map("parent_qty") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 323 | `/ط·آ·ط¢آ·/g` | `sortOrder    Int     @default(0) @map("sort_order") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 2310 | `/ط·آ·ط¢آ·/g` | `type          String // PAYABLE (ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 2501 | `/ط·آ·ط¢آ·/g` | `category    String // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¸` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 2503 | `/ط·آ·ط¢آ·/g` | `planned     Decimal    @default(0) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 2504 | `/ط·آ·ط¢آ·/g` | `actual      Decimal    @default(0) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 2525 | `/ط·آ·ط¢آ·/g` | `paymentTerms    String?  @map("payment_terms") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 2639 | `/ط·آ·ط¢آ·/g` | `// --- 1. Fixed Assets (ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 2663 | `/ط·آ·ط¢آ·/g` | `// --- 2. CRM Leads & Opportunities (ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 2684 | `/ط·آ·ط¢آ·/g` | `// --- 3. Fleet Management (ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 2707 | `/ط·آ·ط¢آ·/g` | `// --- 4. Property Management (ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 2742 | `/ط·آ·ط¢آ·/g` | `// --- 5. Quality Control (ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3359 | `/ط·آ·ط¢آ·/g` | `// ==================== 106. Work Shifts (ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3363 | `/ط·آ·ط¢آ·/g` | `name      String // "ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3372 | `/ط·آ·ط¢آ·/g` | `// ==================== 107. Vendor Ratings (ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3378 | `/ط·آ·ط¢آ·/g` | `quality    Int      @default(5) // 1-5 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3379 | `/ط·آ·ط¢آ·/g` | `delivery   Int      @default(5) // 1-5 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3380 | `/ط·آ·ط¢آ·/g` | `pricing    Int      @default(5) // 1-5 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3388 | `/ط·آ·ط¢آ·/g` | `// ==================== 108. Fiscal Periods (ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3541 | `/ط·آ·ط¢آ·/g` | `// ==================== 109. Service Tickets (ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3588 | `/ط·آ·ط¢آ·/g` | `// ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3589 | `/ط·آ·ط¢آ·/g` | `// ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¸ط·آ·ط¢آ·ط·آ¢ط¢آ£ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ£ط·آ¢ط¢آ¢ط·آ£ط¢آ¢ط£آ¢أ¢â‚¬ع‘ط¢آ¬ط·آ¹أ¢â‚¬ع©ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3590 | `/ط·آ·ط¢آ·/g` | `// ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¸ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3591 | `/ط·آ·ط¢آ·/g` | `// ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3593 | `/ط·آ·ط¢آ·/g` | `// ==================== PH-1. ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3597 | `/ط·آ·ط¢آ·/g` | `productId       Int      @unique @map("product_id") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3598 | `/ط·آ·ط¢آ·/g` | `sfdaNumber      String   @map("sfda_number") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3599 | `/ط·آ·ط¢آ·/g` | `genericName     String   @map("generic_name") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3605 | `/ط·آ·ط¢آ·/g` | `mohMaxPrice     Decimal    @default(0) @map("moh_max_price") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3607 | `/ط·آ·ط¢آ·/g` | `isControlled    Boolean  @default(false) @map("is_controlled") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3620 | `/ط·آ·ط¢آ·/g` | `// ==================== PH-2. ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3633 | `/ط·آ·ط¢آ·/g` | `copayPercent     Decimal    @default(20) @map("copay_percent") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3647 | `/ط·آ·ط¢آ·/g` | `// ==================== PH-3. ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3652 | `/ط·آ·ط¢آ·/g` | `wasfatyRef       String?   @map("wasfaty_ref") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3660 | `/ط·آ·ط¢آ·/g` | `imageUrl         String?   @map("image_url") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3676 | `/ط·آ·ط¢آ·/g` | `// ==================== PH-4. ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3683 | `/ط·آ·ط¢آ·/g` | `dosage         String? // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3695 | `/ط·آ·ط¢آ·/g` | `// ==================== PH-5. ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3703 | `/ط·آ·ط¢آ·/g` | `claimRef         String?   @unique @map("claim_ref") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3705 | `/ط·آ·ط¢آ·/g` | `insuranceAmount  Decimal     @map("insurance_amount") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3706 | `/ط·آ·ط¢آ·/g` | `patientAmount    Decimal     @map("patient_amount") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3720 | `/ط·آ·ط¢آ·/g` | `// ==================== PH-6. ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3734 | `/ط·آ·ط¢آ·/g` | `// ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3745 | `/ط·آ·ط¢آ·/g` | `// ==================== PH-7. ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3874 | `/ط·آ·ط¢آ·/g` | `// ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¸ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3878 | `/ط·آ·ط¢آ·/g` | `entityType    String   @map("entity_type") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3879 | `/ط·آ·ط¢آ·/g` | `entityId      Int      @map("entity_id") // PK ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3880 | `/ط·آ·ط¢آ·/g` | `fieldName     String   @map("field_name") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3888 | `/ط·آ·ط¢آ·/g` | `transactionId String?  @map("transaction_id") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3898 | `/ط·آ·ط¢آ·/g` | `// ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¸ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3904 | `/ط·آ·ط¢آ·/g` | `name           String? // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3907 | `/ط·آ·ط¢آ·/g` | `padLength      Int       @default(6) @map("pad_length") // 6 ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3908 | `/ط·آ·ط¢آ·/g` | `current        BigInt    @default(0) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3911 | `/ط·آ·ط¢آ·/g` | `fiscalYear     Int?      @map("fiscal_year") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3912 | `/ط·آ·ط¢آ·/g` | `fiscalMonth    Int?      @map("fiscal_month") // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3918 | `/ط·آ·ط¢آ·/g` | `// ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |
| 3919 | `/ط·آ·ط¢آ·/g` | `// branchId=null ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط` | Repair to clean Arabic text. | HIGH | MANUAL_REVIEW |

### 📄 [PROJECT_ARCHIVE.md](file:///d:/namasoft9-3-main/project-docs/PROJECT_ARCHIVE.md)
- **Full Path:** `d:\namasoft9-3-main\project-docs\PROJECT_ARCHIVE.md`
- **Suspicious Strings:** 25

| Line | Pattern | Corrupted Snippet | Proposed Decoded / Correct Action | Confidence | Action |
|---|---|---|---|---|---|
| 1437 | `/ط·آ·ط¢آ·/g` | `deletedAt        DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 1448 | `/ط·آ·ط¢آ·/g` | `codeHint         String // first 2 chars in plain (for display "ABط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 1939 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 2027 | `/ط·آ·ط¢آ·/g` | `deletedAt      DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 2050 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 2117 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 2229 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 2604 | `/ط·آ·ط¢آ·/g` | `deletedAt    DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 2841 | `/ط·آ·ط¢آ·/g` | `deletedAt   DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 3433 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 3990 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 4928 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 4943 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 4988 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 5002 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 6254 | `/ط·آ·ط¢آ·/g` | `firstFiveYearsAmount Decimal @map("first_five_years_amount") @db.Decimal(15, 2) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 6255 | `/ط·آ·ط¢آ·/g` | `remainingYearsAmount Decimal @map("remaining_years_amount") @db.Decimal(15, 2) // ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 6316 | `/ط·آ·ط¢آ·/g` | `iban             String // IBAN ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 6693 | `/ط·آ·ط¢آ·/g` | `basisDescription String // "5 SAR per km ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 7239 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 7284 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 7961 | `/ط·آ·ط¢آ·/g` | `deletedAt DateTime? // P1.2 soft-delete ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 8270 | `/ط·آ·ط¢آ·/g` | `emailSubject  String // "ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 10485 | `/ط·آ·ط¢آ·/g` | `embedding        Float[] // migrated to vector(768) via raw SQL ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢` | Repair to clean Arabic text. | HIGH | AUTO_FIX |
| 10558 | `/ط·آ·ط¢آ·/g` | `recoverability    String? // PROBABLE \| UNCERTAIN ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ·ط·آ·ط¢آ·ط·آ¢ط¢آ¢ط·آ·ط¢آ¢ط·آ¢ط¢آ£ط·آ·ط¢آ·ط·آ¢ط¢آ·ط·آ·ط¢آ¢ط·آ¢ط¢آ¢ط·آ` | Repair to clean Arabic text. | HIGH | AUTO_FIX |

### 📄 [project_context.txt](file:///d:/namasoft9-3-main/project_context.txt)
- **Full Path:** `d:\namasoft9-3-main\project_context.txt`
- **Suspicious Strings:** 6

| Line | Pattern | Corrupted Snippet | Proposed Decoded / Correct Action | Confidence | Action |
|---|---|---|---|---|---|
| 65714 | `/â€/g` | `* POST /api/auth/2fa/backup-codes â€” Regenerate backup codes` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 65750 | `/â€/g` | `* POST /api/auth/2fa/login â€” Complete login after 2FA verification` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 65831 | `/â€/g` | `* POST /api/auth/2fa/setup â€” Enable 2FA for the current user` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 65850 | `/â€/g` | `* DELETE /api/auth/2fa/setup â€” Disable 2FA for the current user` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 65887 | `/â€/g` | `* POST /api/auth/2fa/verify â€” Verify a TOTP code` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |
| 66480 | `/â€/g` | `codeHint: backupCode.substring(0, 2) + 'â€¢â€¢-â€¢â€¢' + backupCode.substring(7),` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |

### 📄 [fix_garbled_features.js](file:///d:/namasoft9-3-main/scripts/misc/fix_garbled_features.js)
- **Full Path:** `d:\namasoft9-3-main\scripts\misc\fix_garbled_features.js`
- **Suspicious Strings:** 1

| Line | Pattern | Corrupted Snippet | Proposed Decoded / Correct Action | Confidence | Action |
|---|---|---|---|---|---|
| 20 | `/â€/g` | `"/* The actual panel â€” opens DOWNWARD */": "/* The actual panel — opens DOWNWARD */"` | Repair to clean Arabic text. | LOW | MANUAL_REVIEW |


## Database Mojibake Scan Results

This section documents the read-only scan of PostgreSQL text fields for corrupted Arabic data patterns.

### 🗄️ Database: `n1`
- **Total Corrupted Columns Found:** 0

*No Arabic mojibake or encoding corruption found in this database!* ✅

### 🗄️ Database: `n11`
- **Total Corrupted Columns Found:** 0

*No Arabic mojibake or encoding corruption found in this database!* ✅

### 🗄️ Database: `namasoft`
- **Total Corrupted Columns Found:** 0

*No Arabic mojibake or encoding corruption found in this database!* ✅

### 🗄️ Database: `namasoft_main`
- **Total Corrupted Columns Found:** 0

*No Arabic mojibake or encoding corruption found in this database!* ✅

### 🗄️ Database: `nama_medical_web`
- **Total Corrupted Columns Found:** 0

*No Arabic mojibake or encoding corruption found in this database!* ✅

### 🗄️ Database: `smart_trading_db`
- **Total Corrupted Columns Found:** 0

*No Arabic mojibake or encoding corruption found in this database!* ✅

### 🗄️ Database: `spark_technology_db`
- **Total Corrupted Columns Found:** 0

*No Arabic mojibake or encoding corruption found in this database!* ✅

