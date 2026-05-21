# i18n Key Context Directory

This directory stores visual context for translators to understand where and how a translation key is used in the UI.

## Structure per Key

For each key (e.g. `common.save`), create a markdown file like `common.save.md` containing:

```markdown
# Key: common.save

## Current Translations
- **ar**: حفظ
- **en**: Save
- **ur**: محفوظ کریں
- **hi**: सहेजें
- **fil**: I-save

## UI Context
![Save Button Screenshot](/docs/assets/screenshots/common-save-btn.png)

## Constraints
- Max length: 15 characters
- Used in: All forms footer

## Notes for Translator
Keep it short and action-oriented. This is the primary submit button for forms.
```
