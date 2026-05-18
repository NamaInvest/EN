# Phase 4.2 Settings & Finance Config Security Scan

| File | Severity | Risk | Issue |
|---|---|---|---|
| src\app\api\settings\api-keys\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\api-keys\[id]\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\approvals\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\approvals\[id]\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\settings\approvals\[id]\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\settings\approvals\[id]\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\currencies\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\currencies\[id]\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\settings\currencies\[id]\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\settings\currencies\[id]\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\exchange-rates\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\settings\exchange-rates\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\settings\exchange-rates\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\exchange-rates\[id]\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\settings\exchange-rates\[id]\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\settings\exchange-rates\[id]\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\generate-barcode\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\settings\generate-barcode\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\settings\generate-barcode\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\generate-keys\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\settings\generate-keys\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\settings\generate-keys\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\permissions\fields\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\settings\permissions\fields\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\settings\permissions\fields\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\settings\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\upload-logo\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\zatca-onboard\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\settings\[key]\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\settings\[key]\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\settings\[key]\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\system\numbering\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\assets\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\finance\assets\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\finance\assets\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\auto-ecl\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\bank-recon\rules\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\cash-flow\forecast\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\finance\cash-flow\forecast\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\finance\cash-flow\forecast\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\checks\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\finance\checks\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\checks\[id]\process\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\finance\checks\[id]\process\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\consolidation\elimination\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\finance\consolidation\elimination\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\payment-run\propose\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\finance\payment-run\propose\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\finance\payment-run\propose\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\payment-run\[id]\approve\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\finance\payment-run\[id]\approve\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\finance\payment-run\[id]\approve\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\payment-run\[id]\confirm\route.ts | **HIGH** | Unsafe feature toggles | Config mutated without strict Zod schema |
| src\app\api\finance\payment-run\[id]\confirm\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\payment-run\[id]\send-bank\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\finance\payment-run\[id]\send-bank\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\finance\payment-run\[id]\send-bank\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\period-close\route.ts | **CRITICAL** | Cross-company config mutation | Settings mutated without explicit admin/owner RBAC check |
| src\app\api\finance\petty-cash\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\finance\petty-cash\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\petty-cash\[id]\process\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\finance\petty-cash\[id]\process\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\reconciliations\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\finance\reconciliations\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
| src\app\api\finance\reconciliations\[id]\route.ts | **CRITICAL** | Global Config Poisoning | Missing tenantId in config DB operation |
| src\app\api\finance\reconciliations\[id]\route.ts | **MEDIUM** | Missing AuditLog | Config state mutation without auditLog |
