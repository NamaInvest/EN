# i18n Translation Plan — Namasoft ERP

> **آخر تحديث:** 2026-05-10
> **يُقرأ مع:** [I18N_PLAN.md](../../I18N_PLAN.md) و [language_audit_report.md](../../language_audit_report.md)

---

## 1. اللغات المدعومة

| Locale | Code | Direction | Priority |
|--------|------|-----------|----------|
| Arabic (Saudi) | `ar-SA` | RTL | 🔴 Primary |
| English | `en` | LTR | 🟠 Secondary |
| Urdu | `ur-PK` | RTL | 🟡 Phase 2 |
| Hindi | `hi-IN` | LTR | 🟡 Phase 2 |
| Filipino | `fil-PH` | LTR | 🟡 Phase 2 |

> Phase 2 languages target labor force languages in KSA.

---

## 2. File Structure

```
src/i18n/
  ├─ ar.json                 ← primary (source of truth)
  ├─ en.json                 ← english mirror
  ├─ ur.json
  ├─ hi.json
  ├─ fil.json
  └─ schema.ts               ← TypeScript type for all keys
```

### Key naming convention

```
module.scope.element       (snake-case in module names allowed)

examples:
  sales.invoice.title
  sales.invoice.field.customer
  sales.invoice.action.post
  common.button.save
  common.error.required
  validation.email.invalid
```

> Hierarchical, not flat. Keep depth ≤ 4.

---

## 3. ICU Message Format

```json
{
  "sales.invoice.summary": "{count, plural, =0 {لا فواتير} =1 {فاتورة واحدة} =2 {فاتورتان} few {# فواتير} many {# فاتورة} other {# فاتورة}}",
  "sales.invoice.total_with_currency": "الإجمالي: {amount, number, ::currency/SAR}"
}
```

- Use ICU plurals for Arabic (6 plural forms).
- Numbers/dates via Intl APIs (`Intl.NumberFormat`, `Intl.DateTimeFormat`) NOT inline.
- Currency formatting via `Intl.NumberFormat` with `currency: 'SAR'`.

---

## 4. Date / Number / Currency Formatting

| Aspect | Arabic | English |
|--------|--------|---------|
| Date | `10 مايو 2026` (or Hijri toggle) | `May 10, 2026` |
| Number | `1٬234٫56` (Arabic separators) | `1,234.56` |
| Currency | `1٬234٫56 ر.س` | `SAR 1,234.56` |
| Time | `12:42 م` | `12:42 PM` |
| Hijri (optional) | `21 ذو القعدة 1447` | rare |

```ts
new Intl.NumberFormat('ar-SA-u-nu-arab', { style: 'currency', currency: 'SAR' })
  .format(1234.56);
// → "١٬٢٣٤٫٥٦ ر.س.‏"

new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { dateStyle: 'long' })
  .format(new Date());
// → Hijri date
```

---

## 5. Translation Workflow

```mermaid
flowchart LR
    Dev[Dev adds key in ar.json] --> Extract[Extraction script<br/>checks all locales have key]
    Extract -->|missing en| Translate[Auto-translate via Gemini<br/>+ human review]
    Translate --> PR[PR review by translator]
    PR --> Merge[Merge to main]
    Merge --> CI[CI re-builds bundles]
```

### Auto-translation scaffold

```bash
npm run i18n:extract        # find new keys → write placeholders
npm run i18n:translate ar→en # Gemini draft translation
npm run i18n:audit          # detect untranslated, redundant, untyped keys
```

---

## 6. RTL/LTR Auto-Mirroring

- All UI uses **logical CSS** (`margin-inline-start`, `padding-inline-end`).
- Test every screen in both directions before shipping.
- Charts (Recharts): manually flip x-axis for RTL when needed.
- Tables: column header text aligns to direction; numeric columns always right-aligned in their LTR context.

---

## 7. Typography & Fonts

```css
:root {
  --font-arabic: 'Tajawal', 'IBM Plex Sans Arabic', system-ui;
  --font-latin:  'Inter', system-ui;
  --font-mono:   'JetBrains Mono', 'Roboto Mono', monospace;
}

html[dir="rtl"] body { font-family: var(--font-arabic); }
html[dir="ltr"] body { font-family: var(--font-latin); }
```

- Subset Arabic font to reduce payload (drop Latin glyphs from Tajawal subset).
- Preload primary font weights only (400, 500, 700).

---

## 8. Bilingual Content (Receipts, Invoices)

- ZATCA invoices MUST be bilingual (Arabic + English) per regulation.
- Side-by-side layout in Arabic-primary direction with English column on the left.
- Numbers stay LTR via `<bdi dir="ltr">`.

---

## 9. Pseudo-localization (testing)

- Locale `xx-pseudo` swaps `a→ä`, `e→ë`, prefixes/suffixes brackets.
- Reveals: clipped text, untranslated strings, missing translations.
- Available via `?locale=xx-pseudo` in dev.

---

## 10. Quality Checks

| Check | When |
|-------|------|
| All keys exist in all locales | CI |
| No empty strings | CI |
| No untyped keys (TypeScript) | tsc |
| No hardcoded strings in components | ESLint rule (planned) |
| Typo / spelling | hunspell-ar / hunspell-en |
| RTL render visual diff | Playwright snapshots |

---

## 11. Translation Memory & Glossary

- Maintain `docs/i18n/glossary.md` with canonical translations:
  - Invoice → فاتورة
  - Receipt → إيصال (NOT فاتورة)
  - Voucher → سند
  - Payment → سداد / مبلغ
  - Posted → مُرحّل
  - Draft → مسودة
- Discrepancies caught by CI lint.

---

## 12. References

- [I18N_PLAN.md](../../I18N_PLAN.md)
- [language_audit_report.md](../../language_audit_report.md)
- [Style Guide](../ux/style-guide.md)
