# 01: Quote-to-Cash (Q2C)

**Flow**: Lead → Quote → Order → Inventory Issue → Invoice → Payment.
**Modules Touched**: 8
**Integration Point**: The Event Bus triggers the AccountingEngine upon Payment to auto-post Journal Entries.