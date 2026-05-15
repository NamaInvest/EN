# PERFORMANCE AND SCALING

- Large tenant tables must index by `tenantId`.
- Financial transaction wrappers (`runFinancialTx`) should be kept lightweight to prevent database locking.
- Reports should utilize aggregate queries or async background generation for multi-year ledgers.
